# PortfolioHub Admin Panel — Full Documentation

## Overview

The PortfolioHub admin panel is a server-rendered operations console (Next.js App Router + Prisma) for managing an Egyptian creator platform built around offline/manual payments (InstaPay, Vodafone Cash, bank transfer via WhatsApp). Admins review subscription requests, confirm payments, manage users, subscriptions, plans, portfolios, announcements, audit history, and platform settings. Every page and API route is gated by `requireAdmin` / `requireAdminApi` (admin-only). All mutations write to `adminAuditLog`. The layout shell (`AdminLayoutShell`) provides a collapsible desktop sidebar, mobile drawer, theme toggle, notification bell, live badge counts for pending requests/payments, and quick links to the live site and builder.

---

## Pages

### /admin — Dashboard
- **Purpose:** Mission-control overview of business operations, revenue, and platform health.
- **Data shown:** Lifetime confirmed revenue (EGP), estimated MRR (30-day normalized from active subscriptions), month-over-month revenue growth %, top performing plan, 5 most recent confirmed payments (user, provider, date, amount), total users + new users in 7 days, live/draft/hidden portfolio counts, pending request/payment counts, maintenance-mode banner.
- **Actions available:** Review requests (→ `/admin/requests?status=PENDING`), review payments (→ `/admin/payments`), revenue intelligence (→ `/admin/revenue`), user directory (→ `/admin/users`), audit portfolios (→ `/admin/portfolios`), Support Hub (→ `/admin/support`), Announcements (→ `/admin/announcements`), Manage in Settings.
- **Filters/Search:** None (aggregate view).
- **Linked to:** `/admin/support`, `/admin/announcements`, `/admin/requests`, `/admin/payments`, `/admin/revenue`, `/admin/users`, `/admin/portfolios`, `/admin/settings`, `/admin/users/[id]` (per recent payer), `/u/[username]` implied creator links.

### /admin/revenue — Revenue & Financial Intelligence
- **Purpose:** Deep-dive financial view: MRR, cohorts, and verified payment stream.
- **Data shown:** Estimated MRR, lifetime revenue, MoM growth, top subscription tier; per-plan cohort table (tier name, pricing, active creators + share %, monthly contribution, MRR share bar, active/archived badge); last 20 confirmed payments (date/time, creator account, amount, gateway, reference, per-row User link).
- **Actions available:** Export Payments CSV (`CsvExportButton`), Manage plans (→ `/admin/plans`), All payments (→ `/admin/payments`), per-row User link (→ `/admin/users/[id]`).
- **Filters/Search:** None.
- **Linked to:** `/admin` (back), `/admin/plans`, `/admin/payments`, `/admin/users/[id]`.

### /admin/users — User Management
- **Purpose:** Searchable, paginated directory of all registered users with bulk operations.
- **Data shown:** Total/registered counts, per-user email, display name, role (Admin badge), status badge, last login.
- **Actions available:** Search, status filter + reset, bulk select (checkboxes), Export All On Page / Export Selected (CSV via `UserTableClient`), bulk Suspend / Unsuspend / Delete Selected (with confirm modals), per-row Manage (→ `/admin/users/[id]`), pagination (Previous/Next preserving filters).
- **Filters/Search:** `search` (email or name, case-insensitive), `status` (All/Active/Suspended), pagination (`page`, `pageSize`).
- **Linked to:** `/admin/users/[id]` (per row).

### /admin/users/[id] — User Detail
- **Purpose:** Full 360° account dossier for one user with inline admin actions.
- **Data shown:** Avatar initial, name, email, Admin badge, status badge, active browser session count, owned workspaces, public portfolio link + status/hidden badges, registration date; unified chronological timeline (registration, portfolio updates, subscriptions, payments, admin audit events); subscriptions history table (plan, period, amount, status; up to 20); payments history table (date, amount, provider, status; up to 20); audit history list (action code, reason, actor, timestamp; up to 20).
- **Actions available:** `UserActions` panel — Edit details, Grant subscription, Send email, Suspend/Unsuspend, Reset password (one-time temp password shown once + copy), Revoke sessions, Delete account (email-typed confirmation); Support preview (→ preview page), Live portfolio (`/u/[username]` external), View in subscriptions / View in payments (prefiltered), View all audit logs.
- **Filters/Search:** None on page (tables capped at 20, links carry prefiltered queries outward).
- **Linked to:** `/admin/users` (back), `/admin/users/[id]/preview`, `/u/[username]`, `/admin/subscriptions?search=`, `/admin/payments?user=`, `/admin/audit-log`.

