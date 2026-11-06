# Inline Video Verification Report

## Automated checks executed
| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| ESLint (changed files) | 0 errors (2 warnings: pre-existing img, unused-disable removed) |
| `__tests__/inline-video.test.ts` | PASS (video visual, metadata round-trip, 50 MB limit) |
| `__tests__/attachment-persistence.test.ts` | PASS |
| `__tests__/manifest.test.ts` | PASS |
| Combined targeted suite | 8/8 PASS |

## Verified by code review
- Video option appears in Card Visual (BuilderClient + ProjectManager).
- Video upload uses `uploadToR2` (no duplicate implementation).
- Client rejects >50 MB and non-MP4/WEBM in Builder handlers.
- Server presign/initiate/complete enforce 50 MB and verify actual object size.
- Persistence: `externalUrl` + `itemCards` metadata; save sanitizer accepts relative URLs.
- Published card: poster + Play; no `<video>` until click; Explore link suppressed for video.
- Playback uses range-capable same-origin content route; no autoplay.

## Not executed (requires browser/manual)
1. Upload MP4 (<50 MB) and WEBM (<50 MB) end-to-end.
2. Reject >50 MB client/server (unit-tested limit; UI not exercised).
3. Verify actual R2 size rejection in live flow.
4. Save → refresh → reopen Builder restores video.
5. Publish → inline poster/Play in the card.
6. No autoplay (muted or unmuted).
7. Play/pause/seek/volume/fullscreen in-card.
8. Replace/remove persistence.
9. Image/File Icon/None regressions.
10. Private video authorization in another session.
11. Mobile/RTL layout.

## Manual test steps
1. Builder → project page item → Card Visual = Video.
2. Upload a small MP4; confirm preview, filename, size.
3. Save, refresh, reopen → video still attached.
4. Publish; open portfolio → poster + Play only; click Play → inline playback with seeking.
5. Repeat with WEBM; try >50 MB (expect error); remove and re-check.
6. Verify Image and File Icon cards unchanged; None shows nothing.
7. Open private video as another user → 404.

## Remaining blockers
- Browser automation not permitted; visual/playback checks are manual.
- No production data, migration, or deployment changes.