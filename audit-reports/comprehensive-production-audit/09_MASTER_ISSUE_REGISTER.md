# Master Issue Register — PortfolioHub Builder (Deduplicated)

| ID | Category | Issue | Severity | Customer Impact | Evidence | Priority |
|---|---|---|---|---|---|---|
| PERF-FE-01 | Performance | Builder monolith (4,821-line client component) ships large hydrate payload | High | Slow builder TTI | `src/app/profile/builder/BuilderClient.tsx` (wc -l) | P2 |
| PERF-FE-02 | Performance | Public visitors download builder-sized JS (ClassicTemplate 2,571 lines, client) | High | Poor LCP/INP for portfolios | `src/components/portfolio/templates/ClassicTemplate.tsx` (wc -l) | P2 |
| PERF-FE-03 | Performance | 31 raw `<img>`, 0 `next/image` | High | Poor LCP/bandwidth | grep counts | P2 |
| PERF-FE-04 | Performance | Render-blocking fonts via CSS `@import` + runtime `<link>` | Medium | Slower FCP | `src/app/globals.css:1`, ClassicTemplate render | P3 |
| PERF-FE-05 | Performance | Notification bell 30s polling scales linearly | Medium | Server load, client battery | NotificationBell.tsx | P3 |
| PERF-FE-06 | Performance | `set-state-in-effect` ×3 extra render passes | Low-Medium | Minor render cost | BuilderClient:103, ProjectPageView:45, ClassicTemplate:44 | P3 |
| PERF-FE-07 | Performance | Per-portfolio Google Fonts `<link>` injection | Low | First-paint delay | ClassicTemplate | P3 |
| PERF-BE-01 | Performance | Builder profile re-fetch up to 4× → ~4.6s | High | Slow builder load | `src/lib/actions/portfolio.ts` (~59,103,157,207) | P2 |
| PERF-BE-02 | Performance | Analytics 11 COUNT fan-out → ~9.8s | High | Slow analytics | `src/lib/actions/portfolio.ts` (~734-836) | P2 |
| PERF-BE-03 | Performance | `/u` double full-row fetch + over-fetch | Medium | Slower portfolio load | prior audit S5 | P2 |
| PERF-BE-04 | Performance | Save path O(n) sequential writes | Medium | Slow saves | prior audit S4 | P3 |
| PERF-DB-01 | Performance | Analytics COUNT fan-out + pool queueing | Medium | Slow analytics | prior audit S2 | P2 |
| PERF-DB-02 | Performance | Rate-limit hot-row contention | Medium | Login/register latency at scale | prior audit | P3 |
| PERF-DB-03 | Performance | Admin search unindexed `contains insensitive` | Low-Medium | Slow admin at scale | prior audit | P3 |
| PERF-DB-04 | Performance | No explicit Prisma pool tuning | Low | Connection limits at scale | prior audit | P4 |
| PERF-CACHE-01 | Performance | Public portfolio pages uncached | High | Linear DB growth with traffic | layout cookie dynamic render | P2 |
| PERF-CACHE-02 | Performance | Landing page dynamic due to layout cookie | Medium | No static optimization | layout.tsx | P3 |
| PERF-CACHE-03 | Performance | `output: standalone` no benefit on Vercel | Low | None | next.config.ts | P4 |
| PERF-IMG-01 | Performance | No `next/image` adoption | High | Poor LCP/bandwidth | grep (0 imports) | P2 |
| PERF-IMG-02 | Performance | Cloudinary transforms not used for thumbnails | Medium | Large payloads | prior audit | P3 |
| SEC-CSRF-01 | Security | CSRF only on 4 of ~36 mutating routes | High | CSRF attack on mutations | `src/lib/csrf.ts` applied to 4 routes | P1 |
| SEC-CSP-01 | Security | No Content-Security-Policy | High | No script-src defense-in-depth | `src/middleware.ts` | P1 |
| SEC-UPLOAD-01 | Security | Unsigned Cloudinary client-side preset | High | Arbitrary uploads to account | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | P1 |
| SEC-RL-01 | Security | `username-available` unauthenticated + no rate limit | Medium | Username enumeration | prior audit | P1 |
| SEC-PII-01 | Security | Admin send-email logs recipient + body | Medium | PII in logs | prior audit | P1 |
| SEC-IDOR-01 | Security | Track endpoint accepts username without auth (acceptable, throttle) | Medium | Minor abuse | track/route.ts | P3 |
| SEC-XSS-01 | Security | Inline script in layout (static, no user input) | Low | None current | layout.tsx:85-89 | P4 |
| REL-01 | Reliability | Email delivery stub (verification never arrives) | High | Users cannot verify email | `src/lib/resend/send.ts` | P1 |
| REL-02 | Reliability | In-memory `/track` throttle not shared; unbounded Map | Medium | Throttle ineffective multi-instance | track/route.ts:9-23 | P1 |
| REL-EXT-01 | Reliability | Cloudinary/Firebase failure handling unverified | Medium | Upload/push failures | not verified | P3 |
| REL-SILENT-01 | Reliability | Silent catch blocks hide failures | Low-Medium | Hidden errors | prior audit | P3 |
| REL-LOG-01 | Reliability | No structured logging | Medium | Hard to diagnose | console.error only | P3 |
| REL-MON-01 | Reliability | No error monitoring (Sentry) | High | Blind to prod failures | no observability | P1 |
| REL-OBS-01 | Reliability | No Web Vitals/autosave/upload/cron telemetry | High | Blind spots | prior audit | P2 |
| REL-STOR-01 | Reliability | Ephemeral Vercel disk for uploads; Cloudinary orphan cleanup | Medium | Lost uploads on redeploy | DEPLOY.md | P2 |
| UX-LAND-01 | UX | Terms/privacy stubs unlinked (legal content pending) | Low-Medium | Incomplete legal | phase H | P3 |
| UX-AUTH-01 | UX | Email verification never delivers (blocks verify flow) | Medium | Users stuck | resend stub | P1 |
| UX-BLD-01 | UX | Builder desktop-oriented; mobile no drawer/bottom-sheet | Medium | Poor mobile editing | BuilderClient | P3 |
| UX-BLD-02 | UX | Conflict modal client-state-only (discoverability) | Low | Hidden until conflict | phase F4 | P3 |
| UX-BLD-03 | UX | Default sections created with translated content (opposite of plan) | Low | Cluttered empty portfolios | gap analysis | P4 |
| UX-BLD-05 | UX | Experience reorder WIP incomplete | Medium | Incomplete feature | uncommitted diff | P2 |
| UX-PUB-01 | UX | Long Arabic text/usernames may break layout | Medium | Broken public pages | not tested | P3 |
| UX-PUB-02 | UX | Empty/broken image states | Low | Poor presentation | ClassicTemplate | P3 |
| UX-PUB-03 | UX | "View page" button ignores published state | Low | Confusing | gap analysis | P4 |
| UX-ADM-01 | UX | Admin search slow at scale | Medium | Admin inefficiency | unindexed contains | P3 |
| UX-ADM-02 | UX | Admin happy paths not manually verified | Low | Unverified admin flows | phase D | P3 |
| UX-SUB-01 | UX | Grace/expiry reminders never arrive (email stub) | Medium | Missed renewals | resend stub | P1 |
| UX-NOT-01 | UX | Notification polling 30s per client | Low | Server load | NotificationBell | P3 |
| UX-DSG-01 | UX | Minor design inconsistencies | Low | Polish | not verified | P4 |
| UX-TOUCH-01 | UX/A11y | Touch targets below 44px (ReorderButtons chevrons 14px) | Medium | Mobile usability | ReorderButtons.tsx | P3 |
| SEO-SD-01 | SEO | Person JSON-LD minimal (no image/sameAs) | Low | Weaker rich results | public pages | P4 |
| SEO-DUP-01 | SEO | Canonical host consistency for subdomain rewrite | Medium | Duplicate content risk | middleware rewrite | P2 |
| SEO-ALT-01 | SEO | Image alt text audit needed | Low | SEO/a11y | templates | P4 |
| A11Y-H-01 | A11y | Heading hierarchy not verified | Medium | Screen reader | render needed | P3 |
| A11Y-MOD-01 | A11y | Modal focus management unverified | Medium | Keyboard users | conflict modal | P3 |
| A11Y-ARIA-01 | A11y | Drag handle ARIA incomplete | Low | Screen reader | dnd-kit | P4 |
| A11Y-TOUCH-01 | A11y | Touch targets <44px | Medium | Mobile a11y | ReorderButtons | P3 |
| A11Y-MOTION-01 | A11y | No prefers-reduced-motion gating | Low | Motion-sensitive users | stagger animation | P4 |
| DB-TX-01 | Database | Save path not wrapped in transaction | Medium | Partial state on failure | portfolio.ts save | P2 |
| DB-UNIQUE-01 | Database | Multiple NULLs in unique phone (app-enforced) | Low | None (documented) | schema | P4 |
| DB-AN-01 | Database | Dual-write raw events grow storage | Low | Storage growth | track route | P4 |
| DB-RET-01 | Database | No general data retention policy | Low | Storage growth | not defined | P4 |
| DB-DEL-01 | Database | Cloudinary orphan cleanup missing | Low | Storage waste | no cleanup job | P4 |
| DB-API-01 | API | Full endpoint ownership audit not performed | Medium | Potential IDOR | not verified | P2 |
| DB-API-02 | API | Silent catches hide failures | Low-Medium | Hidden errors | prior audit | P3 |
| CQ-LARGE-01 | Code Quality | Large components/monoliths | Medium | Maintainability | wc -l | P3 |
| CQ-TS-01 | Code Quality | `any` usage 32+ | Low-Medium | Type safety | lint | P4 |
| CQ-ERR-01 | Code Quality | Error handling inconsistencies | Low-Medium | Reliability | prior audit | P3 |
| CQ-NAME-01 | Code Quality | Historical naming (ph-gold = blue) | Low | None | cosmetic | P4 |
| CQ-DEAD-01 | Code Quality | Dead code `src/lib/upload.ts` | Low | None | not imported | P4 |
| CQ-DEP-01 | Code Quality | Dependency audit not performed | Low | Unknown vulns | not run | P3 |
| CQ-LINT-01 | Code Quality | Lint baseline 28 errors / 53-54 warnings | Medium | Code quality | phase verifications | P3 |
| CQ-TEST-01 | Testing | Critical flows untested (subscriptions, admin, visibility, concurrency, mobile, i18n) | High | Regressions undetected | test inventory | P2 |
| OPS-01 | Operations | No CI pipeline | Medium | Tests never run automatically | no .github | P2 |
| OPS-02 | Operations | No error monitoring | High | Blind to prod failures | no Sentry | P1 |

Notes:
- Stale claims corrected: missing OG images (current uses dynamic `/og` route; favicon present); `JWT_SECRET` dev fallback (current code hard-throws if missing); platform name is cached via `unstable_cache` (300s); debug endpoints absent in current tree.
- IDs prefixed by category; consolidated from prior reports + current verification. No duplicates: each root cause reported once.