### /admin/users/[id]/preview — Support Portfolio Preview
- **Purpose:** Read-only rendering of a user's portfolio for support diagnosis.
- **Data shown:** User name/email in toolbar, portfolio status/HIDDEN badge, username path; full portfolio via `ClassicTemplate`, or a "No portfolio created" empty state.
- **Actions available:** Back to user (→ `/admin/users/[id]`), device mode switcher (desktop/tablet/mobile widths), Live site (`/u/[username]` external).
- **Filters/Search:** None.
- **Linked to:** `/admin/users/[id]`, `/u/[username]`.

### /admin/support — Support Hub
- **Purpose:** Global instant lookup across accounts, subscriptions, payments, and portfolios.
- **Data shown:** Without query: 5 most recent customers, pending-payment and suspended-user counts, operator tips card. With query `q`: matching user cards each showing header (avatar, name, admin badge, email, phone, UUID, status), 4 diagnostic pillars (subscription + plan + expiry, latest payment + status, portfolio site + hidden status + updated date, sessions + join date), and a quick action bar.
- **Actions available:** Search Customer (by email/name/phone/UUID), Clear, per-result Manage User Account, Support Preview, Subscriptions (prefiltered), Payments (prefiltered), Live Site (external).
- **Filters/Search:** `q` free-text search (email, displayName, phone, exact id).
- **Linked to:** `/admin/users/[id]`, `/admin/users/[id]/preview`, `/admin/subscriptions?search=`, `/admin/payments?user=`, `/u/[username]`, `/admin/payments`, `/admin/users?status=SUSPENDED`.

### /admin/requests — Subscription Requests
- **Purpose:** Approve or reject offline subscription requests (WhatsApp/manual transfer receipts).
- **Data shown:** Total + filtered counts, per-request code + date + admin note, user (name/email/phone), plan (name + EGP), status badge, per-row Approve/Reject (if PENDING) or "Handled" chip.
- **Actions available:** Status filter (Pending/All/Approved/Rejected/Canceled) + Reset to pending, per-row `RequestActions` (Approve modal with confirmed amount EGP + optional reference; Reject modal with required reason), pagination.
- **Filters/Search:** `status`, pagination.
- **Linked to:** Self with query params (no outward user links on this table beyond names as text).

### /admin/subscriptions — Subscriptions
- **Purpose:** Manage the full subscription ledger.
- **Data shown:** Total count, per-subscription user (link + email), plan name, period (start → expiry), status badge (SUSPENDED derived from `canceledAt`), per-row `SubscriptionActions`.
- **Actions available:** CSV export (`CsvExportButton`), search (user email/name) + status filter (All/Active only/Suspended only/Expired only) + Reset, per-row Extend (days modal), Suspend/Unsuspend (confirms), Override (status + optional expiry + reason modal writing an immutable `subscriptionEvent`), pagination.
- **Filters/Search:** `search`, `status`, pagination.
- **Linked to:** `/admin/users/[id]` (per row user link).

### /admin/payments — Payments
- **Purpose:** Verify and track all manual payment records.
- **Data shown:** Total recorded count, per-payment date/time, user (link + email), amount EGP, provider chip, status badge, per-row `PaymentActions`.
- **Actions available:** CSV export, filter form (Search user, From date, To date, Filter + Reset), per-row Confirm (PENDING only; verification-checklist modal with optional note; auto-activates linked subscription) + User link, pagination.
- **Filters/Search:** `user`, `from`, `to` (date range), pagination.
- **Linked to:** `/admin/users/[id]` (per row).

### /admin/plans — Plans
- **Purpose:** Configure subscription tiers, pricing, and availability.
- **Data shown:** Per-plan name, price EGP, duration days, status badge (Active/Inactive) + subscriber count, per-row `PlanActions`.
- **Actions available:** `PlanCreateToggle` (show/hide) → `PlanForm` (create: name, price, duration), per-row Edit (modal), Activate/Deactivate (inline PATCH), Delete (confirm; refused by API when subscriptions exist).
- **Filters/Search:** None (single table, `meta` is synthetic page 1 of N).
- **Linked to:** None.

### /admin/portfolios — Portfolios
- **Purpose:** Audit and moderate public portfolios.
- **Data shown:** Total count, per-portfolio `/u/[username]` link + display name, status badge + HIDDEN badge with reason, owner email link, per-row `PortfolioActions`.
- **Actions available:** Search (username/name) + status filter (All/Draft/Published) + visibility filter (Visible+hidden/Visible only/Hidden only) + Search/Reset, per-row Hide (reason-required modal) / Unhide (confirm), pagination.
- **Filters/Search:** `search`, `status`, `hidden`, pagination.
- **Linked to:** `/u/[username]` (external, per row), `/admin/users/[id]` (owner email).

### /admin/announcements — Announcements
- **Purpose:** Broadcast banners/alerts to creators across builder and dashboards.
- **Data shown:** Count, per-announcement type chip (INFO/WARNING/SUCCESS/MAINTENANCE with icon), title, active/archived badge, body, audience, created/expiry dates.
- **Actions available:** New Announcement (modal: title, body, type, audience ALL/SUBSCRIBERS/FREE, publish-immediately checkbox, optional expiry), per-row Activate/Deactivate, Edit (modal), Delete (confirm).
- **Filters/Search:** None.
- **Linked to:** None.

