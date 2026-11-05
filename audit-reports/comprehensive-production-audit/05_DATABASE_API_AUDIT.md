# Database & API Audit — PortfolioHub Builder

## Database Schema (Prisma)
- `prisma/schema.prisma` = 1,049 lines. Provider PostgreSQL, pooled `DATABASE_URL` + `DIRECT_URL`. Generator `prisma-client-js`, binaryTargets include linux-musl.
- Models: see PROJECT_HANDOFF §8. Portfolio core: UserProfile, ProfilePage, PageSection, ProjectPage, ProjectItem, Testimonial, Service. Billing: Plan, Subscription, SubscriptionRequest, SubscriptionEvent, Payment. Auth: User, Session, RateLimitBucket, PasswordResetToken, EmailVerificationToken. Admin: SystemSetting, AdminAuditLog, AdminUserNote, Announcement, Referral, SharedLink, FcmToken, Notification, Media, MediaFile. Analytics: PortfolioViewEvent, DailyVisit, VisitDedup. MarketOS-legacy models present (Workspace*, Content*, Strategy*, Planning*, CalendarEvent, SwotCard, Task, Campaign, Lead, Profile).

## Foreign Keys & Cascades
- Cascade deletes on most child rows (ProfilePage→PageSection, etc.). Subscription.workspaceId SetNull; Payment.subscriptionId SetNull; Lead.campaignId SetNull. AdminAuditLog admin/target nullable.
- `UserProfile.userId` unique (1:1 User). Good.

## Unique Constraints / Indexes
- 80 indexes/unique, 49 onDelete rules (per PRODUCTION_READINESS_AUDIT). Unique: User.email, User.phone (nullable, multiple NULL allowed in Postgres), Session.token, UserProfile.username/userId, ProfilePage (profileId,slug), ProjectPage (profileId,slug), SubscriptionRequest.code, etc.
- **DB-UNIQUE-01 (Low):** Postgres allows multiple NULL in unique columns → phone uniqueness relies on app validation. Acceptable (documented in gap-closure plan §5 risk 6).

## Migration History
- `supabase/migrations/0001_init.sql` … `0006_analytics.sql`. Prisma migrations: `20261022120000_add_show_in_projects`, `20261023120000_add_preferred_builder_locale`. No destructive statements (per plan). `0005_notifications` folded into 0004.

## Transaction Boundaries
- `$transaction` on grant-subscription, request approve, admin user ops (per prior audit). `updatePortfolio` writes sections/projects/items — verify atomicity (likely multiple statements, not one transaction). **DB-TX-01 (Medium):** If a mid-save failure occurs, partial state possible. Evidence: `src/lib/actions/portfolio.ts` save path. Suggested: wrap in transaction; test conflict path (already covered by e2e conflict spec).

## Race Conditions
- Optimistic concurrency via `UserProfile.version` + `expectedVersion` → 409. Evidence: updatePortfolio. Good.
- Creation race P2002 handled (getOrCreateProfile re-fetch-or-retry). Phase F4.
- Subscription approve locks PENDING row (per Sprint C). Good.
- VisitDedup key (sha256) prevents double-count; NULL projectSlug upsert bug fixed via find-then-bump. Phase G.

## Duplicate Records
- Notification dedupe via `dedupeKey` partial unique. DailyVisit unique per (portfolio, projectSlug, day). VisitDedup key PK. Good.
- RateLimitBucket key PK.

## Analytics Deduplication
- Dual-write during transition: aggregate DailyVisit + raw PortfolioViewEvent. Raw growth stops only after dashboard migrates (recorded future work). Evidence: track route comments. **DB-AN-01 (Low):** Dual-write increases storage; migrate dashboard to DailyVisit to stop raw growth.

## Data Retention
- VisitDedup cleanup cron (>2 days). Session cleanup cron. No general retention policy documented. **DB-RET-01 (Low):** Define retention for PortfolioViewEvent, notifications.

