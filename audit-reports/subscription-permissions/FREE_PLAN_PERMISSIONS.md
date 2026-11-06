# Free Plan Permissions

## Allowed (Free)
- Hero, About Me, Project Cards, Footer: edit, save.
- Project cards: add/edit/delete/reorder (without standalone project pages).
- Publish within free plan limits.

## Paid-only (locked for Free)
- experience, education, skills, services, testimonials, custom, clients, gallery, files, contact, contact-info, stats.
- Standalone project-page creation (temp id `new-` blocked server-side).

## Enforcement
- UI: locked sections shown but not editable (lock icon + toast); "Add Section" becomes locked button for free users.
- Server: `updatePortfolio` drops locked sections from incoming payload and blocks creation of new project pages for free users.
- Public render: locked sections stripped from preview/portfolio for free via `stripLockedSectionsForFree`.

## Data preservation
- Existing paid content is preserved in DB (server simply doesn't overwrite dropped sections; they remain). Editability restored on upgrade. No deletion of content, subscriptions, or payments.