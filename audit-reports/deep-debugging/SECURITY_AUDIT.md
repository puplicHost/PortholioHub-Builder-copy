# Security Audit — R2 / Viewer / Video

## Authorization review
- `GET /api/files/r2/[id]`: public files readable; private requires `file.userId === user.id` else 404.
- `GET /api/files/r2/[id]/content`: same rule; public/no-auth, private owner-only. Streams R2 object via server SDK.
- `POST /api/files/r2/presign`: requires session; key built as `users/<userId>/...`; object keys never accepted from client on upload.
- `POST /api/files/r2/complete`: requires session; rejects keys outside `users/<userId>/`; verifies object via HeadObject; unique `object_key` + idempotent lookup.
- Viewer `/portfolio/viewer/[fileId]`: public or owner; `notFound()` otherwise; `noindex`.
- `from` back-link restricted to same-origin relative paths (`/...`, not `//`).

## Upload validation
- Allowlist: PDF/DOC/OFFICE/CSV/PPT + MP4/WEBM/MOV.
- Size: documents 500 MB; videos exactly 50 MB (`52,428,800`).
- Video size enforced client-side + server-side; extension-aware (`isVideoFile`) prevents MIME spoof bypass.
- Completion verifies actual R2 `ContentLength`; oversized object deleted.
- Duplicate completion handled by unique index + fallback.

## Identified issues
1. **CRITICAL (FIXED):** Next.js 16.2.12 had multiple critical advisories (RCE-class, SSRF, cache poisoning). Upgraded to `next@16.4.5` and `eslint-config-next@16.4.5`. `npm audit` critical count now 0.
2. **HIGH (UNRESOLVED):** `xlsx@0.18.5` has prototype pollution + ReDoS advisories with no npm fix. Files are parsed in the browser; risk limited to the visitor's tab, but untrusted XLSX/CSV can hang it. Recommend SheetJS official 0.20.x distribution or parsing in a Web Worker; do not parse untrusted sheets on the main thread long-term.
3. **HIGH (UNRESOLVED):** `firebase`/`@grpc/grpc-js` advisories; npm fix requires major downgrade to firebase 9.14.0. Firebase is optional/interface-only in this app; evaluate removal or isolated upgrade.
4. **MEDIUM (UNRESOLVED):** Portfolio attachments are uploaded with `visibility='public'`, so a file attached to a draft/unpublished portfolio is readable by its UUID before publish. IDs are random UUIDs, but this is a privacy exposure. Recommend deriving visibility from portfolio publish state or defaulting draft attachments to private.
5. **LOW (FIXED):** Invalid Range caused 500; now 416 with `Content-Range`.
6. **LOW (FIXED):** HEAD content route fetched the object body; now uses HeadObject.

## Content safety
- DOCX HTML sanitized (removes script/style/iframe/object/embed/link/meta/form/input/button, `on*`, unsafe `href/src/srcset` schemes).
- Text rendered as escaped React text.
- Spreadsheet cells rendered as text; formulas/macros not executed.
- PDF/video use browser-native renderers; no external viewers or conversion services.
- `Content-Disposition: inline` for viewer, `attachment` for download.

## Remaining concerns
- No malware scanning for uploaded documents/videos.
- No per-user upload rate limit/quota on presign/complete.
- Public file access is `noindex` for viewer but the raw `/api/files/r2/<id>` is not search-indexed (API route).
- CSP still absent (pre-existing app-wide gap).