## Customer Deletion Implications
- Cascade deletes on User → Session, Profile, UserProfile, Workspace (owner), subscriptions, payments, notifications, media files, FcmToken, referrals, notes, audit logs (adminId nullable). Good. Workspace owned by user cascades content/strategy/etc. Verify no orphaned Cloudinary assets (no cleanup job). **DB-DEL-01 (Low):** Cloudinary orphan cleanup not implemented.

## API & Server Action Inventory
Routes (from phase C verification: 57 routes total). Key groups:
- Auth: `/api/auth/login`, `/register`, `/logout`, `/me`, `/change-password`.
- Me: `/api/me/subscription`, `/history`, `/subscription-requests`, `/plans`, `/notifications`, `/notifications/read-all`, `/notifications/unread-count`, `/notifications/[id]/read`.
- Public: `/api/public/plans`, `/api/username-available`, `/api/portfolio/track`, `/api/health`, `/api/verify-email`, `/api/og` (route.tsx).
- Admin: `/api/admin/dashboard`, `/users`, `/users/[id]/*` (reset-password, overview, grant-subscription, suspend, unsuspend, revoke-sessions, send-email), `/portfolios`, `/portfolios/[username]/hide|unhide`, `/plans`, `/plans/[id]`, `/subscriptions`, `/subscriptions/[id]/{extend,override,suspend,unsuspend}`, `/subscription-requests`, `/subscription-requests/[id]/{approve,reject}`, `/payments`, `/payments/[id]/confirm`, `/settings`, `/settings/maintenance`, `/announcements`, `/announcements/[id]`, `/audit-log`, `/fcm-subscribe`.
- Cron: `/api/cron/cleanup`, `/api/cron/subscription-lifecycle`.
- Server Actions: `getOrCreateProfile`, `updatePortfolio`, `publishProfile`, `unpublishProfile`, project page CRUD, `getPortfolioAnalytics`, resend-verification, builder-locale.

## Per-Endpoint Review (sample)
- **POST /api/portfolio/track:** auth not required (public analytics); validates username/eventType; slices inputs; owner check via session; dedupe-gated; returns 202 always. Evidence: track/route.ts. Good. CSRF not applied (mutation without cookie reliance? It reads session cookie for owner check; CSRF gap applies). 
- **Admin endpoints:** all guarded by `requireAdminApi()`; audit log writes. Good.
- **Auth endpoints:** CSRF applied; rate limited. Good.

## Missing Authorization Checks
- Verify `/api/me/*` ownership scoping (notifications updateMany scoped to user — verified phase E). Others not individually verified here. **DB-API-01 (Medium):** Full endpoint-by-endpoint ownership audit recommended (not performed).

## Inconsistent Status Codes
- Track returns 202 for all outcomes (by design, fire-and-forget). OK.
- Username-available returns availability. OK.

## Unhandled Exceptions
- Track wraps in try/catch → 202. Good.
- Several silent `catch(() => {})` (lastLoginAt update, session delete) hide failures (per prior audit REL). **DB-API-02 (Low-Medium):** log or handle.

## Excessive Payloads
- `/u` passes full profile to client (but DTO used for public). Builder receives full profile. OK.
- Sitemap capped 500+500. OK.

## Missing Pagination
- Admin DataTable ≤100. Notifications paginated. Subscription history paginated. OK. Verify all list endpoints paginated (not enumerated).

## Inconsistent Validation
- Zod content schema enforced in updatePortfolio/publish. Other endpoints (admin forms) use Zod per settings registry. Auth uses manual. Generally consistent. OK.

## Slow Operations
- Analytics fan-out (see performance). Admin search unindexed. OK.

## Summary
Database design solid (indexes, FKs, cascades, dedupe). Main risks: transaction atomicity of save, ownership audit completeness, dual-write storage growth, Cloudinary orphan cleanup. API surface well-structured; CSRF breadth remains the cross-cutting gap.