### /admin/audit-log — Audit Log
- **Purpose:** Immutable trail of every admin mutation for accountability.
- **Data shown:** Total event count, per-event date/time, acting admin email, action code chip, target type + target-user email link, inline reason/metadata preview + `AuditDetailModal` (full action/admin/target/timestamp grid, reason, sanitized JSON metadata with Copy JSON).
- **Actions available:** Filter form (Filter action text, From date, To date, Filter + Reset; `actor` param accepted though no visible actor input), View event modal, pagination.
- **Filters/Search:** `actor` (admin id, URL-param only), `action` (substring), `from`/`to` dates, pagination.
- **Linked to:** `/admin/users/[id]` (target user email).

### /admin/settings — System Settings
- **Purpose:** Platform-wide branding, subscription policy, and emergency maintenance.
- **Data shown:** Maintenance card (Active/Live badge + explainer), setting groups (Platform and branding, Billing and subscriptions, Contact and support channels) with key, description, current value; dirty-dot per modified field.
- **Actions available:** `MaintenanceToggle` (Enable via danger-confirm / Disable directly), per-field edit, sticky Save-all/Discard bar (appears when dirty; saves dirty keys one PATCH at a time with partial-failure count).
- **Filters/Search:** None.
- **Linked to:** None.

---

## Components

### AdminLayoutShell.tsx
- **Purpose:** The admin chrome: sidebar, mobile drawer, top header, theme toggle, notifications, badge counts.
- **Used in:** `src/app/admin/layout.tsx` (only; wraps all admin pages).
- **Props:** `userEmail: string`, `pendingRequestsCount?`, `pendingPaymentsCount?`, `children: ReactNode`.
- **Actions it handles:** Reads `usePathname` for active nav + closes mobile drawer on route change/Escape, persists sidebar collapse to `localStorage`, toggles `next-themes` light/dark, renders `NAV_ITEMS` (12 entries) with Requests/Payments count badges and collapsed-dot indicators.

### AdminSidebar.tsx
- **Purpose:** Legacy/standalone collapsible desktop sidebar (same 12 nav items, persisted collapse). Superseded in the live layout by `AdminLayoutShell`'s built-in sidebar; still present in codebase.
- **Used in:** Nothing (no imports found — dead/legacy component).
- **Props:** None.
- **Actions it handles:** Local collapse toggle persisted to `localStorage`.

### AdminModal.tsx (+ AdminConfirmModal)
- **Purpose:** Accessible modal primitives (focus trap, Tab cycling, autofocus, Escape/backdrop close, body scroll lock) plus a confirm-dialog wrapper.
- **Used in:** `UserActions`, `UserTableClient`, `RequestActions`, `SubscriptionActions`, `PaymentActions`, `PortfolioActions`, `PlanActions`, `AnnouncementManager`, `AuditDetailModal`, `MaintenanceToggle`.
- **Props:** `AdminModal`: `isOpen`, `onClose`, `title`, `description?`, `children`, `maxWidth?` (sm/md/lg). `AdminConfirmModal`: `isOpen`, `onClose`, `onConfirm`, `title`, `description`, `confirmText?`, `cancelText?`, `variant?` (danger/primary), `loading?`.
- **Actions it handles:** None (pure UI; parents wire mutations).

### DataTable.tsx
- **Purpose:** Shared server-row table with filter-preserving pagination, RTL support, and empty state.
- **Used in:** Requests, Subscriptions, Payments, Plans, Portfolios, Audit-log pages.
- **Props:** `columns: DataColumn[]`, `rows: Record<string, ReactNode>[]`, `rowKeys: string[]` (RSC-safe serialization), `meta: PageMeta`, `basePath`, `params`, `emptyText`.
- **Actions it handles:** Pagination link building; empty-state Clear-filters (`router.push(basePath)`) vs Refresh (`router.refresh()`).

### StatusBadge.tsx
- **Purpose:** Single color-coded status pill used everywhere (success/warning/danger/neutral by uppercased status, auto Title-Case label).
- **Used in:** User detail, Users table, Requests, Subscriptions, Payments, Revenue cohorts, Portfolios, Announcements, Audit detail, BuilderPreviewClient, UserTimeline, Support page.
- **Props:** `status: StatusType`, `label?`, `className?`, `size?` ('sm' | 'md').
- **Actions it handles:** None (presentational).

