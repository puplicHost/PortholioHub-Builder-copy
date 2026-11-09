# Security and Entitlements Audit

Read-only source review. No penetration testing, no database access, no runtime probing. Findings are marked **Confirmed** (source proves the behavior) or **Likely** (source strongly indicates it; runtime confirmation needed).

## 1. Trust boundaries and assets

- **Anonymous visitor** → public portfolio page and project detail route.
- **Authenticated owner** → Builder, own portfolio server actions, R2 presigned uploads.
- **Admin** → admin API routes (outside the deep scope of this portfolio audit).
- Assets: personal portfolio content, contact details, uploaded media, subscription state, admin-hidden status, analytics aggregates.
- Authority: subscription entitlement is resolved from `Subscription` rows (`getSubscriptionState`) and never from client input (`entitlements.ts:11–20`).

## 2. Entitlement enforcement — verified

| Control | Implementation | Result |
| --- | --- | --- |
| Server-side plan resolution | `getEntitlements` → `getSubscriptionState` (DB) | ✅ never trusts client flags |
| Subscription lookup failure | throws; `updatePortfolio` catch returns failure before any transaction | ✅ fail-closed |
| Free locked sections | filtered out of save payload **and** stripped from public/preview via `stripLockedSectionsForFree` | ✅ |
| Free standalone pages | creation blocked (`createProjectPage`), creation/update via `updatePortfolio` coerced to cards, removal protected | ✅ |
| Pro-only template activation | raw `appearance.template` checked before validation/writes; `PRO_TEMPLATE_REQUIRED` rejects the whole save | ✅ |
| Template schema hygiene | `safeTemplate` allow-list; invalid strings dropped from persisted JSON | ✅ **except** F-07 usability side effect |
| Project detail Pro gate | `isPortfolioVisible` + `canViewLockedSections` on detail route | ✅ |
| Public home visibility | `status === PUBLISHED && !adminHidden` (no subscription check) | ⚠️ intentional or inconsistent (F-35) |
| Admin preview | read-only UI; no save path | ✅ |

### F-07 (Critical, availability/UX — not privilege escalation)
A downgraded user whose stored appearance contains `template:'editorial-marketing'` cannot save any content, because the Builder always sends the full appearance and the guard rejects it. The data is not corrupted and no privilege is gained; the user is blocked until they switch to Classic. Entitlement logic itself is correct.

### F-35 (Low/Medium) — visibility semantics differ by route
`src/lib/visibility.ts` documents the requirement as PUBLISHED + not hidden + ACTIVE/GRACE, but the public **home** route only checks PUBLISHED/not hidden (`u/[username]/page.tsx:35–48`). Only the project detail route applies the subscription check. This is a product decision that is currently encoded twice with different rules; if Free published portfolios are intended to be public, the helper comment/contract should be corrected (and vice versa).

## 3. Object-level authorization (IDOR) — verified

| Action | Ownership enforcement | Result |
| --- | --- | --- |
| `updatePortfolio` | ignores client `data.id`; resolves own profile by `userId`; section/project writes scoped to own profile | ✅ |
| `deleteSection` | `deleteMany({ id, page: { profile: { userId } } })` | ✅ |
| `deleteProjectPage` | findFirst scoped to own profile; then delete own row | ✅ |
| `createProjectPage` | creates under own profile only | ✅ |
| `publishProfile` / `unpublishProfile` | own profile by `userId` | ✅ |
| `getPortfolioAnalytics` / `getAdminWorkspaceContent` | own profile / own workspaces | ✅ |
| R2 `[id]` download/delete | public read by design; private requires owner; delete requires owner | ✅ |
| File viewer | public file readable; private requires owner | ✅ |

### F-19 (High, Likely) — `updateProjectPage` is a mass-assignment / entitlement-bypass action (currently unused by the UI)
- `updateProjectPage(id, data)` checks ownership and the *current* `showInProjects`, then passes `pageData = { ...data }` minus `items` straight into `prisma.projectPage.update` (`actions/portfolio.ts:1105–1135`).
- No allow-list of writable fields. A crafted invocation by an authenticated owner can set at least:
  - `profileId` — reassign the page to **another user's profile** (cross-tenant write) if the target profile id is known,
  - `showInProjects: false` on a card row — **create a standalone Pro-only page on a Free plan**, bypassing `canCreateStandaloneProjectPage`,
  - `isPublished`, `slug`, `sortOrder`, etc.
- The action is not referenced by any client component, but it is exported from a `'use server'` module, so Next registers it as a callable Server Action. **Runtime confirmation of the endpoint exposure is required**; the mass-assignment defect itself is confirmed.
- Fix: delete the action (unused), or reduce the payload to an allow-list and re-check entitlements against the *requested* `showInProjects`, then re-fetch ownership by `profile.userId`.

