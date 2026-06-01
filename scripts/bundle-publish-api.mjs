/**
 * Vercel's @vercel/node bundler fails to load api/*.ts that import from src/ (FUNCTION_INVOCATION_FAILED on GET/POST).
 * Pre-bundle to single CommonJS files under api/ during `npm run build`.
 */
import * as esbuild from 'esbuild'
import { appendFile, mkdir } from 'node:fs/promises'
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
  [
    join(root, 'src/server/organizerMonoPaymentApiHandler.ts'),
    join(root, 'api', 'organizer-mono-payment.js'),
  ],
  [
    join(root, 'src/server/organizerMonoPaymentVerifyApiHandler.ts'),
    join(root, 'api', 'organizer-mono-payment', 'verify.js'),
  ],
  [join(root, 'src/server/createPaymentApiHandler.ts'), join(root, 'api', 'create-payment.js')],
  [
    join(root, 'src/server/reconcileMatchMonoPaymentApiHandler.ts'),
    join(root, 'api', 'payments', 'reconcile.js'),
  ],
  [
    join(root, 'src/server/monoPaymentWebhookApiHandler.ts'),
    join(root, 'api', 'payments', 'webhook', 'mono.js'),
  ],
]

const webhookOut = join(root, 'api', 'payments', 'webhook', 'mono.js')

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

await appendFile(
  webhookOut,
  '\nmodule.exports.config = { api: { bodyParser: false } };\n',
)
