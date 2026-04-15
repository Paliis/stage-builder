/**
 * Vercel's @vercel/node bundler fails to load api/*.ts that import from src/ (FUNCTION_INVOCATION_FAILED on GET/POST).
 * Pre-bundle to a single CommonJS api/publish-share.js during `npm run build`.
 */
import * as esbuild from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'api', 'publish-share.js')

await mkdir(dirname(outFile), { recursive: true })

await esbuild.build({
  entryPoints: [join(root, 'src/server/publishShareApiHandler.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: outFile,
  logLevel: 'info',
})
