#!/usr/bin/env node
/**
 * Fast-forward local/remote staging to match origin/main (for Vercel stage-builder-staging).
 * Usage: npm run git:sync-staging
 */
import { execSync } from 'node:child_process'

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' })
}

run('git fetch origin main staging')
const behind = execSync('git rev-list --count origin/staging..origin/main', { encoding: 'utf8' }).trim()
const ahead = execSync('git rev-list --count origin/main..origin/staging', { encoding: 'utf8' }).trim()
console.log(`origin/staging is ${behind} behind, ${ahead} ahead of origin/main`)

if (ahead !== '0') {
  console.error(
    'staging has commits not in main — resolve manually (rebase or reset) before ff-only sync.',
  )
  process.exit(1)
}

if (behind === '0') {
  console.log('staging already matches main.')
  process.exit(0)
}

run('git checkout staging')
try {
  run('git merge --ff-only origin/main')
} catch {
  console.error('fast-forward failed — fix branch divergence manually.')
  process.exit(1)
}
run('git push origin staging')
console.log('staging synced and pushed.')
