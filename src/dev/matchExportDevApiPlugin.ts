import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const PATH = '/api/match-export-psc'

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
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

let handlerCache: ((req: VercelRequest, res: VercelResponse) => void | Promise<void>) | undefined

/** Dev-only: POST /api/match-export-psc via real handler (needs SUPABASE_SERVICE_ROLE_KEY in .env). */
export function matchExportDevApiPlugin(): Plugin {
  return {
    name: 'dev-match-export-psc-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
          next()
          return
        }

        const pathOnly = typeof req.url === 'string' ? req.url.split('?')[0] : ''
        if (pathOnly !== PATH) {
          next()
          return
        }

        const nodeRes = res as unknown as ServerResponse
        applyCorsHeaders(nodeRes)

        const method = (req.method ?? 'GET').toUpperCase()

        if (method === 'OPTIONS') {
          nodeRes.statusCode = 204
          nodeRes.end()
          return
        }

        const vercelReq = {
          method: req.method,
          headers: { ...req.headers } as IncomingMessage['headers'],
          body: {},
          socket: nodeRes.socket,
        } as VercelRequest

        if (method === 'POST') {
          try {
            const raw = await readBody(req as IncomingMessage)
            const text = raw.length ? raw.toString('utf8') : '{}'
            vercelReq.body = JSON.parse(text) as unknown
          } catch {
            vercelReq.body = {}
          }
        }

        if (!handlerCache) {
          const mod = await import('../server/matchExportPscApiHandler.ts')
          handlerCache = mod.default
        }

        await handlerCache(vercelReq, shimVercelResponse(nodeRes))
      })
    },
  }
}
