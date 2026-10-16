# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: conflict.spec.ts >> autosave + two-tab conflict modal
- Location: e2e/conflict.spec.ts:10:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Saved', { exact: true }).first()
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Saved', { exact: true }).first() with timeout 60000ms
  - waiting for getByText('Saved', { exact: true }).first()

```

```yaml
- heading "Newer changes found" [level=2]
- paragraph: This portfolio was saved elsewhere (another tab or device) after you started editing. Reloading discards your unsaved edits; overwriting keeps them and saves on top of the latest version.
- button "Reload latest"
- button "Overwrite with mine"
- banner:
  - link "View Live Portfolio":
    - /url: /u/conflictb
  - heading "Portfolio Builder" [level=1]
  - button "Undo"
  - button "Redo"
  - text: Unsaved changes
  - button "Profile menu"
  - button "Desktop View"
  - button "Mobile View"
  - link "View Live":
    - /url: /u/conflictb
  - button "Notifications"
  - button "Publish"
- complementary:
  - button "Sections"
  - button "Pages"
  - paragraph: Portfolio Sections
  - button "Drag to reorder"
  - text: hero
  - button "Hide Section"
  - button "Drag to reorder"
  - text: about
  - button "Hide Section"
  - button "Drag to reorder"
  - text: experience
  - button "Hide Section"
  - button "Drag to reorder"
  - text: skills
  - button "Hide Section"
  - button "Drag to reorder"
  - text: services
  - button "Hide Section"
  - button "Drag to reorder"
  - text: projects
  - button "Hide Section"
  - button "Drag to reorder"
  - text: testimonials
  - button "Hide Section"
  - button "Drag to reorder"
  - text: footer
  - button "Hide Section"
  - status
  - text: Insights
  - link "Analytics":
    - /url: /profile/builder/analytics
  - button "Theme & Bio Settings"
- main:
  - navigation:
    - link "CO":
      - /url: "#"
    - list:
      - listitem:
        - link "about":
          - /url: "#about"
      - listitem:
        - link "experience":
          - /url: "#experience"
      - listitem:
        - link "services":
          - /url: "#services"
      - listitem:
        - link "Projects":
          - /url: "#projects"
      - listitem:
        - link "Testimonials":
          - /url: "#testimonials"
      - listitem:
        - link "Contact":
          - /url: "#contact"
    - button "Toggle theme"
  - button "Back to top"
  - main:
    - text: CO
    - heading "Conflict Test" [level=1]
    - paragraph
    - link "View My Work":
      - /url: "#projects"
    - link "Contact Me":
      - /url: "#contact"
    - heading "About Me" [level=2]
    - heading "Work Experience" [level=2]
    - paragraph: A journey through my professional career
    - paragraph: No experience added yet.
    - heading "Services" [level=2]
    - paragraph: Services coming soon.
    - heading "Projects" [level=2]
    - paragraph: No projects added yet.
    - heading "Testimonials" [level=2]
    - paragraph: What clients say
    - paragraph: Client testimonials coming soon.
    - heading "Work with me" [level=2]
    - paragraph: Let's build something great together.
    - text: © 2026 · Developed with
    - link "PortfolioHub":
      - /url: https://portholiohub.pages.dev/
