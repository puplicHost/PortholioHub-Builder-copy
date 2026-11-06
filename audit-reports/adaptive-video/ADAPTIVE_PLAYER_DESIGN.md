# Adaptive Player Design (proposed — not implemented)

## UX preserved
- Poster + Play button first (no autoplay, no video download before click).
- Click → inline playback in the same card; card aspect ratio preserved; native controls; click-to-play remains.
- If `adaptiveManifestKey` is present and processing is READY → HLS; otherwise existing MP4 `videoUrl`.

## Engine
- Safari/iOS: native HLS (`<video src="...m3u8">`) where supported.
- Chrome/Firefox/Android: dynamic `import('hls.js')` **only when a card with a READY manifest is played**, attached to the video element, auto quality (ABR) enabled.
- The existing MP4 path stays as fallback if HLS fails or manifest/segments are missing.
- No separate viewer, no external platform, no global player bundle on pages without video.

## Playback flow
1. Poster state (no manifest fetch).
2. On Play click: fetch manifest URL (short-lived/signed or same-origin endpoint).
3. Try native HLS; else lazily load hls.js.
4. On fatal error: fall back to the original MP4 URL; show a non-blocking message.

## Bundle/performance
- hls.js is a new dependency (open-source, no paid service) but adds ~150–200 KB gzipped to video pages only. Approval required before adding.
- No manifest/segments fetched before interaction.
- Cleanup: destroy HLS instance on unmount.

## Browser support
Chrome/Firefox/Edge: HLS via hls.js (MSE). Safari/iOS: native HLS. Android Chrome: hls.js. If MSE unsupported, fall back to MP4.

## Not implemented
No `hls.js` dependency was added and no player code was changed because there is no HLS output pipeline yet. Enabling a player without manifests would be a fake feature.