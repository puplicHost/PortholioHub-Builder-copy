# Implementation Roadmap (Post-Approval, NOT Started)

Phase P is safety phase. All phases regression-gated.

## Phase 1 (P1) — Read-only scaffold and safety guards (0 risk data)
- Add template resolver in `src/lib/templates/registry.ts` as Classic only.
- Add allowlist validation helper (`SAFE_TEMPLATES`).
- Extend `portfolio-schema.ts` safe template string.
- Add tests: resolver unknown → classic.

## Phase 2 (P2) — Component skeleton (no source data change)
- Create `EditorialMarketingTemplate.tsx` shell, sections primitives, scoped CSS (CSS Module).
- Implement Hero, About, Stats sections consuming profile fields.
- Fonts via next/font.
- Playwright (when approved) visual screenshots.

## Phase 3 (P3) — Content rendering (logical section continuity)
- Map project section, skills/services/education/contact/clients.
- Empty-state behavior.
- Case study detail page variant (project page) that follows details and list.
- Fields derivatives: only valid data; tags as badges if meaningful.

## Phase 4 (P4) — Builder integration
- Header action: Template selector modal with preview/use.
- Persist template (call API) server-side.
- `LivePreview` optional template arg and admin `BuilderPreview`.
- Toggle rollback / preview without writes.

## Phase 5 (P5) — Data preservation verification
- Before/after hash tests (profile + appearance except template unchanged).
- Migration warnings no data transforms.

## Phase 6 (P6) — Accessibility / Performance
- axe checks + contrast validation, reduced motion, RTL/translated.
- Bundle containment tests with dynamic imports.

## Phase 7 (P7) — Staging verification
- E2E route rendering + inspector checks + subscription parity + no automatic unapproved production deploy.

Dependencies:
- P1 -> P2 -> P3 -> P4 -> P5/P6
- P7 when manual approval.

Verification endpoints:
- Vitest targeted (new template tests).
- Lint changed files.
- TypeScript.
- Any deploy only explicitly approved.

## Risk matrix
- Data integrity: low if P1-P4 obey read-only contract.
- UI regressions Classic template: low if isolated styles.
- Security: medium if allowlist/entitlements mishandled — require code review on P4.
- Performance: medium if Playfair font globally loaded — verify dynamic.

Approval gate before P2: owners confirms for free/premium feature eligibility and branding final nature.