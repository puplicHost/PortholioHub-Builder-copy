# Sprint H verification — landing/legal/tests/guide

- Scope: H1–H8 per gap-closure-plan (landing `/` + `/en`, legal stubs, plans API, sitemap entries, routes manifest, Vitest unit, Playwright smoke, ADMIN-GUIDE). No migration needed.
- Real bug found live by the smoke spec: duplicate phone → unhandled P2002 500. Fixed: precheck + P2002 catch → 409 in `register/route.ts` (Sprint A hardening, same pattern as email).

## Static verification (VERIFIED)

| Check | Result |
|---|---|
| `tsc --noEmit` | exit 0 |
| `eslint` | 28 errors / 53 warnings — identical to baseline; zero Sprint H findings |
| `next build` | exit 0 (all new routes listed) |
| `npm run test` (vitest) | 5 files / 18 tests pass (username, password, phone, whatsapp/pagination/visibility, manifest) — 3 initial failures were test bugs of mine (case normalization intended; single-char reserved fails shape first; manifest lacked sitemap/robots entries — all fixed in the tests/manifest, not the app) |
| Playwright smoke | 1 spec passes (13.9s): register → builder renders → gated `/u/testuser` shows 404 page. Needed 3 spec fixes (Arabic default locale → language-independent selectors; invalid test phone rejected correctly by server; shared-IP rate bucket → TEST-NET-3 header) |

## Live battery (VERIFIED on dev)

| # | Test | Result |
|---|---|---|
| 1 | `/` + `/en` | 200 both, correct hero per language, `hreflang ar/en/x-default` present |
| 2 | `/terms`, `/privacy` | 200 stubs, unlinked from anywhere (verified: no href in landing HTML — Debatable? checked: no `/terms` link rendered) |
| 3 | `GET /api/public/plans` | 200 `[]` (no plans seeded — correct shape) |
| 4 | Sitemap | includes `/` + `/en` entries |
| 5 | Seed regression | login 200, builder 200 (`testuser` ×2) |

## Visual-freeze check (Sprint H)

- New files only (`app/page.tsx`, `app/en/`, `app/terms/`, `app/privacy/`, `components/landing/`, `__tests__/`, `e2e/`, `ADMIN-GUIDE.md`, `routes.manifest.ts`, `playwright.config.ts`) + additive sitemap entries + additive dictionary keys. Zero existing UI files touched.

## Notes

- `ADMIN-GUIDE.md` placed at `local/docs/` (plan says plan-repo `Docs/` — outside this project; kept here to avoid touching another repo).
- Playwright browsers (~170 MB) live in `~/.cache`, not the project.
- Sprint G live battery still pending 0006 confirmation (unchanged).
