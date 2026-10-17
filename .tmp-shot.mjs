import { chromium } from '@playwright/test'

const widths = [390, 768, 1440]
const browser = await chromium.launch()
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 })

  // Scroll through the whole page so every scroll-reveal fires.
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await page.waitForTimeout(90)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(900)

  await page.screenshot({ path: `/tmp/opencode/home-${w}.png`, fullPage: true })

  const metrics = await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length
    const rects = {}
    for (const id of ['features', 'how', 'plans']) {
      const el = document.getElementById(id)
      rects[id] = el ? Math.round(el.getBoundingClientRect().width) : null
    }
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      revealed: q('.ph-landing [data-reveal].is-in'),
      totalReveal: q('.ph-landing [data-reveal]'),
      hiddenLeft: Array.from(document.querySelectorAll('.ph-landing [data-reveal]:not(.is-in)')).length,
      gridOverride: getComputedStyle(document.querySelector('.ph-grid-features')).gridTemplateColumns,
    }
  })
  console.log(`\n=== ${w}px ===`, JSON.stringify(metrics))
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none')
  await ctx.close()
}
await browser.close()
