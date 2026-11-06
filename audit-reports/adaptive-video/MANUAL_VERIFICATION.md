# Adaptive Video — Manual Verification

## Current playback regression (can run now)
1. Publish a portfolio with an MP4 video card.
2. Verify poster + Play only; no autoplay; no video request before click (Network tab).
3. Click Play → inline playback; seek, volume, fullscreen; aspect ratio respected.
4. Private video as another user → 404; public video works.

## Once a transcoding worker is approved and deployed
1. Upload a 720p MP4 (<50 MB) → MediaFile goes UPLOADED → QUEUED → PROCESSING → READY.
2. Confirm source remains in R2 and derived HLS prefix exists.
3. Play card → HLS manifest requested only after click; playback starts.
4. Throttle network (DevTools) → player switches to a lower rendition; restore → higher.
5. Safari/iOS native HLS; Chrome/Firefox via hls.js.
6. Fail a job (invalid source) → fallback to original MP4; error state non-blocking.
7. Duplicate enqueue/completion → no duplicate outputs or quota changes.
8. Delete source → derived outputs cleaned; quota releases correctly.
9. Verify private/public manifest and segment access.

## Approval gate
Do not expect steps 1–9 until the worker/encoding infrastructure and policy decision are approved.