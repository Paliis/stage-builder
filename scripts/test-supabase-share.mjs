/**
 * Smoke test against live Supabase (BL-001).
 *
 * 1) Anon key: RPC `fetch_shared_stage` for a random id → expect null (no row).
 * 2) If `SUPABASE_SERVICE_ROLE_KEY` is set: insert a test row, anon RPC reads it, then delete.
 *
 * Usage (repo root):
 *   node scripts/test-supabase-share.mjs
 *
 * Reads `.env.local` if present (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Optional: SUPABASE_SERVICE_ROLE_KEY in `.env.local` (never commit; dev-only).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const p = join(__dirname, '..', '.env.local')
  if (!existsSync(p)) return
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    // Same as dotenv: later lines win; overwrite empty strings from parent shell.
    process.env[k] = v
  }
}

loadEnvLocal()

const url = process.env.VITE_SUPABASE_URL?.trim()
const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim()
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !anon) {
  console.error('FAIL: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (e.g. in .env.local)')
  process.exit(1)
}

const anonClient = createClient(url, anon)

async function main() {
  const missingId = `sb-missing-${Date.now()}`
  const { data: miss, error: errMiss } = await anonClient.rpc('fetch_shared_stage', {
    lookup_id: missingId,
  })
  if (errMiss) {
    console.error('FAIL: RPC error for missing id:', errMiss.message)
    process.exit(1)
  }
  if (miss != null) {
    console.error('FAIL: expected null for unknown id')
    process.exit(1)
  }
  console.log('OK: fetch_shared_stage(null) for unknown id')

  if (!service) {
    console.log('SKIP: SUPABASE_SERVICE_ROLE_KEY not set — insert/verify/delete not run')
    console.log('      Add it to .env.local and save the file (Ctrl+S), then run again.')
    console.log('      (If the key is only in the editor buffer, Node reads the file on disk.)')
    return
  }

  const testId = `sb-smoke-${Date.now()}`
  const expires = new Date(Date.now() + 86400000 * 365).toISOString()
  const payload = {
    format: 'stage-builder',
    version: 2,
    stage: {
      name: 'Supabase smoke test',
      weaponClass: 'handgun',
      fieldSizeM: { x: 30, y: 40 },
      fieldGroundCover3d: 'grass',
      targets: [],
      props: [],
      penaltyZoneSet: { polygons: [] },
    },
    briefing: {
      documentTitle: 'Doc',
      exerciseType: 'short',
      targetsDescription: '',
      recommendedShots: '',
      allowedAmmo: '',
      maxPoints: '',
      startSignal: '',
      readyCondition: '',
      startPosition: '',
      procedure: '',
      safetyAngles: '',
    },
  }

  const admin = createClient(url, service)
  const { error: insErr } = await admin.from('shared_stages').insert({
    id: testId,
    mode: 'view',
    payload,
    title: 'Smoke test',
    locale: 'uk',
    expires_at: expires,
  })
  if (insErr) {
    console.error('FAIL: insert:', insErr.message)
    process.exit(1)
  }
  console.log('OK: inserted test row')

  const { data: row, error: fetchErr } = await anonClient.rpc('fetch_shared_stage', { lookup_id: testId })
  if (fetchErr) {
    console.error('FAIL: RPC after insert:', fetchErr.message)
    process.exit(1)
  }
  if (row == null || typeof row !== 'object' || !('payload' in row)) {
    console.error('FAIL: RPC did not return row with payload')
    process.exit(1)
  }
  const pl = row.payload
  const stageName =
    pl && typeof pl === 'object' && 'stage' in pl && pl.stage && typeof pl.stage === 'object'
      ? pl.stage.name
      : null
  if (stageName !== 'Supabase smoke test') {
    console.error('FAIL: expected stage name in payload, got:', stageName)
    process.exit(1)
  }
  console.log('OK: anon RPC returns payload.stage.name')

  const { error: delErr } = await admin.from('shared_stages').delete().eq('id', testId)
  if (delErr) {
    console.error('FAIL: cleanup delete:', delErr.message)
    process.exit(1)
  }
  console.log('OK: deleted test row')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
