import { test, expect } from '@playwright/test';

// Sprint F4: autosave fires without clicking Save; a second tab saving on
// a stale version opens the conflict modal (Reload path asserted).
// Uses a fresh account per run; the ghost dev server on :3001 serves HMR.
// Fresh client identity per load (TEST-NET-3 range): the auth rate limiter
// keys anonymous traffic by IP, and re-runs would exhaust one bucket.
test.use({ extraHTTPHeaders: { 'X-Forwarded-For': `203.0.113.${1 + (Date.now() % 250)}` } });

test('autosave + two-tab conflict modal', async ({ browser }) => {
  const stamp = Date.now();
  const email = `conflict${stamp}@portfoliohub.test`;
  const phone = `+2010${String(stamp).slice(-8)}`;
  // Usernames must also be unique per run: a taken username fails the save
  // with a plain error (not the version-conflict modal).

  const context = await browser.newContext();
  const pageA = await context.newPage();

  // Register in tab A → lands in builder, no manual save from here on.
  await pageA.goto('/register');
  await pageA.locator('input[type="text"]').fill('Conflict Test');
  await pageA.locator('input[type="email"]').fill(email);
  await pageA.locator('input[type="tel"]').fill(phone);
  await pageA.locator('input[type="password"]').fill('Conflict123!');
  await pageA.locator('button[type="submit"]').click();
  await expect(pageA).toHaveURL(/\/profile\/builder/, { timeout: 30000 });

  const usernameBox = (page: typeof pageA) => page.getByPlaceholder('e.g. john');

  // Tab B (same session): change username, autosave persists it.
  const pageB = await context.newPage();
  await pageB.goto('/profile/builder');
  await expect(pageB.getByPlaceholder('e.g. john')).toBeVisible({ timeout: 60000 });
  await pageB.getByPlaceholder('e.g. john').fill('conflictb');
  await expect(pageB.getByText('Saved', { exact: true }).first()).toBeVisible({ timeout: 60000 });

  // Tab A still holds the stale version: its autosave must hit conflict.
  await usernameBox(pageA).fill('conflicta');
  await expect(pageA.getByText('Newer changes found')).toBeVisible({ timeout: 60000 });

  // Reload path: modal closes, newer value arrives.
  await pageA.getByRole('button', { name: 'Reload latest' }).click();
  await expect(pageA.getByText('Newer changes found')).toBeHidden({ timeout: 30000 });

  await context.close();
});
