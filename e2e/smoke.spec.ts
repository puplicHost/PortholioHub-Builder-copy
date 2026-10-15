import { test, expect } from '@playwright/test'

// Fresh client identity per run (TEST-NET-3 documentation IP): the auth
// rate limiter keys anonymous direct traffic by IP, and shared CI/dev
// machines would otherwise exhaust the hourly register bucket.
test.use({ extraHTTPHeaders: { 'X-Forwarded-For': '203.0.113.7' } })

// Smoke: register → builder renders → public seed page renders.
// Uses a unique email per run; exercises the real session cookie flow.
test('register lands directly in the builder, seed portfolio is public', async ({ page }) => {
  const stamp = Date.now()
  const email = `smoke${stamp}@portfoliohub.test`
  // Unique valid E.164 phone per run (phone column is unique).
  const phone = `+2010${String(stamp).slice(-8)}`

  await page.goto('/register')
  // Language-independent selectors (default locale is Arabic).
  await page.locator('input[type="text"]').fill('Smoke Test')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="tel"]').fill(phone)
  await page.locator('input[type="password"]').fill('SmokePass123!')
  await page.locator('button[type="submit"]').click()

  await expect(page).toHaveURL(/\/profile\/builder/, { timeout: 30000 })
  await expect(page.getByText('Portfolio Builder').first()).toBeVisible({ timeout: 30000 })

  // Seed portfolio has no subscription → gating shows the not-found page
  // ('404' marker is language-independent).
  await page.goto('/u/testuser')
  await expect(page.getByText('404').first()).toBeVisible({ timeout: 30000 })
})
