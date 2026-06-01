import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const CREATE_PATH = '/api/create-payment'
const WEBHOOK_PATH = '/api/payments/webhook/mono'

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: string | Buffer) => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function applyCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sign')
}

function shimRes(res: ServerResponse): VercelResponse {
  const out = res as ServerResponse & {
    status?: (code: number) => VercelResponse
    json?: (o: unknown) => VercelResponse
    end?: () => VercelResponse
  }
  out.status = (code: number) => {
    res.statusCode = code
    return out as unknown as VercelResponse
  }
  out.json = (payload: unknown) => {
    if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
    return out as unknown as VercelResponse
  }
  out.end = () => {
    res.end()
    return out as unknown as VercelResponse
  }
  return out as unknown as VercelResponse
}

let createHandler: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined
let webhookHandler: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined

export function matchPaymentsDevApiPlugin(): Plugin {
  return {
    name: 'match-payments-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        const isCreate = path === CREATE_PATH
        const isWebhook = path === WEBHOOK_PATH
        if (!isCreate && !isWebhook) return next()

        if (req.method === 'OPTIONS') {
          applyCors(res)
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        try {
          const buf = await readBody(req)
          const vercelReq = req as IncomingMessage & {
            method?: string
            headers: IncomingMessage['headers']
            body?: string | Buffer
          }
          vercelReq.body = buf.length ? buf.toString('utf8') : undefined

          const vercelRes = shimRes(res)
          if (isCreate) {
            applyCors(res)
            if (!createHandler) {
              createHandler = (await import('../server/createPaymentApiHandler.ts')).default
            }
            await createHandler(vercelReq as unknown as VercelRequest, vercelRes)
          } else {
            if (!webhookHandler) {
              webhookHandler = (await import('../server/monoPaymentWebhookApiHandler.ts')).default
            }
            await webhookHandler(vercelReq as unknown as VercelRequest, vercelRes)
          }
        } catch (e) {
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'dev_api_error' }))
          }
        }
      })
    },
  }
}
