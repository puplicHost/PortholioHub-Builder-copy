# In-App File Viewer — Implementation Report

## Architecture
- Route: `/portfolio/viewer/[fileId]` (server component) resolves the `MediaFile`, enforces access, and renders the client viewer.
- Content: `/api/files/r2/[id]/content` streams R2 objects same-origin with HTTP Range support (206 Partial Content), `Accept-Ranges`, correct Content-Type/Content-Length, and `Content-Disposition: inline`.
- Download: `/api/files/r2/[id]` redirects to a fresh presigned GET (or public URL) with `Content-Disposition: attachment`.
- Cards: `ProjectPageView.itemHref` maps `/api/files/r2/<id>` → `/portfolio/viewer/<id>`. Builder Explore link does the same. External URLs/images unchanged.

## Renderers
| Type | Renderer |
|---|---|
| PDF | Native in-app browser PDF renderer via same-origin iframe (no external redirect); browser controls provide page nav/zoom |
| DOCX | `mammoth` (dynamic import) → sanitized HTML |
| XLSX/XLS/CSV | `xlsx` (SheetJS, dynamic import) → sheet tabs + table, first 200 rows |
| PPTX/PPT | Fallback screen with file info + download (no reliable client renderer) |
| Images | `<img>` with zoom + fullscreen container |
| Video | HTML5 `<video controls preload="metadata">` via Range-capable content route |
| Text (TXT/MD/JSON/XML/LOG) | Fetched, escaped by React in `<pre>` |
| Other | Professional fallback with download |

## Dependencies added
- `mammoth` — DOCX → HTML.
- `xlsx` — spreadsheet/CSV parsing.
Both are dynamically imported inside renderers so they are not loaded on normal portfolio pages.

## Performance
- Viewer route is `force-dynamic`; renderer libraries are dynamic imports.
- Spreadsheet limited to 200 rows per sheet.
- DOCX/PDF loaded only when viewer opens.
- Content route supports range requests for video seeking.

## Integration
- Published cards: Explore → viewer (R2 files only).
- Builder: Explore → viewer.
- Download remains an explicit separate action in the viewer header.

## Known limitations
- PDF uses the browser's built-in viewer (no custom thumbnails/page-count API); page/zoom controls are browser-provided.
- PPTX is not rendered in-browser; fallback + download.
- DOCX formatting is best-effort (Mammoth limitation).
- Spreadsheet formulas/macros are not executed; values as stored.
- Video playback depends on browser codec support (MOV may not play).

## Manual test instructions
1. Upload PDF/DOCX/XLSX/CSV/PPTX/image/video to a project item (File Icon).
2. Save, publish.
3. Click Explore → viewer opens in-app.
4. Verify renderer controls and Download.
5. Test private file as another user → 404.
6. Test external URL card → opens externally.
7. Test mobile and RTL/English.