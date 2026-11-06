# Deep Debugging Report — PortfolioHub

## Audit scope
Uncommitted changes on `main` (latest commit `ed40c3d update Experience sort`) covering the R2 storage layer, attachment persistence, in-app file viewer, inline video cards, builder UI, Prisma MediaFile model, and shared project-card rendering.

## Git changes reviewed
- `package.json` / `package-lock.json` — added `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `mammoth`, `xlsx`.
- `prisma/schema.prisma` — MediaFile R2 fields + unique `object_key`.
- `src/lib/r2.ts`, `src/lib/r2-client.ts` (new) — R2 service + browser upload.
- `src/app/api/files/r2/**` (new) — presign, complete, download/delete, content stream, multipart.
- `src/app/portfolio/viewer/**` (new) — universal viewer.
- `src/lib/actions/portfolio.ts` — relative URL acceptance fix.
- `src/lib/project-card-visuals.ts` — video visual + attachment/video metadata.
- `src/app/profile/builder/BuilderClient.tsx` — file/video upload UI, viewer links.
- `src/app/profile/builder/ProjectManager.tsx` — video card upload.
- `src/components/portfolio/ProjectCard.tsx` — poster-first inline video.
- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` — video URL + no Explore for video.
- `src/components/portfolio/templates/ClassicTemplate.tsx` — home-card video URL.
- `src/routes.manifest.ts` — R2 + viewer routes.
- `__tests__/attachment-persistence.test.ts`, `__tests__/inline-video.test.ts` (new).

## Confirmed bugs found and fixed
1. **Video source used the download route** (`/api/files/r2/<id>`) which sends `Content-Disposition: attachment` and a presigned redirect, unsuitable for inline playback/range. Fixed: video URL now uses `/api/files/r2/<id>/content` (Range + inline).
2. **Stale attachment metadata shared between File Icon and Video** — switching visuals showed the other type's filename/link. Fixed: separate `videoName/Type/Size/Id/Url` metadata in `itemCards`; document fields unchanged.
3. **Server 50 MB video limit bypassable via spoofed MIME** — a video with `application/pdf` MIME got the 500 MB document cap. Fixed: `isVideoFile()` checks MIME + extension; `maxSizeForFile()` applied on presign/complete/multipart.
4. **Arbitrary external URLs could be used as video sources** — `visual=video` rendered `externalUrl` even if it was an external link. Fixed: only same-origin `/api/files/r2/.../content` sources are accepted; otherwise poster fallback.
5. **Invalid Range returned 500** — content route now returns `416` with `Content-Range` on `InvalidRange`.
6. **HEAD content request downloaded the object** — now uses `HeadObject`.

## Confirmed prior fix (verified by test)
- Project item `externalUrl` sanitizer rejected site-relative R2 URLs (`^https?://`-only). Fixed to accept `/...`. Test `attachment-persistence.test.ts` asserts `/api/files/r2/file-1` is persisted and `itemCards` preserved.

## Architecture findings
- Video references are stable (`/api/files/r2/<id>/content`), not signed URLs; metadata lives in `itemCards` content JSON.
- Content route streams with Range/206/HEAD and authorizes per request. No bucket publicization.
- Viewer is a separate route only for documents/images/text; video stays inline.

## Verification
- `tsc --noEmit`: PASS.
- Targeted tests (attachment persistence, inline video, experience reordering, project items, manifest): 16/16 PASS.
- ESLint changed files: 0 new errors (pre-existing `any` in `ProjectPageView`).
- `npm run build`: PASS after upgrading Next.js to 16.4.5.
- `npm audit`: after upgrade 0 critical, 5 high (firebase ×4, xlsx ×1); before upgrade 1 critical, 7 high.
- Full suite: 82 passed, 2 pre-existing stale `features-v2.test.ts` failures (unrelated).

## Remaining blockers
- Browser playback/persistence/viewer flows are not automated (no Playwright per instruction).
- Next.js security upgrade and xlsx vulnerability require follow-up (see SECURITY_AUDIT.md).
- No production data, migration, or deployment changed.