### UserActions.tsx
- **Purpose:** The 8-action dossier panel on the user detail page (edit, grant sub, email, suspend/unsuspend, reset password, revoke sessions, delete).
- **Used in:** `/admin/users/[id]`.
- **Props:** `userId`, `status`, `userEmail`, `displayName?`, `phone?`, `isAdmin?`, `availablePlans: PlanOption[]`.
- **Actions it handles:** `PATCH /api/admin/users/[id]` (edit), `DELETE /api/admin/users/[id]` (email-confirmed), `POST .../suspend|unsuspend|reset-password|revoke-sessions|grant-subscription|send-email` (with toasts + `router.refresh()`; temp password shown once with copy).

### UserTableClient.tsx
- **Purpose:** Interactive users table: bulk multi-select, CSV export, sticky bulk-action bar, pagination.
- **Used in:** `/admin/users`.
- **Props:** `users: UserRowData[]`, `meta: PageMeta`, `basePath`, `params`.
- **Actions it handles:** `exportCsvFile` (page or selected), per-id `POST .../suspend|unsuspend`, `DELETE /api/admin/users/[id]` in sequence with success/fail counts and toasts; selection state + modals.

### UserTimeline.tsx
- **Purpose:** Chronological vertical timeline of a user's lifecycle events with type icons and status badges.
- **Used in:** `/admin/users/[id]`.
- **Props:** `events: TimelineEvent[]` (`id`, `timestamp`, `type`: user|subscription|payment|portfolio|audit, `title`, `description?`, `status?`, `actor?`).
- **Actions it handles:** None (renders newest-first).

### RequestActions.tsx
- **Purpose:** Per-row Approve/Reject for pending subscription requests.
- **Used in:** `/admin/requests`.
- **Props:** `requestId`, `defaultAmount?`.
- **Actions it handles:** `POST /api/admin/subscription-requests/[id]/approve` (`amountEgp` + optional `reference`), `POST .../reject` (`reason` required), with toasts + refresh.

### SubscriptionActions.tsx
- **Purpose:** Per-row subscription lifecycle controls (extend, suspend/unsuspend, status override).
- **Used in:** `/admin/subscriptions`.
- **Props:** `subscriptionId`, `canceled`, `currentStatus?`, `expiresAt?`.
- **Actions it handles:** `POST /api/admin/subscriptions/[id]/extend|suspend|unsuspend|override` with modals/toasts/refresh; override writes an immutable `subscriptionEvent`.

### PaymentActions.tsx
- **Purpose:** Per-row payment verification (confirm pending) + shortcut to the payer.
- **Used in:** `/admin/payments`.
- **Props:** `paymentId`, `status`, `userId`, `amountEgp`, `provider`.
- **Actions it handles:** `POST /api/admin/payments/[id]/confirm` (optional note; activates linked subscription) via checklist modal.

### PortfolioActions.tsx
- **Purpose:** Per-row portfolio moderation (hide with reason / unhide).
- **Used in:** `/admin/portfolios`.
- **Props:** `username`, `hidden`.
- **Actions it handles:** `POST /api/admin/portfolios/[username]/hide|unhide` with toasts + refresh.

### PlanActions.tsx
- **Purpose:** Per-row plan edit / activate-deactivate / delete.
- **Used in:** `/admin/plans`.
- **Props:** `planId`, `isActive`, `initialName?`, `initialPriceEgp?`, `initialDurationDays?`.
- **Actions it handles:** `PATCH /api/admin/plans/[id]` (edit fields or `isActive` toggle), `DELETE /api/admin/plans/[id]` (blocked server-side when subscriptions exist).

### PlanForm.tsx
- **Purpose:** Create-plan form (name, price EGP, duration days).
- **Used in:** `PlanCreateToggle` (on `/admin/plans`).
- **Props:** None.
- **Actions it handles:** `POST /api/admin/plans` + toast + refresh + form reset.

### PlanCreateToggle.tsx
- **Purpose:** Show/hide wrapper for the create-plan form.
- **Used in:** `/admin/plans`.
- **Props:** None.
- **Actions it handles:** None (toggles `PlanForm` visibility).

### AnnouncementManager.tsx
- **Purpose:** Full CRUD UI for system announcements (cards + create/edit/delete/toggle modals).
- **Used in:** `/admin/announcements`.
- **Props:** `initialAnnouncements: AnnouncementItem[]` (id, title, body, type, active, targetAudience, dismissible, startsAt, expiresAt, createdAt).
- **Actions it handles:** `POST /api/admin/announcements`, `PATCH|DELETE /api/admin/announcements/[id]`, inline active-toggle PATCH; toasts + refresh.

### SettingsForm.tsx
- **Purpose:** Grouped settings editor (platform / billing / contact) with dirty tracking and sticky save bar.
- **Used in:** `/admin/settings`.
- **Props:** `items: SettingItem[]` (`key`, `value`, `description`).
- **Actions it handles:** One `PATCH /api/admin/settings` per dirty key (partial-failure count reported); Discard resets local state.

