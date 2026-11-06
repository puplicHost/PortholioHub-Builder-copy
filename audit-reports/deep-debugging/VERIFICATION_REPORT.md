# Verification Report

## Commands executed and actual results
| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS (exit 0) |
| `npx vitest run __tests__/inline-video.test.ts __tests__/attachment-persistence.test.ts __tests__/experience-reordering.test.ts __tests__/portfolio-save-items.test.ts __tests__/manifest.test.ts` | PASS — 5 files, 16 tests |
| `npx eslint` (changed files) | 0 new errors; pre-existing `no-explicit-any` in `ProjectPageView` and `no-img-element` warnings |
| `npm run build` | PASS after Next.js upgrade (all routes compiled) |
| `npm audit --json` | 0 critical, 5 high (firebase ×4, xlsx ×1) after upgrade; was 1 critical, 7 high |
| Full `npx vitest run` | 82 passed, 2 failed — both pre-existing stale `features-v2.test.ts` expectations (`footerBg` value and `wordSafeTruncate`), unrelated to these changes |
| Next.js version | Upgraded 16.2.12 → 16.4.5 (`eslint-config-next` same) |

## Tests added
- `__tests__/attachment-persistence.test.ts` — itemCards survive save; relative R2 URL persisted; absolute external URL preserved.
- `__tests__/inline-video.test.ts` — video visual normalization; video metadata round-trip; splice; 50 MB; extension-aware detection.

## Tests blocked / not executed
- Browser PDF/DOCX/XLSX/video rendering, playback, seeking, fullscreen, RTL/mobile — no Playwright per instruction.
- Real R2 upload through UI — no isolated synthetic DB/browser session.
- Load/performance measurements — not executed.
- Production DB schema changes — none.

## Manual verification instructions
1. Builder → project item → Card Visual = Video → upload MP4 (<50MB); save, refresh, reopen.
2. Publish; open portfolio: poster + Play; click → inline playback, seek, volume, fullscreen; no autoplay.
3. Repeat with WEBM; try >50MB (client error); try `.mov` (rejected by picker).
4. File Icon: upload PDF/DOCX; Explore → in-app viewer; page nav/zoom (PDF), DOCX render, XLSX sheets, CSV table, TXT/JSON safe text.
5. Home project card (ProjectManager) → Video → upload; publish; inline playback.
6. Private file as another user → 404. Public file in private window → works.
7. Switch Image/File Icon/Video/None; confirm no stale previews/actions and prior assets restored.
8. Remove attachment → save → refresh → stays removed; R2 object not deleted.
9. Mobile 320/375/430 and ar/en RTL/LTR.

## Environment limitations
- Database target is remote Supabase and was not proven isolated; no DB writes/migrations performed.
- `npm run build` required DB access for static export and succeeded this run.
- No secrets printed.