- complementary:
  - text: Edit | Theme & Bio
  - heading "Portfolio Settings" [level=3]
  - button "Reset to defaults"
  - text: Username (URL)
  - textbox "e.g. john": conflictb
  - paragraph: portfoliohub.com/u/conflictb
  - text: Default Color Mode
  - combobox:
    - option "Light" [selected]
    - option "Dark"
  - text: Font Family
  - combobox:
    - option "Inter" [selected]
    - option "Poppins"
    - option "Raleway"
    - option "Nunito"
    - option "Lato"
    - option "Montserrat"
    - option "Rubik"
  - heading "🎨 Site Colors" [level=3]
  - heading "Light Mode" [level=4]
  - text: Background Color (light)
  - textbox: "#f9fafb"
  - textbox "#f9fafb"
  - text: Text Color (light)
  - textbox: "#1f2937"
  - textbox "#1f2937"
  - heading "Dark Mode" [level=4]
  - text: Background Color (dark)
  - textbox: "#111827"
  - textbox "#111827"
  - text: Text Color (dark)
  - textbox: "#f3f4f6"
  - textbox "#f3f4f6"
  - heading "Global (apply to both modes)" [level=4]
  - text: Primary Color
  - textbox: "#0066cc"
  - textbox "#60a5fa": "#0066cc"
  - text: Border Color
  - textbox: "#e5e7eb"
  - textbox "#e5e7eb"
  - paragraph: Controls box and card borders across the site.
  - text: Outline / Focus Color
  - textbox: "#60a5fa"
  - textbox "#60a5fa"
  - paragraph: Controls focus rings and outlines across the site.
  - heading "Language & Direction" [level=3]
  - text: Portfolio Language
  - combobox:
    - option "English (LTR)" [selected]
    - option "العربية (RTL)"
    - option "Both (Multilingual Toggle)"
  - paragraph: Sets the primary display direction and language for your public portfolio.
  - heading "Branding" [level=3]
  - text: Logo Image
  - textbox "Image URL"
  - button "Upload"
  - button "Choose File"
  - paragraph: Shown in the navbar. Leave empty to show initials.
  - heading "Floating Buttons" [level=3]
  - text: Show Scroll to Top Button
  - button
  - text: Show WhatsApp Floating Button
  - button
  - text: WhatsApp Phone Number
  - textbox "+201234567890"
  - paragraph: Include country code (e.g. +20...).
  - text: Unsaved changes
  - button "Save Changes"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Sprint F4: autosave fires without clicking Save; a second tab saving on
  4  | // a stale version opens the conflict modal (Reload path asserted).
  5  | // Uses a fresh account per run; the ghost dev server on :3001 serves HMR.
  6  | // Fresh client identity per load (TEST-NET-3 range): the auth rate limiter
  7  | // keys anonymous traffic by IP, and re-runs would exhaust one bucket.
  8  | test.use({ extraHTTPHeaders: { 'X-Forwarded-For': `203.0.113.${1 + (Date.now() % 250)}` } });
  9  | 
  10 | test('autosave + two-tab conflict modal', async ({ browser }) => {
  11 |   const stamp = Date.now();
  12 |   const email = `conflict${stamp}@portfoliohub.test`;
  13 |   const phone = `+2010${String(stamp).slice(-8)}`;
  14 | 
  15 |   const context = await browser.newContext();
  16 |   const pageA = await context.newPage();
  17 | 
  18 |   // Register in tab A → lands in builder, no manual save from here on.
  19 |   await pageA.goto('/register');
  20 |   await pageA.locator('input[type="text"]').fill('Conflict Test');
  21 |   await pageA.locator('input[type="email"]').fill(email);
  22 |   await pageA.locator('input[type="tel"]').fill(phone);
  23 |   await pageA.locator('input[type="password"]').fill('Conflict123!');
  24 |   await pageA.locator('button[type="submit"]').click();
  25 |   await expect(pageA).toHaveURL(/\/profile\/builder/, { timeout: 30000 });
  26 | 
  27 |   const usernameBox = (page: typeof pageA) => page.getByPlaceholder('e.g. john');
  28 | 
  29 |   // Tab B (same session): change username, autosave persists it.
  30 |   const pageB = await context.newPage();
  31 |   await pageB.goto('/profile/builder');
  32 |   await expect(pageB.getByPlaceholder('e.g. john')).toBeVisible({ timeout: 60000 });
  33 |   await pageB.getByPlaceholder('e.g. john').fill('conflictb');
> 34 |   await expect(pageB.getByText('Saved', { exact: true }).first()).toBeVisible({ timeout: 60000 });
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  35 | 
  36 |   // Tab A still holds the stale version: its autosave must hit conflict.
  37 |   await usernameBox(pageA).fill('conflicta');
  38 |   await expect(pageA.getByText('Newer changes found')).toBeVisible({ timeout: 60000 });
  39 | 
  40 |   // Reload path: modal closes, newer value arrives.
  41 |   await pageA.getByRole('button', { name: 'Reload latest' }).click();
  42 |   await expect(pageA.getByText('Newer changes found')).toBeHidden({ timeout: 30000 });
  43 | 
  44 |   await context.close();
  45 | });
  46 | 
```