/**
 * Capture Stage Builder share-publish dialog for master pack.
 */
import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../content/user-help/videos/reel-packs/ecosystem-master-160s')
const prod = 'https://shooters-tools.com'

fs.mkdirSync(outDir, { recursive: true })

async function dismissOnboarding(page) {
  for (const name of [/Почати роботу/i, /Почати/i, /Зрозуміло/i]) {
    const button = page.getByRole('button', { name })
    try {
      if (await button.first().isVisible({ timeout: 700 })) {
        await button.first().click()
        return
      }
    } catch {
      // next label
    }
  }
  await page.keyboard.press('Escape')
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  })

  await page.goto(`${prod}/uk/stage-builder`, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForTimeout(1800)
  await dismissOnboarding(page)

  const share = page.getByRole('button', { name: /Поділитися|Share/i }).first()
  if (!(await share.isVisible({ timeout: 3000 }))) {
    throw new Error('Share button not found')
  }
  await share.click()
  await page.waitForTimeout(800)

  const dialog = page.locator('.app__share-dialog, .app__onboarding-dialog, [role="dialog"]').first()
  if (await dialog.isVisible({ timeout: 2000 })) {
    await dialog.screenshot({ path: path.join(outDir, '07_share_link.png'), type: 'png' })
  } else {
    await page.screenshot({ path: path.join(outDir, '07_share_link.png'), type: 'png' })
  }
  console.log('wrote 07_share_link.png')
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
