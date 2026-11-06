# In-App File Viewer — Verification Report

## Static verification executed
| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run build` | BLOCKED — DB unreachable (Prisma P1001) during static export of /admin/plans |
| ESLint on viewer/content route | 0 errors (1 pre-existing `<img>` warning) |
| `__tests__/attachment-persistence.test.ts` | 2/2 PASS |
| `__tests__/manifest.test.ts` | 2/2 PASS |

## Implemented and code-verified
- Viewer route resolves MediaFile and enforces public/owner access.
- Content route streams with Range/206/HEAD.
- PDF → same-origin iframe; DOCX → mammoth + sanitizer; XLSX/XLS/CSV → SheetJS table with sheet tabs; images → zoom; video → HTML5; text → escaped pre; PPTX/other → fallback.
- Card Explore links route to `/portfolio/viewer/<id>` for R2 files; external URLs unchanged.
- Download remains separate in the header.
- No signed URLs stored; fresh presigned download generated per request.

## Not executed (requires browser/manual)
1. PDF opens and page nav/zoom (browser PDF UI).
2. DOCX visual rendering fidelity.
3. XLSX sheet switching.
4. CSV table rendering.
5. PPTX fallback display.
6. Image render/zoom.
7. Video playback/seeking.
8. TXT/JSON safe display.
9. Unsupported fallback.
10. Download behavior.
11. Private file rejection for anonymous/other users.
12. Public attachment in another session.
13. Expired signed URL refresh.
14. Large-file memory behavior.
15. Mobile/RTL layouts.

## Manual test instructions
1. Publish a portfolio with a File Icon attachment (PDF/DOCX/XLSX/CSV/PPTX/image/video).
2. Open the published portfolio; click Explore → viewer should open in-app.
3. Use renderer controls + Download.
4. Open in a private window (public file should work; private should 404).
5. Test mobile viewport and switch ar/en.

## Remaining blockers
- Browser automation is not permitted; visual/fidelity checks remain manual.
- No production data or deployment changed.