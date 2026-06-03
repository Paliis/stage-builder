import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const PATH = '/api/match-export-briefings'
const requireFromDev = createRequire(import.meta.url)
const bundledHandlerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../api/match-export-briefings.js',
)

function applyCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function shimVercelResponse(res: ServerResponse): VercelResponse {
  const out = res as ServerResponse & {
    status?: (code: number) => VercelResponse
    json?: (o: unknown) => VercelResponse
    send?: (body: string | Buffer | Uint8Array) => VercelResponse
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
  out.send = (body: string | Buffer | Uint8Array) => {
    if (Buffer.isBuffer(body)) res.end(body)
    else if (body instanceof Uint8Array) res.end(Buffer.from(body))
    else res.end(Buffer.from(body, 'utf8'))
    return out as unknown as VercelResponse
  }
  return out as unknown as VercelResponse
}

let handlerCache: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined

function loadBundledHandler(): (req: VercelRequest, res: VercelResponse) => unknown {
  if (!handlerCache) {
    const mod = requireFromDev(bundledHandlerPath) as {
      default: (req: VercelRequest, res: VercelResponse) => unknown
    }
    handlerCache = mod.default
  }
  return handlerCache!
}

/** Dev-only: GET /api/match-export-briefings (needs SUPABASE_SERVICE_ROLE_KEY in .env.local). */
export function matchExportBriefingsDevApiPlugin(): Plugin {
  return {
    name: 'dev-match-export-briefings-api',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = typeof req.url === 'string' ? req.url.split('?')[0] : ''
        if (pathOnly !== PATH) {
          next()
          return
        }

        const nodeRes = res as unknown as ServerResponse

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
          applyCorsHeaders(nodeRes)
          nodeRes.statusCode = 503
          nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8')
          nodeRes.end(
            JSON.stringify({
              error: 'Briefings export API is not configured (SUPABASE_SERVICE_ROLE_KEY)',
            }),
          )
          return
        }

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
          query: Object.fromEntries(new URL(req.url ?? '', 'http://local').searchParams),
          socket: nodeRes.socket,
        } as VercelRequest

        try {
          await Promise.resolve(loadBundledHandler()(vercelReq, shimVercelResponse(nodeRes)))
        } catch (e) {
          if (!nodeRes.headersSent) {
            nodeRes.statusCode = 500
            nodeRes.setHeader('Content-Type', 'application/json; charset=utf-8')
            nodeRes.end(
              JSON.stringify({
                error: e instanceof Error ? e.message : 'Briefings export failed',
              }),
            )
          }
        }
      })
    },
  }
}
