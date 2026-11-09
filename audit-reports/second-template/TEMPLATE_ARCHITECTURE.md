# Second Template Architecture (Safe Render + Optional Switch)

## Core principle

**Portfolio content is domain data. Template is presentation.**

Therefore I recommend **a renderer rather than a separate public page / new application**:

- One public route (`/u/[username]`) queries once (already does; `cache(async)`).
- One resolver returns profile + subscription state.
- One generic render function picks a **validated, allow-listed** template component based on a stored value.
- ClassicTemplate remains `<ClassicTemplate …/>` exactly.
- Second template becomes a separate file (e.g. `EditorialMarketingTemplate.tsx`) and an ` EditorialMarketingTemplate` React component that takes the same `profile/isFree/…` props.

This means no database migrations: the template key can live in `profile.appearance.template`, an unstructured `Json` object (already in schema). We should still add one validator:
- `SAFE_TEMPLATES = ['classic', 'editorial-marketing']` and reject client-provided strings at server update layer.

## Proposed component boundaries

```
src/components/portfolio/templates/
  ClassicTemplate.tsx (untouched)
  EditorialMarketingTemplate.tsx (NEW)
  index.ts -> export { ClassicTemplate } { EditorialMarketingTemplate }
  types.ts -> TemplateProps = { profile, isFree, preview, onThemeChange }
src/lib/templates/
  registry.ts -> TEMPLATE_REGISTRY: Record<TemplateId, Component>
  resolveTemplate(appearance): TemplateId (server safe)
src/app/u/[username]/page.tsx:
  const resolved = resolveTemplate(profile.appearance)
  <div className="no-cq">{createElement(TEMPLATE_REGISTRY[resolved], { profile, isFree })}</div>
```

Admin preview (`BuilderPreviewClient`) and `LivePreview` do the same.

`appearance.template` currently is allowed as arbitrary unknown via `catchall(z.unknown())`. Use a schema extension:
 Add `safeTemplate` in `portfolio-schema.ts` (similar to `safeStr`) limited to peers and tests (backwards compat).

## Rendering boundary

- Keep `appearance` JSON in contract; user theme is template scoped the same way.
- Context shared: expose `TemplateContext` with `lang/dir` but don't globally pollute.
- Playfair font: use `next/font/google` injected classes via component outer wrapper:
  - `const playfair = Playfair_Display({ subsets: ['latin'], display:'swap', variable:'--font-display' })`
  - apply `playfair.className` + `.emk-template` scope
  - Inter already global, so either import or inherit
  - Only load font in the editoral wrapper (Next handles dedup) to avoid Front-Classic bundle.
- Toast/Button/global tokens remain tokens; editorial template may define CSS variables in nested `.emk-scope` but must not override global `:root` (risk!).

## Styling isolation

- Use **container queries** not media queries. Reference CSS uses media widths; inline preview requires `@container`, so adapt.
- Scope every editorial style block with `.emk-template [{properties}]`.
- Define local custom props prefixed `--emk-*` in `.emk-template` (never `--color-*` or `--on-*`, to avoid leaking into builder chrome).
- Avoid plain `.button`, `.header`, `.nav` classnames (they overlap with existing marketing and admin docs). Use `.emk-header`, `.emk-nav`, `.emk-btn` etc., OR a CSS module.
- Highly recommended: CSS Modules for subcomponent/section components to prevent naming clashes.

## Templates resolver table

Template key | Status
------|---
`classic` | current default, zero changes
`editorial-marketing` | optional, implemented as new component
unknown/default | resolve to `classic`

## Fallback order

1. Parse `appearance.template`.
2. If null, invalid, not allowlisted, or an old row → `classic`.
3. Eventually, if template metadata exists but implementation is not deployed yet → `classic`.

No error path should yield a white screen; guard render in `ErrorBoundary` at route level.
