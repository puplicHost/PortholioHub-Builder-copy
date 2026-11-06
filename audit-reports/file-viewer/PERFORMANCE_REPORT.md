# In-App File Viewer — Performance Report

## Optimizations implemented
- Renderer libraries (`mammoth`, `xlsx`) load via dynamic `import()` only inside the viewer and only for the matching file kind.
- Viewer route is `force-dynamic` and not linked from normal pages except the attachment action.
- Spreadsheet rendering caps at 200 rows per sheet (note shown to users).
- DOCX/PDF only fetch content after the viewer opens.
- Content route streams with Range support; videos use `preload="metadata"` and seek via 206 responses.
- PDF uses the browser's built-in renderer (no PDF.js bundle shipped).

## Bundle impact
- `mammoth` and `xlsx` are separate async chunks, not part of the main portfolio bundle.
- No PDF.js/spreadsheet/presentation code loaded on portfolio pages.

## Known limitations
- Same-origin proxy for very large videos can hit Vercel function limits; a direct presigned URL fallback for large videos is a possible follow-up.
- No virtualization for spreadsheets beyond the 200-row cap.
- PPTX fallback avoids shipping a heavy/unsafe renderer.

## Not measured
- Actual bundle-size numbers and Lighthouse metrics were not measured in this environment.
- No load testing performed (production safety).