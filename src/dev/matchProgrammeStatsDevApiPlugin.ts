import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

import type { VercelRequest, VercelResponse } from '@vercel/node'

const PATH = '/api/match-programme-stats'

function applyCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function shimVercelResponse(res: ServerResponse): VercelResponse {
  const out = res as ServerResponse & {
    status?: (code: number) => VercelResponse
    json?: (o: unknown) => VercelResponse
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
  return out as unknown as VercelResponse
}

let handlerCache: ((req: VercelRequest, res: VercelResponse) => unknown) | undefined

/** Dev-only: GET /api/match-programme-stats (needs SUPABASE_SERVICE_ROLE_KEY in .env). */
export function matchProgrammeStatsDevApiPlugin(): Plugin {
  return {
    name: 'dev-match-programme-stats-api',
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
          query: Object.fromEntries(new URL(req.url ?? '', 'http://local').searchParams),
          socket: nodeRes.socket,
        } as VercelRequest

        if (!handlerCache) {
          const mod = await import('../server/matchProgrammeStatsApiHandler.ts')
          handlerCache = mod.default
        }

        await Promise.resolve(handlerCache!(vercelReq, shimVercelResponse(nodeRes)))
      })
    },
  }
}
