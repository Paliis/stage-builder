/**
 * Captures only real, currently available UI for the ecosystem hero pack.
 * Release-dependent frames (library → match, registrations, payment, PSC export)
 * intentionally remain pending until their real UI is available.
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../content/user-help/videos/reel-packs/ecosystem-hero')
const prod = 'https://shooters-tools.com'
const staging = 'https://stage-builder-staging.vercel.app'

fs.mkdirSync(outDir, { recursive: true })

async function shot(page, file) {
  await page.screenshot({ path: path.join(outDir, file), type: 'png' })
  console.log('wrote', file)
}

async function dismissOnboarding(page) {
  for (const name of [/Почати роботу/i, /Почати/i, /Зрозуміло/i]) {
    const button = page.getByRole('button', { name })
    try {
      if (await button.first().isVisible({ timeout: 700 })) {
        await button.first().click()
        await page.waitForTimeout(300)
        return
      }
    } catch {
      // Continue through possible labels.
    }
  }
  await page.keyboard.press('Escape')
}

async function clickCanvas(page, xFraction, yFraction) {
  const canvas = page.locator('canvas.stage-canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Stage canvas is not visible')
  await page.mouse.click(box.x + box.width * xFraction, box.y + box.height * yFraction)
  await page.waitForTimeout(180)
}

async function openGroup(page, label) {
  const summary = page.locator('summary').filter({ hasText: label }).first()
  await summary.scrollIntoViewIfNeeded()
  const details = summary.locator('xpath=..')
  if (!(await details.getAttribute('open'))) await summary.click()
  await page.waitForTimeout(200)
}

async function buildDemoStage(page) {
  const name = page.locator('input.app__stage-name').first()
  if (await name.isVisible()) {
    await name.fill('Демо вправи')
    await name.blur()
  }

  const w = page.locator('.app__field-size-input').nth(0)
  const h = page.locator('.app__field-size-input').nth(1)
  await w.fill('20')
  await w.blur()
  await h.fill('30')
  await h.blur()

  await openGroup(page, /^Папір$/)
  await page.locator('.app__tb--paper').filter({ hasText: /IPSC/ }).last().click()
  await clickCanvas(page, 0.42, 0.28)
  await clickCanvas(page, 0.68, 0.32)
  await page.keyboard.press('Escape')

  await openGroup(page, /^Метал$/)
  await page.locator('.app__tb--metal').filter({ hasText: /Поппер/ }).first().click()
  await clickCanvas(page, 0.56, 0.45)
  await page.keyboard.press('Escape')

  await openGroup(page, /^Щити$/)
  const portShield = page.locator('.app__tb-prop--shield').filter({ hasText: /порт/i }).first()
  if (await portShield.isVisible()) {
    await portShield.click()
    await clickCanvas(page, 0.54, 0.58)
    await page.keyboard.press('Escape')
  }

  await openGroup(page, /^Обладнання$/)
  await page.locator('.app__tb-prop--start').click()
  await clickCanvas(page, 0.52, 0.78)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  })

  // Real portal ecosystem / CTA frames.
  await page.goto(`${staging}/uk`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(1200)
  await shot(page, '01_portal_ecosystem.png')
  await shot(page, '11_cta.png')

  // Real public Matches entry point. It is empty today, so this is suitable
  // only as a teaser background, not as proof of organizer capabilities.
  await page.goto(`${staging}/uk/matches`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(1000)
  await shot(page, '06_matches_catalog_teaser.png')

  // Build a real demo exercise in production UI.
  await page.goto(`${prod}/uk/stage-builder`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(1800)
  await dismissOnboarding(page)
  await buildDemoStage(page)
  const planCanvas = page.locator('canvas.stage-canvas')
  await planCanvas.scrollIntoViewIfNeeded()
  const reset2d = page.locator('.app__view-nav-btn--reset').first()
  if (await reset2d.isVisible()) await reset2d.click()
  await page.waitForTimeout(500)
  await shot(page, '02_stage_2d.png')

  await page.getByText('3D-перегляд', { exact: true }).click()
  await page.waitForTimeout(6000)
  const reset3d = page.locator('.app__view-nav--3d .app__view-nav-btn--reset')
  if (await reset3d.isVisible()) {
    await reset3d.click()
    await page.waitForTimeout(1200)
  }
  await shot(page, '03_stage_3d.png')

  const shooter = page.getByRole('button', { name: /Зона стрільця/i })
  if (await shooter.isVisible()) {
    await shooter.click()
    await page.waitForTimeout(1800)
    await shot(page, '04_shooter_view.png')
  }

  const briefing = page.locator('.app__briefing').first()
  if (await briefing.isVisible()) {
    await briefing.scrollIntoViewIfNeeded()
    const fill = page.getByRole('button', { name: /Підставити.*сцени/i })
    if (await fill.isVisible()) await fill.click()
    await page.waitForTimeout(500)
    await briefing.screenshot({ path: path.join(outDir, '05_briefing_pdf.png'), type: 'png' })
    console.log('wrote 05_briefing_pdf.png')
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
