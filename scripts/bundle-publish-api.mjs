/**
 * Vercel's @vercel/node bundler fails to load api/*.ts that import from src/ (FUNCTION_INVOCATION_FAILED on GET/POST).
 * Pre-bundle to single CommonJS files under api/ during `npm run build`.
 */
import * as esbuild from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

await mkdir(join(root, 'api'), { recursive: true })

const bundles = [
  [join(root, 'src/server/publishShareApiHandler.ts'), join(root, 'api', 'publish-share.js')],
  [
    join(root, 'src/server/matchExportPscApiHandler.ts'),
    join(root, 'api', 'match-export-psc.js'),
  ],
]

for (const [entry, outfile] of bundles) {
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile,
    loader: { '.json': 'json' },
    logLevel: 'info',
  })
}
