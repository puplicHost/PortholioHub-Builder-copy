# Test Report

## Automated verification executed
| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (Next 16.4.5) |
| Targeted tests: inline-video, subscription-permissions, attachment-persistence, experience-reordering, portfolio-save-items | PASS — 5 files, 20 tests |
| Full suite | 86+ passed; 2 pre-existing stale `features-v2.test.ts` failures (unrelated) |

## Tests added
- `__tests__/inline-video.test.ts`:
  - aspect normalize/default (`auto` for legacy, known ratios accepted, bogus → auto)
  - `aspectRatioValue` mapping
  - independent image/video ratio round-trip through `itemCards`

## Not executed (manual browser required)
- Refresh on Builder homepage / project page / section editor restores context.
- URL parameters persist through refresh and normal navigation.
- Scroll restoration.
- Aspect ratio live preview, save/refresh persistence, published rendering.
- Arabic RTL / English LTR and mobile layouts.
- Video poster/playback frame ratio and click-to-play.

## Manual test steps
1. Builder → open a project page → select a section → note URL (`?page=…&section=…`).
2. Refresh → same page/section editor should be active.
3. Open a card, set Image ratio 16:9 and Video ratio 9:16 → save → refresh → reopen; both retained independently.
4. Publish → verify card frame ratios on the public portfolio; images not distorted, videos poster-first/click-to-play.
5. Delete/rename a restored page ID in URL → verify safe fallback, no crash/loop.
6. Sign out / expire session → login redirect works; no auth bypass.

## Limitations
- No Playwright/browser automation per project rules.
- No isolated DB-backed test environment was used; no production writes.