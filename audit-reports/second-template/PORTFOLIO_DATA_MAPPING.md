# Portfolio Data Mapping — Reference vs Existing PortfolioHub Fields

## Mapping table

| Reference section | Existing fields/models/sources | Status | Notes for new template |
|---|---|---|---|
| **Hero — name** | `Profile.displayName`, `appearance.font`, `localized.displayName` | Fully supported | Same source used by ClassicTemplate. |
| **Hero — professional title** | `profile.professionalTitle`, `localized.professionalTitle` | Fully supported | No change. |
| **Hero — description / bio** | `profile.bio`, `localized.bio` | Fully supported | Pick `pickLang(lang, bio)`. |
| **Hero — avatar / portrait** | `profile.avatarUrl` + `appearance.avatarPosition` | Fully supported | Or use Brand/logo style in hero. |
| **Hero — CTA** | `contactLinks`, `actionButtons` (`whatsappNumber`), social footer. `actionButtons.showScrollToTop` styles behavior | Fully supported with transform | CTA label neutralize / uppercase allowed only via CSS, not data changes. |
| **Brands** | Section `clients` (`clientsContent`: `items[]` = `{ id, name, logoUrl, url }`), + `title`, sizing (`logoShape/logoSize/grayscale`) | Supported | Maps directly. Reference's animation grid becomes grid (CSS). |
| **Featured Projects** | Profile pages sections `projects` (`projectsContent.items`), `ProjectPage` rows (`title`, `slug`, `description`, `coverImage`, `tags`, `projectUrl`), `showInProjects` | Supported | Some reference card attributes have no data representation (industry, tag, badges). Can be **computed presentation** only (e.g., industry from `tags[0]`), but **never** auto-fill random fields — empty fields simply don't show. |
| **Project case studies (6)** | `ProjectPage` (slug, cover, description, externalLink, items per type) + `/u/[username]/projects/[slug]` URL | Existing public route | Template detail page must follow `ProjectPageView.tsx` and `appearance` for logo/colors. |
| **About narrative** | `about` section (`title`, `heading`, `description`, `achievements`, `stats`, `experience`) | Supported | Stats map directly to `c.stats`. |
| **Stats** | `about.content.stats: {number,label,icon?}` | Supported | Keys kept optional. |
| **Skills** | `skills` + `serviceCard`/`skill group`, `profile.skills[]`, localized skills | Fully supported | Reference renders two columns; map by grouping or use ALL skills in a column. |
| **Services** | `services` section items (title, description, price?, icon? features?) + `Service` model rows from `userProfile.services` | Supported with shape mapping | Need verify content vs `Service` model both exist. |
| **Education** | `profile.experience` (experience model) + `education` section? Classic template has `education` section content `degree/institution/fieldOfStudy/startDate/endDate/current/description`, plus `profile.education` | Fully supported locally | Reference timeline; no schema additions. |
| **Experience** | `experience` section (`experiences`/`items`/job title/companies) | Fully supported | Not referenced by template? Reference doesn't have experience, so omit if absent without changing content. |
| **Contact** | `contactLinks` (contact/URLs), `Footer.links`, contact section title/headline/subheading/desc (exists in contactContent) | Fully supported | Handled through Existing R2 interactions in Next.js. |
| **Footer** | Rendered globally by PortfolioFooter / existing footer content (`footerContent.links`, about social), footer style settings via appearance (footerBg/Text types) | Supported | Footer can remain shared. |
| **Testimonials** | `testimonials` content + `Testimonial` rows; free-locked longform limited | Supported conditionally | Only if user has data; empty quietly (no fake content). |
| **Gallery/Files** | `gallery` / `files` sections | Supported | Section not in reference; omit if empty. |
| **Hero CTA / contact icons** | Uses `lucide` (any icon + existing array): email, WhatsApp (`actionButtons.whatsapp`), LinkedIn, contact links. | Supported | No client-only generated icon calls. |
| **Bilingual / localized fields** | `pickLang(profile.localized)`, `localized` object; builder bilinguallangMode | Fully supported | Must render content with owner-approved locale. Reference itself is only EN; new template MUST remain RTL-ready from DOM structure. |
| **Localization** | `defaultLanguage` / `n` / font values | Fully supported | Language selector map remains. |
| **Free/Paid** | `isFree` from subscription state; `stripLockedSectionsForFree` and `FREE_ALLOWED_SECTIONS = {'hero','about','projects','footer'}` | Important | If editorial template defaults Core content like services to Free, new restrictions must be defined server-side based on content; never treat a missing section as shown on free. |
| **Projects shown on home (`showInProjects`)** | `projectPages` filtered in `getPublicProfile` (include) and `/projects/[slug]` only when `isRealSlug()` referenced | Existing driver | Projects cards require cover + title + link; empty gracefully. |

## Unsupported, but not forcing changes

- **Industry** and `project.tag` as unique categories: would require new fields to perfectly match reference (“Education & Tag: Content Strategy & Plan”). Keep optional; either use `tags` join if meaningful or suppress field.
- **Brand logos**: existing `clients` field is just an array of `logoUrl` + name only; could not auto-create new brand grids. Fine as input.
- **Stat icon map**: content allows icon (from registry), but HTML text addition only.
- **Case-study item `badges` from ref**: no existing badges (could implement as `tags` on project). Optional.

## No schema changes required (initial)

Everything required for home hero/brand/about/stats/skills/services/education/contact/footer/stats/client/project case studies is already there.

Potential later fields:
- `appearance.template` (exists in local `Appearance` TypeScript interface and `Appearance` stored in JSON). No Prisma column for `template`—currently stored under `appearance JSON` safely if schema unblocks via `safeStr` validator.
- Optional per template `variant` settings e.g. `appearance.heroVariant` could be added as `Json` but not needed now.

## Existing data is authoritative

`Profile.bio`, `localized`, projects, page sections, services, testimonials, education, experiences, files, galleries remain entirely intact. No migration.
