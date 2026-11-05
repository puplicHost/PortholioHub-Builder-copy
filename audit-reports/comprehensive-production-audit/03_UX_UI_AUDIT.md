# UX / UI Audit — PortfolioHub Builder

## 5.1 Landing Page
- `src/app/page.tsx` + `src/components/landing/LandingPage.tsx` + `LandingHeader.tsx`. Hero per language, hreflang ar/en/x-default present (phase H verified). CTAs → `/register` and demo `/u/testuser`. OG image via dynamic `/og`.
- **UX-LAND-01 (Low-Medium):** Terms/privacy stubs are unlinked from landing (verified phase H). Legal content pending.
- **UX-LAND-02 (Low):** Trust signals (testimonials, logos) not evident from code; verify content.

## 5.2 Registration & Authentication
- Forms: `src/app/login/LoginForm.tsx`, `src/app/register/RegisterForm.tsx`, `src/app/change-password/ChangePasswordForm.tsx`. Validation, error messages, loading/disabled states, redirect param (`?redirect=`) wired (Sprint A).
- **UX-AUTH-01 (Medium):** Email verification never delivers (stub) → verify-required flow may block users. File: `src/lib/resend/send.ts`.
- **UX-AUTH-02 (Low):** Phone field required at register; login email-only (by design). Ensure error recovery clear.

## 5.3 Portfolio Builder
- `BuilderClient.tsx` (4,821 lines) split-pane: top bar (undo/redo/save/publish/preview), left (pages/sections), center (LivePreview), right (theme/sections/projects/testimonials). Drag-and-drop via dnd-kit + keyboard arrows (ReorderButtons, in-progress).
- Autosave 2 s debounce, single-flight, backoff, beforeunload guard, conflict modal (phase F4 verified).
- **UX-BLD-01 (Medium):** Builder is desktop-oriented; mobile uses Monitor/Smartphone toggle but no explicit drawer/bottom-sheet. Check small screens (320–430px).
- **UX-BLD-02 (Medium):** Conflict modal markup is client-state-only (absent from SSR by design); proven via Playwright. Ensure discoverability.
- **UX-BLD-03 (Low):** Long-form content editing; empty states/placeholders partially implemented (gap analysis: default sections created with translated content, opposite of plan).
- **UX-BLD-04 (Low):** Image upload UX via Cloudinary; unsigned preset security (see security).
- **UX-BLD-05 (Low):** Experience item reordering WIP (uncommitted) — incomplete; keyboard accessibility being added.

## 5.4 Public Portfolio Experience
- `src/app/u/[username]/page.tsx` + `ClassicTemplate.tsx`. Sections: hero/about/skills/experience/services/projects/testimonials/footer. Language/dark-mode toggle inside page. WhatsApp floating button tracked.
- **UX-PUB-01 (Medium):** Long Arabic text / long usernames may break layout; not tested. REQUIRES SAFE TEST ENVIRONMENT (visual).
- **UX-PUB-02 (Low):** Empty/broken image states; `TestimonialsSlider` lightbox. Verify no layout shift.
- **UX-PUB-03 (Low):** "View page" button opens `/u/username` always without published-state awareness (gap analysis).

## 5.5 Admin Dashboard
- `src/app/admin/*`: layout with collapsible sidebar, dashboard counters, users (+detail/suspend/reset/revoke), portfolios hide/unhide, audit log, settings registry, requests/subscriptions/payments/plans.
- Shared `DataTable` (server pagination ≤100, URL-synced). 
- **UX-ADM-01 (Medium):** Admin user search uses unindexed `contains insensitive` → slow at scale.
- **UX-ADM-02 (Low):** Admin happy paths code-verified only (need admin session); not manually verified in this audit.
- **UX-ADM-03 (Low):** Missing common admin actions? Gap analysis lists full admin nav present. Verify bulk actions.

## 5.6 Subscription & Notifications UX
- `/profile/subscription`: status card, plans grid, request+WhatsApp+cancel, history.
- Admin requests queue approve/reject.
- Notifications: bell (badge 99+, dropdown 10, polling 30s + focus refetch), `/profile/notifications` (paginated, filters, read/read-all).
- **UX-SUB-01 (Medium):** Grace period communication and expiration reminders exist (lifecycle cron). Verify email delivery (stub) → reminders never arrive.
- **UX-NOT-01 (Low):** Notification polling 30 s (performance + UX). Consider focus refetch only.

## 5.7 Design Consistency
- Design language documented in gap-analysis §6: navy + blue primary `#0066cc`, Cairo Play Arabic, Inter/Space Grotesk, radii 4/8/12/16/20, button/input heights, stagger animation.
- **UX-DSG-01 (Low):** Landing, builder, public, admin all reuse tokens (per visual-freeze checks). Minor inconsistencies possible; verify via screenshots (not done here).

## Responsive Design Audit (§6)
Viewports 320–1920 not tested visually in this audit (no browser run). **REQUIRES SAFE TEST ENVIRONMENT.** Code review suggests:
- Admin DataTable horizontal overflow possible on mobile (needs scroll container).
- Builder split-pane likely unusable below 768px (by design; toggle exists).
- Touch targets: ReorderButtons chevrons 3.5×3.5 (14px) — below 44px recommended; drag handles small. (Accessibility concern too.)

## Accessibility (§7) — see 06_SEO_ACCESSIBILITY_AUDIT.md summary
- Touch target sizes small (ReorderButtons). Color contrast not verified. Focus states present (`focus-visible:ring`). Reduced motion not evident. ARIA on drag-and-drop partial. RTL `dir` set on root. Language attribute set.

## Overall UX Verdict
Core flows functional and tested (smoke + conflict specs pass). Primary UX risks: email non-delivery, mobile builder usability, admin search performance, polling overhead. Recommend targeted UX validation in a safe test environment before changes.<|end|><|start|><|start|>write to=assistant<|channel|>analysis <|constrain|>xml<|message|><rfl:parameter name="path">
/run/media/abdelrhman/ce5c2321-cae0-41d0-8d0b-4f69e26612db1/My SaaS/PortholioHub-Builder-copy/audit-reports/comprehensive-production-audit/03_UX_UI_AUDIT.md