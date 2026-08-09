/**
 * Capture PNGs for reel-packs/field-size. Not part of the app build.
 * Run: node scripts/capture-field-size-pack.mjs
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../content/user-help/videos/reel-packs/field-size')
const url = process.env.CAPTURE_URL || 'https://shooters-tools.com/uk/stage-builder'

fs.mkdirSync(outDir, { recursive: true })

async function dismissOnboarding(page) {
  for (const name of [/Почати роботу/i, /Почати/i, /Start/i, /Зрозуміло/i]) {
    const btn = page.getByRole('button', { name })
    try {
      if (await btn.first().isVisible({ timeout: 1200 })) {
        await btn.first().click()
        await page.waitForTimeout(400)
        return
      }
    } catch {
      /* continue */
    }
  }
  await page.keyboard.press('Escape')
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, name), type: 'png' })
  console.log('wrote', name)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(2500)
  await dismissOnboarding(page)
  await page.waitForTimeout(600)

  // Clear accidental stage name if any
  const nameInput = page.locator('.app__stage-name, input[placeholder*="назв" i], input[aria-label*="назв" i]').first()
  try {
    if (await nameInput.isVisible({ timeout: 1000 })) {
      await nameInput.fill('')
      await nameInput.blur()
    }
  } catch {
    /* ok */
  }

  await shot(page, '01_title.png')

  const w = page.locator('.app__field-size-input').nth(0)
  const h = page.locator('.app__field-size-input').nth(1)
  await w.click()
  await w.fill('20')
  await w.blur()
  await h.click()
  await h.fill('30')
  await h.blur()
  await page.waitForTimeout(700)
  await shot(page, '02_enter_20x30.png')

  // Open presets: native <select> — use locator + evaluate to keep open is hard;
  // instead select 20x30 then re-open by focusing and showing options via screenshot after click
  const presets = page.locator('select.app__field-size-presets')
  await presets.focus()
  // Pick 20×30 for demo consistency, then screenshot with menu expanded via size attribute trick
  await presets.selectOption({ label: /20\s*[×x]\s*30/i }).catch(async () => {
    await presets.selectOption('20x30').catch(() => {})
  })
  await page.waitForTimeout(400)
  // Expand select for visual (size)
  await presets.evaluate((el) => {
    el.size = Math.min(el.options.length, 9)
  })
  await page.waitForTimeout(300)
  await shot(page, '03_preset_open.png')
  await presets.evaluate((el) => {
    el.size = 1
  })
  await page.waitForTimeout(300)

  await shot(page, '04_grid_plan.png')

  const zin = page.locator('.app__view-nav-btn--zoom-in')
  for (let i = 0; i < 8; i++) {
    await zin.click()
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(400)
  await shot(page, '05_zoom.png')

  await page.goto('https://shooters-tools.com/uk', { waitUntil: 'networkidle', timeout: 90000 })
  await page.waitForTimeout(1200)
  await shot(page, '06_cta.png')

  await browser.close()
  console.log('done', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
