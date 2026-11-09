# Actual Rendering Trace

## Component tree for homepage cards
Builder preview (Classic):
- `BuilderClient` → `LivePreview`
- `ClassicTemplate`
- `renderGridCard` / `renderListCard`
- `ProjectCardMedia`
- `ProjectCardBody`
- `renderProjectLinks()` (actually renders card CTA inside `links={hasProjectLinks(...) ? renderProjectLinks(...) : null}`)

Editorial:
- `BuilderClient` → `LivePreview`
- `EditorialMarketingTemplate` → `projectCards.map()`
- `<ProjectCardBody>` equivalent via `emk__project-body`
- `p.href` → page/external CTA

Public homepage:
- `/u/[username]/page.tsx`
- `ClassicTemplate` or `EditorialMarketingTemplate`
- same project card render paths

## CTA control
Classic:
- `hasProjectLinks(project)` calls the shared resolver.
- `renderProjectLinks(project)` renders `<Link>`/`<a>` CTA for kind `page`/`external`.

Editorial:
- `projectCards` builds `p.href` and `p.isPage` via the same resolver.
- Returns a `Link` or anchor CTA if `p.href` exists.

## Exact delay case
The resolver is the only shared CTA decision. Before the latest hardening, the effective type was determined strictly from `project.linkType`/`content.linkType` and the page lookup was based on canonical slug. A card with a valid page slug but a **missing, empty, differently cased, or stale linkType** counted as no CTA. Then `hasProjectLinks` returned false and the button disappeared.

## Root cause fix locations
- `src/lib/project-card-links.ts`
- `src/app/profile/builder/ProjectManager.tsx`
- `src/lib/actions/portfolio.ts`
- `src/components/portfolio/templates/ClassicTemplate.tsx`
- `src/components/portfolio/templates/EditorialMarketingTemplate.tsx`