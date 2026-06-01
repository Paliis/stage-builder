import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const PATH = '/api/organizer-mono-payment'
const VERIFY_PATH = '/api/organizer-mono-payment/verify'

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: string | Buffer) => chunks.push(typeof c === 'string' ? Buffer.from(c) : c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function applyCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function shimVercelResponse(res: ServerResponse): VercelResponse {
  const out = res as ServerResponse & {
    status?: (code: number) => VercelResponse
    json?: (o: unknown) => VercelResponse
    send?: (body: string | Buffer) => VercelResponse
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
  out.send = (body: string | Buffer) => {
    if (Buffer.isBuffer(body)) res.end(body)
    else res.end(Buffer.from(body, 'utf8'))
    return out as unknown as VercelResponse
  }
  return out as unknown as VercelResponse
}

let handlerCache: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined
let verifyHandlerCache: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined

export function organizerMonoPaymentDevApiPlugin(): Plugin {
  return {
    name: 'organizer-mono-payment-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const isMain = url === PATH
        const isVerify = url === VERIFY_PATH
        if (!isMain && !isVerify) return next()
        if (req.method !== 'POST' && req.method !== 'DELETE' && req.method !== 'OPTIONS') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        applyCorsHeaders(res)
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        try {
          const body = await readBody(req)
          const vercelReq = req as IncomingMessage & {
            method?: string
            headers: IncomingMessage['headers']
            body?: string
            url?: string
          }
          vercelReq.body = body.length ? body.toString('utf8') : undefined
          vercelReq.url = isVerify ? VERIFY_PATH : PATH

          const vercelRes = shimVercelResponse(res)
          if (isVerify) {
            if (!verifyHandlerCache) {
              const mod = await import('../server/organizerMonoPaymentVerifyApiHandler.ts')
              verifyHandlerCache = mod.default
            }
            await verifyHandlerCache(vercelReq as unknown as VercelRequest, vercelRes)
          } else {
            if (!handlerCache) {
              const mod = await import('../server/organizerMonoPaymentApiHandler.ts')
              handlerCache = mod.default
            }
            await handlerCache(vercelReq as unknown as VercelRequest, vercelRes)
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
