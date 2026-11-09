# Phase 1 — Customer Color Preservation

Read-only inspection with emphasis on stored appearance data and public portfolio rendering. No source code, schema, seed data, database value, or configuration was changed.

## 1. Storage model

Customer portfolio appearance is stored as JSON in:

- Prisma model: `UserProfile.appearance` (`prisma/schema.prisma`, `UserProfile`, JSON nullable)
- Related field: `UserProfile.localized` for localized profile content.
- Validation source: `src/lib/portfolio-schema.ts` `appearanceSchema`.
- Sanitization: `validateProfileExtras()` silently preserves the raw value if validation fails, so old data is never rejected.

`appearanceSchema` uses `.catchall(z.unknown())`, so future fields are tolerated without schema migrations.

## 2. How users choose colors

UI entry point: `src/app/profile/builder/ThemeSettings.tsx`.

- Light/dark site colors are selected independently with raw color pickers (`ColorField`).
- Primary, accent, outline colors are raw color pickers.
- Reset to defaults replaces appearance keys with a legacy slate/sky palette.
- Defaults for new users are set in `src/lib/actions/portfolio.ts` whenever a `UserProfile` is created.
- Color values are passed through `handleAppearanceChange` into `updateProfile`, then persisted via the `updatePortfolio` server action.

## 3. How saved colors are loaded

Public portfolio:

1. `ClassicTemplate.tsx:374-395` reads `appearance.primaryColor`, `accentColor`, `bgColorLight`, `bgColorDark`, etc., with hardcoded fallbacks.
2. `appearance.outlineColor || primary`.
3. Color mode comes from `visitorTheme` and `defaultColorMode`.
4. `style` object converts all saved colors to component-scoped CSS variables (`--color-primary`, `--color-bg`, `--color-text`, etc.).

Project page:

- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx:131-148` repeats the same fallback mapping for project pages.

Result: public rendering does not inherit app-shell CSS variables for customer colors; saved customer values are the effective source of truth.

## 4. Default and resolution behavior

- If a field is missing or null, the template uses hardcoded `#38BDF8`, `#818CF8`, `#F0F9FF`, etc.
- If `appearanceSchema` fails to parse a value, `validateProfileExtras` preserves raw appearance rather than discarding it.
- `defaultColorMode` controls which saved background/text pair is visible.
- `cardBackground`, `mutedText`, and `borderColor` are optional and may be null; fallback behavior is explicit in template code.
- Footer colors use CSS-variable fallbacks only if not saved.
- Null profile (new user) creates a full appearance object via server action defaults.

## 5. Legacy formats

No hex-based legacy conversion is performed. The app assumes the modern fields exists. Some profiles may:
- contain null or missing optional fields, handled by fallback;
- contain future/extra fields due to `.catchall`;
- use an older default palette (`#38BDF8/#818CF8`);
- have no footer/logo fields, handled by fallback and null/undefined.
No migration to change format is currently necessary.

## 6. Templates

Only one public template is active (`ClassicTemplate`). `ProjectPageView` repeats the same color-resolution logic. Any future change to default fallback constants must be made in both template and project page, plus defaults in `portfolio.ts` and ThemeSettings reset, or colors will diverge.

## 7. Proposed-change classification

### A. Safe global correction

Changes to shared app/design-token UI without touching `appearance`, customer database rows, template fallbacks, or reset behavior:
- App shell text-muted color.
- App shell semantic success/warning/danger tokens as consumed by dashboard UI.
- Toast solid color text/fill pairs.
- Admin warning badge text color.
- Analytics hardcoded #2563eb can become app primary while paired with white text because both pass.

### B. Default-only correction

Changes that affects only newly created portfolios or “reset defaults” behavior:
- Update fallback constants in `ClassicTemplate.tsx`, `ProjectPageView.tsx`, `portfolio.ts`, and `ThemeSettings.tsx`.
- Update default `appearance` object created by `updatePortfolio`/profile creation.
- Update ThemeSettings reset button to a vetted palette.

Impact: existing portfolios with saved values remain unchanged. Portfolios with missing/null colors or newly created profiles get the new defaults. Users who click reset get updated defaults.

### C. Existing customer impact

Changes to the app-shell tokens themselves do **not** automatically change published portfolio colors, because customer portfolios use component-level variables. However some contexts could render app-shell tokens inside portfolio-facing pages:
- analytics dashboard (`/u/[username]/analytics` or owner dashboard)
- footer palette fallback when saved values are absent
- components inside public pages that use `var(--color-*)` directly instead of customer variables.

No silent update should touch saved appearance rows.

### D. Requires migration or data transformation

None recommended for Phase 1 color work.

The only possible data work would be a voluntary contrast-warning backfill or a user-initiated reset, not a migration. A broad migration that rewrites customer color values would break customization expectations and must not be used without explicit approval.

## 8. Risks and safeguards

- Adding a new color token is safe, but renaming or removing tokens from app shell may affect admin/analytics components.
- Changing `--color-warning`, `--color-danger`, `--color-success` can affect UI across builder, admin, notifications and status badges; must be reviewed comprehensively.
- Changing app primary color impacts focus rings, links, buttons, active states. The current app brand blue should remain recognisable.
- Customer color fallback constants are repeated in multiple files; update them only with tests and staging.
- Projects with null colors (older data) would change appearance if fallback constants are changed. This is acceptable only as default hygiene, not as a silent brand rebrand, and must be documented in release notes.

## 9. Hard rules for implementation

1. Never update stored `UserProfile.appearance` values to “fix” contrast.
2. Never replace saved colors with app tokens globally.
3. Never mutate portfolio colors through CSS variable changes.
4. Use non-blocking contrast warnings in the builder instead.
5. Keep all app-shell semantic changes in category A only.
6. Put any default palette changes in category B with approval and staging.
7. If a component unexpectedly inherits app tokens inside public portfolio, classify it as C and implement a customer-variable fallback before changing the global token.
EOF
echo done