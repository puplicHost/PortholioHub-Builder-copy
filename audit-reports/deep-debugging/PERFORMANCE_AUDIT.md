# Performance Audit — Recent Changes

## Frontend
- Video cards are **poster-first**: no `<video>` element until Play; initial page does not download video data. Good.
- `mammoth` and `xlsx` are dynamically imported only in the viewer; portfolio pages do not load them. Good.
- `ProjectPageView`/`ClassicTemplate` remain large client components (pre-existing). Video adds a small `VideoCardPreview` state.
- `XLSX` rendering caps at 200 rows per sheet (no virtualization beyond that).
- PDF uses the browser's built-in renderer (no PDF.js bundle).
- DOCX/PDF content fetched only when the viewer opens.

## Backend / storage
- `/api/files/r2/[id]/content` streams with Range/206 and does not buffer the full object. Good.
- Video playback through Vercel functions consumes bandwidth/time per play; large/many concurrent videos could hit function limits. This is the main scaling concern.
- R2 `HeadObject` used for completion verification; acceptable.
- `complete` does a find + create; unique index prevents duplicates. One extra query per upload.
- Viewer page does one `MediaFile` lookup + optional session lookup.

## Database
- No new tables; MediaFile fields only. `object_key` unique index added.
- `itemCards` stored in ProjectPage content JSON; no extra queries.
- Analytics/public page query volume unchanged.

## Growth scenarios
- **10 videos on one portfolio:** only posters render; no video downloads until click. Fine.
- **50–100 project cards:** DOM size grows (pre-existing); video previews add one button per card.
- **Many simultaneous video plays:** each streams through a serverless function; bandwidth/time limits are the bottleneck. Recommend presigned direct-to-R2 playback URLs (short-lived, private) or a CDN in front of R2.
- **Slow mobile:** poster-first is good; video starts on demand.
- **Visitors leaving while loading:** the `<video>` element unmounts and the browser aborts; no explicit cleanup needed.

## Measured vs estimated
- No Lighthouse/bundle measurements were run in this environment (build passes, tsc/tests pass). The above are code-based assessments, not measured numbers.

## Recommendations
1. Add Web Vitals/telemetry before optimizing further.
2. Consider direct presigned R2 URLs for video playback to reduce Vercel bandwidth.
3. Migrate `ProjectPageView`/`ClassicTemplate` to server components where feasible.
4. Add spreadsheet virtualization if large sheets are common.
5. Add upload/playback error telemetry.