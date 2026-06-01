import type { VercelRequest } from '@vercel/node'

/** Raw body for webhook signature verification (requires `bodyParser: false` on Vercel). */
export async function readVercelRawBody(req: VercelRequest): Promise<Buffer> {
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8')
  if (Buffer.isBuffer(req.body)) return req.body
  if (req.body && typeof req.body === 'object') {
    return Buffer.from(JSON.stringify(req.body), 'utf8')
  }

  const chunks: Buffer[] = []
  const stream = req as unknown as NodeJS.ReadableStream
  await new Promise<void>((resolve, reject) => {
    stream.on('data', (chunk: string | Buffer) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    stream.on('end', () => resolve())
    stream.on('error', reject)
  })
  return Buffer.concat(chunks)
}
