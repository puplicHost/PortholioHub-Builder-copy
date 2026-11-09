# Security & Permission Review for Second Template

## 1. Ownership model remains unchanged

- No template choice may weaken ownership resolution.
- A write API for template selection goes through the existing authenticated update flow, which resolves `userId` from the session; never accept owner ids from the browser.
- The template key alone is a UI variant, not the authority to read private files.

## 2. Entitlements

- Keep `getSubscriptionState` + `getEntitlements` as the only authority.
- If `editorial-marketing` can be premium-only (product decision), implement `canUseTemplate(ent, templateId)` server-side with the allowlist. Free users keep only Classic and cannot switch.
- Never accept lock state over the API (blocks in `isSectionLockedForFree` already).
- Template selection won't change FREE-locked sections (services, skills etc killed by `stripLockedSectionsForFree` for free/public).

## 3. File / private data access

- No changes to R2 content API; media URLs still flow through `mediaId` + authorized endpoints.
- URLs remain sanitized with `sanitizeUrl` before persistence (as are case study links derived from `ProjectItem.externalUrl`).
- Brand `logoUrl`, profile avatar, project cover and gallery images remain stored as platform URLs (already safe). New design just references them.
- No raw `innerHTML` from content: case-study asset HTML must render through React text/schema-sanitized fields.

## 4. Public visibility

- Existing `isPortfolioVisible`/`status===PUBLISHED`, adminHidden rules persist; template doesn't change access.
- Free user continues sees no locked sections regardless of template.
- Project detail remains Pro-only via `canViewLockedSections` (unchanged).
- Template switch in draft mode visible to owner only (builder); public rerender only after row update + next server render.

## 5. Validate template input (server)

- Typical request `{ profile.appearance.template = "..." }` must be validated in `src/lib/actions/portfolio.ts` (probably `handleAppearanceChange` flows or dedicated action).
- Allowlist (`classic`, `editorial-marketing`) rejects unknown/update.
- Resolve unknown => Classic; not 500. Return "invalid template".
- Audit logged (existing admin audit system) if needed.

## 6. List of things explicitly forbidden in this implementation phase

- No client tell of paid template access
- No new cloud storage key exposure
- No publish of hidden draft through template path
- No `eval` or arbitrary CSS imported as `client` string
- No copying user-uploaded asset into reference folders

## 7. Key risks mitigated

- Additional component uses existing Supabase auth session. No new endpoints without server guards.
- Modern CSP: no CDN/lucide external script; use existing `lucide-react`.
- Fonts loaded via `next/font` to prevent external font policy violations.
- Markdown/pure text fields are HTML-escaped if author-free text is added later (recommended using structured Profile item text; no rich HTML parser yet).