### MaintenanceToggle.tsx
- **Purpose:** Emergency platform maintenance-mode switch card.
- **Used in:** `/admin/settings`.
- **Props:** `initialEnabled: boolean`.
- **Actions it handles:** `POST /api/admin/settings/maintenance` (`enabled`, optional reason) with danger-confirm on enable; toast + refresh.

### AuditDetailModal.tsx
- **Purpose:** "View event" drill-down for one audit row (action/admin/target/timestamp grid, reason, sanitized JSON with Copy JSON).
- **Used in:** `/admin/audit-log` (per row).
- **Props:** `id`, `action`, `adminEmail`, `target`, `reason?`, `metadata?`, `createdAt`.
- **Actions it handles:** Clipboard copy of metadata JSON (toast feedback). No API calls.

### CsvExportButton.tsx (+ exportCsvFile)
- **Purpose:** Client-side CSV download helper (UTF-8 BOM for Arabic/Excel) + button wrapper.
- **Used in:** Revenue page, Subscriptions page, Payments page; `exportCsvFile` also reused by `UserTableClient`.
- **Props:** `filename`, `headers`, `rows`, `label?` (default "Export CSV"), `disabled?`, `size?`, `variant?`.
- **Actions it handles:** None server-side; builds Blob from pre-fetched page rows and toasts row count (empty → info toast).

### BuilderPreviewClient.tsx
- **Purpose:** Support-mode read-only portfolio renderer with device switcher.
- **Used in:** `/admin/users/[id]/preview`.
- **Props:** `userId`, `userName`, `userEmail`, `profile: any` (public profile incl. status/adminHidden/username).
- **Actions it handles:** None (client-side device width state only; renders `ClassicTemplate`).

---

## API Routes

All admin API routes require admin auth (`requireAdminApi`, backed by `requireAdmin` session check) — **Auth required: yes** on every endpoint below. All mutating routes write `adminAuditLog` entries (directly or via `audit()`).

### User Management APIs
- `GET /api/admin/users?search=&status=&page=&pageSize=` — Paginated user list (email/name search, ACTIVE/SUSPENDED filter). Output: `{ ok, items, meta }`.
- `GET /api/admin/users/[id]` — Single user dossier (profile, portfolio status, workspace names, session count). Output: `{ ok, user }` / 404.
- `PATCH /api/admin/users/[id]` — Update displayName/email/phone/isAdmin. Input: JSON partial fields; guards: self-demotion forbidden (403), email conflict (409). Output: `{ ok, user }`.
- `DELETE /api/admin/users/[id]` — Permanent cascading hard delete in one transaction (audit refs nulled, notes/referrals/memberships/content/media/workspaces/payments/requests/subscriptions/profiles/sessions/tokens/notifications removed). Input: none (email confirmation enforced client-side). Self-delete blocked (400). Output: `{ ok, message }`.
- `POST /api/admin/users/[id]/suspend` — Set SUSPENDED + kill all sessions. Self-suspend blocked. Output: `{ ok }`.
- `POST /api/admin/users/[id]/unsuspend` — Restore to ACTIVE. Output: `{ ok }`.
- `POST /api/admin/users/[id]/reset-password` — Generate one-time 12-char temp password (unambiguous alphabet), bcrypt-hash, force change on next login, kill sessions. Output: `{ ok, tempPassword }` (returned once).
- `POST /api/admin/users/[id]/revoke-sessions` — Delete all sessions. Output: `{ ok, revoked }`.
- `POST /api/admin/users/[id]/send-email` — Notify user. Input: `{ subject, bodyText }` (both required). Side effect: server log + in-app `Notification` row (best-effort). Output: `{ ok, message }`.
- `POST /api/admin/users/[id]/grant-subscription` — Manual free grant. Input: `{ planId, durationDays ≥ 1, note? }`. Creates ACTIVE subscription with `amountEgp: 0` and `planSnapshot.grantedByAdmin`. Output: `{ ok, subscription }`.

