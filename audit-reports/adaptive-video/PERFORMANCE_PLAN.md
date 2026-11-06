# Adaptive Video — Performance Plan

## Goals
- No page-load video/manifest fetch before Play.
- Small bundle impact on non-video pages (zero player JS).
- Fast first frame after click; smooth switching under bandwidth changes.

## Plan
- Keep poster-first card; do not render `<video>` before click.
- Lazy `import('hls.js')` only when playing a READY adaptive video.
- Fetch manifest/segments only after Play.
- Segment duration 4–6s; HLS master with 2–4 renditions based on source.
- Same-origin delivery via authenticated Range/stream route or short-lived signed URLs; monitor Vercel bandwidth per playback.
- Cache segments at CDN where safe (public files); private files need auth-aware caching.
- Cleanup HLS instance/object URLs on unmount.

## Metrics to measure before/after
- Page JS bundle on portfolio pages with/without video.
- Time from Play click to first frame.
- Rebuffer ratio, rendition switches, startup failures.
- R2 request count/egress and Vercel function duration.
- Worker CPU/memory and transcode time per minute of video.

## Risks
- hls.js bundle (~150–200 KB gz) on video pages.
- Vercel bandwidth/cost for segments; a CDN/public R2 path may be preferable for public portfolios.
- Transcoding cost/time grows with library size; process only new uploads first.