# Future Risk Assessment

> These are potential risks, not confirmed defects, unless marked otherwise.

| # | Risk | Probability | Impact | Severity | Early warning | Prevention / monitoring |
|---|---|---|---|---|---|---|
| 1 | R2 orphaned objects from failed completion | Medium | Storage cost grows unbounded | Medium | `media_files` count flat while bucket size grows | Reconciliation job; delete objects whose `objectKey` has no MediaFile after N days |
| 2 | Incomplete multipart uploads left in bucket | Medium | Cost + bucket clutter | Medium | Multipart uploads list growing | Scheduled `ListMultipartUploads` + abort >24h |
| 3 | Draft portfolio attachments are publicly readable by ID | Medium | Unpublished content accessible to anyone with the UUID | Medium | privacy report | Tie visibility to portfolio publish state; make files private until published |
| 4 | Vercel bandwidth/time limits on video streaming | High at scale | Playback failures / cost | High | 504/timeouts on large videos | Use short-lived presigned R2 URLs for video playback (still private) or a CDN; monitor function duration |
| 5 | Signed URL expiration during long playback | Low | Mid-playback failure | Low | Playback stops ~5 min | Video plays via content route (no expiring URL); documents use fresh URLs per request |
| 6 | Concurrent edits overwrite video metadata | Medium | Lost attachment reference | Medium | conflict modal reports | Optimistic concurrency exists; ensure `itemCards` part of versioned save (it is) |
| 7 | Duplicate completion requests | Low | Duplicate MediaFile rows | Low | unique objectKey violations | Unique index + fallback lookup implemented |
| 8 | Legacy records missing `attachmentType/videoType` | Medium | Poster fallback / no playback | Low | support tickets | Backfill meta from externalUrl where possible; document |
| 9 | Browser codec incompatibility (MOV, HEVC) | Medium | Video won't play | Low | playback error events | Show fallback + download; restrict picker to MP4/WEBM |
| 10 | `xlsx` prototype pollution / ReDoS (HIGH vuln, no npm fix) | Medium | Client hang / polluted object scope | High | audit advisory | Move to SheetJS 0.20.x official distribution or ExcelJS; parse in a Web Worker |
| 11 | Next.js 16.2.12 critical advisories | High if unpatched | RCE/SSRF/cache poisoning depending on feature | Critical | `npm audit` | Upgrade Next to ≥16.4.5; run build/tests in staging |
| 12 | Large `ProjectPageView`/`ProjectCard` client bundle | Medium | Slow portfolio LCP/INP | Medium | Web Vitals | RSC migration; avoid shipping viewer libs (already dynamic) |
| 13 | Database query growth on analytics/public pages | Medium | Slower pages at scale | Medium | TTFB | ISR/caching; de-fan analytics counts |
| 14 | MediaFile ↔ project item reference drift | Low | Broken attachment link | Medium | 404 on Explore | Periodic consistency check; store media id in item row if schema allows |
| 15 | No observability for upload/playback failures | High | Silent customer failures | High | support reports | Add error tracking + upload/playback telemetry |
| 16 | Rate limiting on upload endpoints absent | Medium | Abuse/storage exhaustion | Medium | traffic spikes | Per-user quota/rate limit on presign/complete |
| 17 | Public file ID enumeration | Low | Access to public files only | Low | — | UUIDs are unguessable; keep private files owner-only (implemented) |
| 18 | `R2_PUBLIC_BASE_URL` misconfiguration | Low | Broken public URLs | Low | 404s | Prefer same-origin content route (implemented for videos/docs) |

## Immediate vs future
- **Immediate:** Next.js upgrade (critical advisories), xlsx mitigation decision, upload rate limiting, draft attachment privacy.
- **Monitor:** orphaned objects, multipart uploads, video function duration, Web Vitals, upload failure rates.
- **Future:** RSC migration of public templates, presigned direct video playback, storage lifecycle policies.