### Subscription APIs
- `GET /api/admin/subscriptions?status=&page=&pageSize=` — Paginated ledger (note: server does not apply the page-level ACTIVE/SUSPENDED/EXPIRED filter — filtering happens in the page's Prisma query; the route returns all ordered by startedAt). Output: `{ ok, items, meta }`.
- `POST /api/admin/subscriptions` — Manual grant by userId or email. Input: `{ userId|email, planId, amountEgp?, note? }`. Continues ACTIVE periods (starts at current endsAt). Output: `{ ok, subscriptionId }`.
- `POST /api/admin/subscriptions/[id]/suspend` — Set `canceledAt` (→ SUSPENDED, portfolio hidden). Input: `{ reason? }`. Output: `{ ok }`.
- `POST /api/admin/subscriptions/[id]/unsuspend` — Clear `canceledAt`. Output: `{ ok }`.
- `POST /api/admin/subscriptions/[id]/extend` — Push `expiresAt` (+ grace snapshot) forward. Input: `{ days: 1–365 }`. Output: `{ ok }`.
- `POST /api/admin/subscriptions/[id]/override` — Direct lifecycle edit. Input: `{ status: ACTIVE|SUSPENDED|EXPIRED|TRIAL|CANCELED, expiresAt?, reason? }`. Writes immutable `subscriptionEvent` (ADMIN_OVERRIDE). Output: `{ ok, subscription }`.

### Subscription Request APIs
- `GET /api/admin/subscription-requests?status=&page=&pageSize=` — Paginated requests (PENDING/APPROVED/REJECTED/CANCELED or all). Output: `{ ok, items, meta }`.
- `POST /api/admin/subscription-requests/[id]/approve` — Atomic: PENDING-lock → dates (A4 renewal rule + grace days setting) → Subscription + confirmed Payment (`whatsapp_manual`) + audit. Input: `{ amountEgp ≥ 0, reference?, note? }`. Double-approve → 409 CONFLICT. Output: `{ ok, subscriptionId }`.
- `POST /api/admin/subscription-requests/[id]/reject` — PENDING→REJECTED + audit. Input: `{ reason }` required. Non-pending → 409. Output: `{ ok }`.

### Payment APIs
- `GET /api/admin/payments?user=&from=&to=&page=&pageSize=` — Paginated payments (user email/name search, date range). Output: `{ ok, items, meta }`.
- `POST /api/admin/payments/[id]/confirm` — Mark CONFIRMED (confirmedBy/At, completedAt); if linked to a subscription, extend its period and set ACTIVE + write `PAYMENT_CONFIRMED` event. Input: `{ note? }`. Output: `{ ok, payment }`.

### Plan APIs
- `GET /api/admin/plans` — All plans by sortOrder with i18n names, limits, subscriber counts. Output: `{ ok, items }`.
- `POST /api/admin/plans` — Create plan. Input: `{ name, priceEgp ≥ 0, durationDays 1–3650, sortOrder?, isActive?, limits?, nameI18n? }`. Output: `{ ok, id }` (201).
- `PATCH /api/admin/plans/[id]` — Partial update (same field validation). Output: `{ ok }`.
- `DELETE /api/admin/plans/[id]` — Delete only when zero subscriptions exist, else 409 (deactivate instead). Output: `{ ok }`.

### Portfolio APIs
- `GET /api/admin/portfolios?search=&status=&hidden=&page=&pageSize=` — Paginated portfolios (username/displayName search, DRAFT/PUBLISHED, visible/hidden). Output: `{ ok, items, meta }`.
- `POST /api/admin/portfolios/[username]/hide` — Set `adminHidden` + reason. Input: `{ reason }` required (≤500 chars). Output: `{ ok }`.
- `POST /api/admin/portfolios/[username]/unhide` — Clear `adminHidden` + reason. Output: `{ ok }`.

### Dashboard API
- `GET /api/admin/dashboard` — Real counters only (no charts): usersTotal, usersNew7d, portfoliosPublished/Draft/Hidden, workspacesTotal. Output: `{ ok, dashboard }`.

### Announcement APIs
- `GET /api/admin/announcements` — All announcements newest-first. Output: `{ ok, announcements }`.
- `POST /api/admin/announcements` — Create. Input: `{ title, body, type?, targetAudience?, active?, dismissible?, expiresAt? }`. Output: `{ ok, announcement }` (201).
- `PATCH /api/admin/announcements/[id]` — Partial update (title/body/type/audience/active/dismissible/expiresAt). Output: `{ ok, announcement }`.
- `DELETE /api/admin/announcements/[id]` — Permanent delete. Output: `{ ok }`.

### Audit Log API
- `GET /api/admin/audit-log?actor=&action=&from=&to=&page=&pageSize=` — Paginated audit events with secrets scrubbed (`sanitizeAuditMeta`). Output: `{ ok, items, meta }`.

### Settings APIs
- `GET /api/admin/settings` — All registry keys with values + descriptions. Output: `{ ok, items }`.
- `PATCH /api/admin/settings` — Update one key (registry-validated via `parseSettingValue`; 400 unknown key / 422 invalid value). Input: `{ key, value }`. Output: `{ ok }`.
- `GET /api/admin/settings/maintenance` — Read maintenance flag. Output: `{ ok, maintenanceMode }`.
- `POST /api/admin/settings/maintenance` — Toggle maintenance. Input: `{ enabled: boolean, reason? }`. Output: `{ ok, maintenanceMode }`.

---

## Feature Matrix

| Feature | Page | Component | API Route |
|---------|------|-----------|-----------|
| View business KPIs | /admin | — (page-level Prisma) | GET /api/admin/dashboard |
| Review subscription requests | /admin/requests | DataTable, StatusBadge, RequestActions | GET /api/admin/subscription-requests |
| Approve request (amount+ref) | /admin/requests | RequestActions | POST /api/admin/subscription-requests/[id]/approve |
| Reject request (reason) | /admin/requests | RequestActions | POST /api/admin/subscription-requests/[id]/reject |
| List subscriptions | /admin/subscriptions | DataTable, StatusBadge, SubscriptionActions | GET /api/admin/subscriptions |
| Extend subscription | /admin/subscriptions | SubscriptionActions | POST /api/admin/subscriptions/[id]/extend |
| Suspend subscription | /admin/subscriptions | SubscriptionActions | POST /api/admin/subscriptions/[id]/suspend |
| Unsuspend subscription | /admin/subscriptions | SubscriptionActions | POST /api/admin/subscriptions/[id]/unsuspend |
| Override subscription | /admin/subscriptions | SubscriptionActions | POST /api/admin/subscriptions/[id]/override |
| Grant subscription (ledger) | /admin/subscriptions | SubscriptionActions | POST /api/admin/subscriptions |
| List payments | /admin/payments | DataTable, StatusBadge, PaymentActions | GET /api/admin/payments |
| Confirm payment | /admin/payments | PaymentActions | POST /api/admin/payments/[id]/confirm |
| List users + bulk ops | /admin/users | UserTableClient, DataTable pattern | GET /api/admin/users |
| View user dossier | /admin/users/[id] | UserActions, UserTimeline, StatusBadge | GET /api/admin/users/[id] |
| Edit user details | /admin/users/[id] | UserActions | PATCH /api/admin/users/[id] |
| Delete user (permanent) | /admin/users/[id] (+ bulk in /admin/users) | UserActions, UserTableClient | DELETE /api/admin/users/[id] |
| Suspend user | /admin/users/[id] (+ bulk) | UserActions, UserTableClient | POST /api/admin/users/[id]/suspend |
| Unsuspend user | /admin/users/[id] (+ bulk) | UserActions, UserTableClient | POST /api/admin/users/[id]/unsuspend |
| Reset password (temp) | /admin/users/[id] | UserActions | POST /api/admin/users/[id]/reset-password |
| Revoke sessions | /admin/users/[id] | UserActions | POST /api/admin/users/[id]/revoke-sessions |
| Send email to user | /admin/users/[id] | UserActions | POST /api/admin/users/[id]/send-email |
| Grant free subscription | /admin/users/[id] | UserActions | POST /api/admin/users/[id]/grant-subscription |
| Support portfolio preview | /admin/users/[id]/preview | BuilderPreviewClient | — (reads Prisma + toPublicProfile) |
| Global user lookup | /admin/support | StatusBadge | — (page-level Prisma) |
| List plans | /admin/plans | DataTable, PlanCreateToggle, PlanForm, PlanActions | GET /api/admin/plans |
| Create plan | /admin/plans | PlanCreateToggle, PlanForm | POST /api/admin/plans |
| Edit / toggle plan | /admin/plans | PlanActions | PATCH /api/admin/plans/[id] |
| Delete plan | /admin/plans | PlanActions | DELETE /api/admin/plans/[id] |
| Audit portfolios | /admin/portfolios | DataTable, StatusBadge, PortfolioActions | GET /api/admin/portfolios |
| Hide portfolio | /admin/portfolios | PortfolioActions | POST /api/admin/portfolios/[username]/hide |
| Unhide portfolio | /admin/portfolios | PortfolioActions | POST /api/admin/portfolios/[username]/unhide |
| Revenue intelligence | /admin/revenue | CsvExportButton, StatusBadge | — (page-level Prisma) |
| Export CSV (revenue/subs/payments/users) | /admin/revenue, /admin/subscriptions, /admin/payments, /admin/users | CsvExportButton / exportCsvFile | — (client-side from page rows) |
| Manage announcements | /admin/announcements | AnnouncementManager | GET+POST /api/admin/announcements, PATCH+DELETE /api/admin/announcements/[id] |
| View audit trail | /admin/audit-log | DataTable, AuditDetailModal | GET /api/admin/audit-log |
| Edit platform settings | /admin/settings | SettingsForm | GET+PATCH /api/admin/settings |
| Toggle maintenance mode | /admin/settings (+ banner on /admin) | MaintenanceToggle | GET+POST /api/admin/settings/maintenance |

---

## Sidebar Navigation

Defined once in `AdminLayoutShell.NAV_ITEMS` (in this order; `AdminSidebar.NAV` duplicates it without badges):

1. Dashboard → `/admin` (exact match)
2. Revenue → `/admin/revenue` (Banknote icon)
3. Users → `/admin/users` (Users icon)
4. Support → `/admin/support` (LifeBuoy icon)
5. Requests → `/admin/requests` (Inbox icon, badge = pending request count, warning pill; dot when collapsed)
6. Subscriptions → `/admin/subscriptions` (CreditCard icon)
7. Payments → `/admin/payments` (Receipt icon, badge = pending payment count)
8. Plans → `/admin/plans` (Tags icon)
9. Portfolios → `/admin/portfolios` (Globe icon)
10. Announcements → `/admin/announcements` (Megaphone icon)
11. Audit log → `/admin/audit-log` (ScrollText icon)
12. Settings → `/admin/settings` (Settings icon)

Header extras: hamburger (mobile), signed-in email, Live site link, Builder link, theme toggle, NotificationBell. Mobile drawer adds Live Site + Builder shortcut buttons.

---

## Identified Issues & Improvement Opportunities

1. **Dead code — `AdminSidebar.tsx` is unused.** `AdminLayoutShell` embeds its own copy of the sidebar (with badges, mobile drawer, header). `AdminSidebar` duplicates the same 12-item nav without badges and has zero imports. It should be deleted or re-exported from the shell to avoid divergence (items already differ: shell has `NAV_ITEMS` with badge keys).
2. **Sidebar nav defined twice.** `NAV_ITEMS` (shell) vs `NAV` (sidebar) are separate literals; adding a route requires editing both. Single source of truth recommended.
3. **CSV exports cover only the current page of rows.** Revenue, subscriptions, payments, and users exports serialize the rows already fetched for display (`take` ≤ pageSize), not the full filtered set — admins may mistake a partial export for a complete one. Filename/headers don't record the active filters.
4. **Audit-log `actor` filter has no visible input.** The page forwards an `actor` param to the API, but the filter form only renders action/from/to fields — the actor filter is URL-only and undiscoverable.
5. **Two subscription-grant paths with different semantics.** `POST /api/admin/subscriptions` (ledger grant, continues ACTIVE periods, amount recorded) vs `POST /api/admin/users/[id]/grant-subscription` (free grant, `amountEgp: 0`, standalone dates). The UI exposes them in different places (Subscriptions page has no grant button; user detail has Grant) with similar names — easy to apply the wrong one.
6. **Status vocabulary is inconsistent.** Subscriptions use `canceledAt`-derived SUSPENDED alongside a `status` column (ACTIVE/EXPIRED/TRIAL/CANCELED/SUSPENDED); payments mix `CONFIRMED`/`confirmed`/`PENDING`; `StatusBadge` uppercases everything so `confirmed` and `CONFIRMED` render identically but filter code must handle both spellings in several places.
7. **Dashboard page and dashboard API disagree.** `/admin` page runs its own rich Prisma aggregates (revenue, MRR, cohorts) while `GET /api/admin/dashboard` returns a smaller counter-only payload that no admin page consumes — likely a stale/unused endpoint.
8. **`send-email` doesn't actually send email.** The route logs to console and writes an in-app `Notification` row; the name plus the "Email sent successfully" toast imply SMTP delivery that isn't wired up.
9. **User detail tables are capped at 20 with no pagination.** Subscriptions, payments, and audit lists on `/admin/users/[id]` use `take: 20` and link out for more — acceptable, but counts shown (e.g. "Subscriptions (42)") have no in-place way to see rows 21+.
10. **Bulk user operations are sequential per-ID fetches.** `UserTableClient` loops `fetch` per selected user for suspend/unsuspend/delete with no concurrency limit and no atomicity — a 50-user bulk action fires 50 requests; partial failures are reported only as counts.
11. **No bulk approve/reject for subscription requests.** Requests — the highest-volume queue — support only one-by-one Approve/Reject, unlike users which have bulk toolbar actions.
12. **Search coverage is uneven.** Users search covers email/name (not phone in list page, though support page does); payments search covers email/name but not provider, amount, or reference; audit action filter is substring but actor has no input.
13. **Announcement `targetAudience` uses magic strings** (`ALL`/`SUBSCRIBERS`/`FREE`, no shared enum with the reader side visible here) and `dismissible` is accepted by the API but never edited in the manager UI (always defaults true on create, unchangeable afterwards).
14. **Settings save is N sequential PATCH requests** (one per dirty key) with only a failure count on partial failure — no per-key error detail and no rollback of the keys that succeeded.
15. **Preview page is genuinely read-only but nothing enforces it beyond UI.** `BuilderPreviewClient` renders `ClassicTemplate` with no editing controls, which is correct — but worth noting the guarantee is presentational (admins can't mutate from this view because no mutation UI exists, not because of a data lock).

---

*Report generated by read-only discovery. No source files were modified. Counts: 14 pages + layout, 21 component files (incl. AdminModal + AdminConfirmModal in one file), 29 API route files (38 endpoints across GET/POST/PATCH/DELETE).*
