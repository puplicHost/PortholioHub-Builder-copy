# Template Switching & Customer Data Preservation Plan

## Safety Contract

Switching templates must change only **presentation** (`appearance.template`). Specifically:
- No delete/update of `Profile.bio`, sections, skill/project records.
- No row migration or convert/delete.
- No duplicate project/media records.
- No change user ownership, visibility or URLs.
- No setting used to silently reset appearance colors.

## Storage model

Use the already Json `appearance` value in `UserProfile` (schema `model`).

- Read `appearance.template`. Whitelist.
- Write:
  ```ts
  appearance = { ...existing, template: 'editorial-marketing' }
  ```
- Always keep existing profile/appearance fields intact; object spread.
- No Prisma model change or migration (except possibly add validation later).

Initial `template` value = absent -> classic default. Old rows untouched.

## Switching flow (no immediate implementation required)

1. Resolve public template server-side.
2. Preview in builder **without writing** (`LivePreview` filtered/read-only state).
3. Explicit "Apply this template" action updates only `appearance.template`.
4. Confirmation modal if:
   - signed-in user is changing from current active template; OR
   - free user is selecting paid-gating sample template (if any locks).
5. Server action allowlists new template strings.
6. Publish/Draft parity: switching applies to underlying profile object and affects both (portfolio published from row).
7. Rollback path: set `template='classic'` via builder.

## Preventing content-loss scenarios

- Undefined `about.stats`: render empty, never substitute numbers.
- Empty brands array: render section only if `clients.items.length > 0`.
- Empty projects: only render existing projects; no fake.
- Missing avatar: fallback initial or neutral plate (no example profile)
- No client logo `url`: don't render anchor.
- Case study pages missing? only list `showInProjects` or referenced project pages.
- Attachment case study with no items → show cover+body only.
- If the new template doesn't implement a section (e.g. gallery), it is silently omitted in render, but **data stays**; switching Classic back shows it again.
- Fields classic read but template doesn't (e.g. contact section) appear if present and visible.

## Failure handling

- Invalid template ID → resolver falls back to classic.
- React render errors → wrap template in `ErrorBoundary` and display "portfolio temporarily unavailable" rather than crashing page.
- Missing component (not deployed) → safe classic.
- Unpublished/drafts: `/u` only published, preview renders regardless.
- Project page broken route → existing referenced fallback from `ProjectPageView` remains appropriate; template component receives `profile` scope resolved from same fetch (no extra fetch).

## Back to Classic

- Set template empty/ID omitted.
- Classic renders exactly previous data and layout; no history loss.
- Preview and public site remain identical as they reference same row.

## Test intent (future)

- DB fixture row remains unchanged after switch (byte equality of extracted appearance except template field).
- E2E after implementation to verify persistence.