### F-18 (High, Confirmed) — hard-coded individual customer email in a production Server Action
`getOrCreateProfile` excludes two client-section migrations for a specific personal email (`actions/portfolio.ts:201, 209`). This is:
- a privacy problem (personal/account identifier committed to source),
- a correctness problem (one account silently receives different data-migration behavior),
- a maintainability/release-risk problem (no documented reason; the special case is not configurable).
Do not reproduce the address in reports/tickets. Recommend removing and handling the account through normal data migration/back-office tooling.

## 4. Server-side validation and output safety

- Section content is validated with per-type zod schemas; unknown envelope keys are rejected, counts capped, URLs restricted to http/https/mailto/tel/site-relative, `plainText` rejects `<`/`>`, appearance colors restricted to hex/rgb/hsl, font names charset-guarded (`portfolio-schema.ts`).
- Project payload validation is intentionally shallow (count only); `updatePortfolio` nevertheless sanitizes URLs/slugs and stores tags/titles which React escapes. Crafted calls can cause Prisma errors (500) but no injection path identified.
- No user content is rendered via `dangerouslySetInnerHTML` in either template. Classic injects only static CSS; JSON-LD escapes `<`.
- `ProjectPageView` file viewer sanitizes DOCX HTML through `sanitizeHtml` before injection (`FileViewer.tsx:230–252`).
- `sanitizeUrl` blocks `javascript:`, `data:`, `vbscript:`, `file:` and normalizes bare domains; all templates and project detail use it.
- External links use `target="_blank"` with `rel="noreferrer"` (which implies `noopener` in modern browsers).

### Minor/low-risk observations
- `ProjectPageView` interpolates `appearance.font` into a `fontFamily` style without the charset guard Classic applies (`ProjectPageView.tsx:126–149` + page wrapper). React property assignment prevents HTML/CSS breakout beyond the font family value; impact is cosmetic. Low.
- `updatePortfolio` persists `appearance` unknown keys (`catchall`). A malicious owner can store arbitrary JSON in their own row; no template reads it as HTML. Low.
- The tracking endpoint is public/rate-limited (60/min/IP) and only writes event rows after resolving the username; no auth bypass. Low abuse potential remains (view inflation) — accepted product risk.

## 5. Private media and uploads — verified

- `POST /api/files/r2/presign` requires auth, MIME allow-list, per-type size caps, storage quota reservation tied to the user, and object keys namespaced by user id (`api/files/r2/presign/route.ts`).
- `GET /api/files/r2/{id}/content` streams public files anonymously, private files owner-only; range requests supported (`13–70`).
- Viewer page `page.tsx` enforces the same visibility rule and only allows a same-origin relative `from` path.
- **R2 object lifecycle gap:** deleting project pages/items/media rows does not delete the R2 objects (DB cascade only). Not a confidentiality issue; a retention/cost risk. Low.

## 6. Client-side-only protections (checked for bypass)

- The Builder hides Pro/page features in UI, but the corresponding server actions independently re-check entitlements (except F-19’s `showInProjects` mutation).
- Template activation is UI-previewed only; the authoritative gate is server-side.
- Free section locking is server-side in `updatePortfolio`.
- Client-provided `appearance.template` is normalized by the resolver; unknown values fall back to Classic and are dropped by the schema.
- `initialSubscriptionState` staleness only affects the Builder’s chrome; saves always re-resolve the plan server-side.

## 7. Entitlement transition edge cases

| Case | Behavior | Risk |
| --- | --- | --- |
| Pro → Free, Editorial stored | Saves fail until Classic applied (F-07) | Availability/UX; not a privilege bypass |
| Free → Pro in another tab | Builder still shows locks until reload; server permits | Low UX |
| GRACE period | Treated as paid everywhere | Intentional |
| SUSPENDED (admin `canceledAt`) | Treated as Free immediately even before `expiresAt` | Admin semantics; verify product intent |
| Subscription row missing | NONE/Free; public home still visible for published portfolios | F-35 |
| DB failure during public render | 500 (no fail-open content) | Availability |
| DB failure during save | save rejected before writes | Safe |

## 8. Findings summary

| ID | Severity | Finding | Confidence |
| --- | --- | --- | --- |
| F-18 | High | Hard-coded customer email controls migration behavior | Confirmed |
| F-19 | High | `updateProjectPage` mass assignment + Free→standalone-page bypass | Likely (mass assignment confirmed; endpoint exposure needs runtime check) |
| F-07 | Critical (functional) | Downgraded Editorial user cannot save | Confirmed |
| F-35 | Low/Medium | Public home visibility contract inconsistent with `isPortfolioVisible` | Confirmed |
| — | Low | R2 objects not deleted with DB rows | Confirmed |
| — | Low | `appearance.font` unguarded in project page style | Confirmed, cosmetic |
| — | Informational | Track endpoint allows view inflation | Accepted risk |

## 9. Not audited (out of scope/limitations)
- Admin API routes, payment webhooks, authentication implementation, rate limiting of auth endpoints, CSP/security headers, dependency CVE scan, CI/CD pipeline. No credentials or production data were accessed.
