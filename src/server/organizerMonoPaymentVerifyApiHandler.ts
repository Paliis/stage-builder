import type { VercelRequest, VercelResponse } from '@vercel/node'
import baseHandler from './organizerMonoPaymentApiHandler.ts'

/** Vercel route: POST /api/organizer-mono-payment/verify */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const prev = req.url
  req.url = '/api/organizer-mono-payment/verify'
  try {
    return await baseHandler(req, res)
  } finally {
    req.url = prev
  }
}
