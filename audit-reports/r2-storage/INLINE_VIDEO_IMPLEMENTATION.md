# Inline Video Implementation Report

## Files changed
- `src/lib/project-card-visuals.ts` — added `'video'` to `ProjectCardVisual`, normalization, and meta sanitizer.
- `src/lib/r2.ts` — `MAX_VIDEO_SIZE = 52_428_800` (50 MB), `maxSizeForMime()`.
- `src/lib/r2-client.ts` — client-side video size check (50 MB).
- `src/app/api/files/r2/presign/route.ts`, `complete/route.ts` — per-MIME max; videos capped at 50 MB.
- `src/app/api/files/r2/multipart/initiate/route.ts`, `multipart/complete/route.ts` — same cap.
- `src/app/profile/builder/BuilderClient.tsx` — Video option in Card Visual, `uploadProjectItemVideo`, video upload UI + preview + remove.
- `src/app/profile/builder/ProjectManager.tsx` — Video option, `handleCardVideoUpload`, video UI.
- `src/components/portfolio/ProjectCard.tsx` — `VideoCardPreview` (poster-first + Play, no autoplay).
- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx` — pass `videoUrl`, suppress Explore link for video cards.
- `src/components/portfolio/templates/ClassicTemplate.tsx` — pass `videoUrl` to home project cards.
- `src/app/profile/builder/i18n/dictionaries.ts` — video labels (en/ar).
- `__tests__/inline-video.test.ts` — unit tests.

## Supported formats
- MP4 (`video/mp4`) — preferred.
- WEBM (`video/webm`).
- MOV (`video/quicktime`) is in the server allowlist but the Builder video picker accepts only MP4/WEBM; MOV playback depends on browser codec support.

## 50 MB enforcement
- Client: `uploadToR2` throws for `video/*` > 52,428,800 bytes; Builder handlers validate before upload.
- Server: presign/initiate reject claimed size > 50 MB for video MIME; complete verifies actual `ContentLength` via HeadObject and deletes the object if oversized.
- UI message: "Maximum video size: 50 MB per video."

## Persistence (updated after deep debug)
- Video reference stored in `itemCards[index].videoUrl` as `/api/files/r2/<id>/content` (stable, inline/Range-capable; not signed).
- Video metadata (`videoName`, `videoType`, `videoSize`, `videoId`, `videoUrl`) kept separate from document `attachment*` fields so switching visuals never shows stale cross-type actions.
- Home card video URL stored in `ProjectPage.content.videoUrl` + `videoName` (ProjectManager).
- ProjectItem `externalUrl` remains the document/Explore reference; videos no longer overwrite it.

## Poster and playback
- Initial published card: styled gradient poster + Play button; no `<video>` element → no download, no autoplay.
- After explicit Play click: `<video controls autoPlay playsInline preload="metadata">` inside the same card.
- No separate viewer, no new tab, no external link for videos.

## Streaming
- Playback uses the existing `/api/files/r2/[id]/content` route (Range/206, Accept-Ranges, HEAD), so seeking works without downloading the entire file.
- No signed URLs stored; content route authorizes per request.

## Reused components
- Existing R2 presign/complete/multipart APIs and `uploadToR2`.
- Existing `ProjectCardMedia` card shell.
- Existing MediaFile model (no schema change).