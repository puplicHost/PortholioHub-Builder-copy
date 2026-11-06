# Regression Audit — Recent Changes

## Features affected / investigated

| Scenario | Result | Evidence |
|---|---|---|
| Image card + Cloudinary upload | Unchanged | `handleItemCoverUpload` still calls `uploadToCloudinary`; image branch untouched |
| File Icon document upload | Preserved | `uploadProjectItemFile` stores `/api/files/r2/<id>`; separate `attachment*` meta |
| Video card upload | New | `uploadProjectItemVideo` stores `video*` meta + content URL |
| Switching Image → File Icon → Video → None | Separated metadata; no cross-type stale link | video fields distinct from attachment fields; `visual === 'none'` returns null |
| External link card | Preserved | `itemHref` unchanged for http(s); viewer mapping only for `/api/files/r2/<id>` |
| Explore action for documents | Preserved → viewer | `itemHref` maps R2 doc URL to `/portfolio/viewer/<id>` |
| Explore action for video | Removed | `renderItemLinks` returns null main href for video |
| Save/refresh document attachment | Verified by unit test | `attachment-persistence.test.ts` (itemCards + relative URL) |
| Save/refresh video attachment | Metadata round-trip tested | `inline-video.test.ts` (videoName/Type/Size/Id) |
| None mode | No media/action | `ProjectCardMedia` returns null; `renderItemLinks` no href |
| Legacy project items (no meta) | Fallback to image/none | `normalizeProjectCardVisual` defaults to image; image missing → none |
| Manifest route guard | Passes | `manifest.test.ts` 2/2 |
| Experience reordering | Unchanged | targeted tests pass |
| R2 document viewer (PDF/DOCX/XLSX/text) | Code path intact | viewer + content route unchanged except Range 416/HEAD |

## Regression risks found
- **Video URL legacy**: old video records that stored `/api/files/r2/<id>` are normalized to `/content` by `toVideoSrc()`.
- **Home card videos**: `ClassicTemplate` passes video URL only when `content.videoName` exists, preventing external links being treated as videos.
- **Project page videos**: `ProjectPageView` uses `meta.videoUrl` (or legacy video type + externalUrl), so document URLs are not used as video sources.

## Tests added/updated
- `__tests__/attachment-persistence.test.ts` — itemCards preserved, relative URL persisted, external URL persisted.
- `__tests__/inline-video.test.ts` — video visual, metadata round-trip, splice, 50 MB, MIME-spoof detection.

## Unverified workflows (manual)
- Real browser upload → save → refresh → reopen for PDF/DOCX/video.
- Published portfolio rendering in another browser session.
- RTL/LTR/mobile layouts.
- Cloudinary upload end-to-end.
- Multi-video/multi-card performance.

No regression was confirmed in the audited code paths; the above remain unverified by execution.