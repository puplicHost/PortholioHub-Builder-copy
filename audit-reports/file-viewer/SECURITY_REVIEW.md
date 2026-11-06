# In-App File Viewer — Security Review

## Authorization
- Viewer page resolves `MediaFile` by id. Missing/non-R2 files → `notFound()`.
- Public files (`visibility='public'`) readable by anyone.
- Private files require an authenticated session whose `user.id === file.userId`; otherwise `notFound()` (no existence leak).
- Content route applies the same rule on every request (not just page load).

## Signed URLs
- No signed URLs stored in DB/content. `/api/files/r2/[id]` generates a fresh 5-minute presigned GET per request.
- Content route streams via SDK using server-side credentials; no credentials reach the browser.

## Range/streaming
- `GET /api/files/r2/[id]/content` forwards the `Range` header, returns `206` + `Content-Range` when R2 responds with it, and sets `Accept-Ranges: bytes`; `HEAD` returns headers only.
- Large files are streamed (no full buffering).

## Content safety
- DOCX HTML is sanitized: removes script/style/iframe/object/embed/link/meta/form/input/button, all `on*` attributes, and `javascript:` hrefs.
- Text is rendered via React text nodes (escaped), not HTML.
- Spreadsheet cells rendered as text; formulas/macros not executed.
- PDF/video rendered by browser sandboxed viewers.
- No external document viewers or conversion services.

## Path/URL safety
- File access is by `MediaFile.id`; object keys are never accepted from the client.
- Viewer `from` param only accepts same-origin relative paths (`/...`, not `//`).
- Download filenames sanitized for Content-Disposition.

## Known risks
- Same-origin content proxy means large videos consume Vercel function bandwidth/time; monitor limits. Direct presigned URLs could be used for very large videos if needed.
- R2 CORS is not required for the content route (same-origin), but is required if direct presigned fetches are added later.
- DOCX sanitizer is conservative but not a full HTML sanitizer library; consider DOMPurify if richer DOCX output is enabled.