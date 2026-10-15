# Portfolio Builder — Freemium Tier Strategy

> Pivot premise: portfolio is the product users pay for; workspaces ride along as a bonus. All proposals below need code/UI only — no paid services, no custom domains, no email delivery.

## Part 1 — Feature Inventory

| Feature (exists today unless noted) | Class | Rationale |
|---|---|---|
| Public page at hosted URL + subdomain | Must-be-free | The shareable link IS the acquisition loop; gating it kills virality |
| Hero, About, Experience sections | Must-be-free | A portfolio without identity and history is not a CV — unattractive |
| 1 project case-study page | Must-be-free | Proof-of-work is the aha moment; one project makes Free genuinely useful |
| EN/AR inputs, visitor toggle, RTL | Must-be-free | Core MENA differentiator; must be visible to every visitor to build trust |
| Mobile-responsive public view | Must-be-free | Most Egyptian clients browse on phones; non-negotiable |
| SEO titles and descriptions | Must-be-free | Free users ranking on Google advertise the platform |
| Draft vs published states | Must-be-free | Technical necessity — users need safe editing |
| Classic template layout | Must-be-free | Free needs one good-looking default |
| Basic theme (primary color, fonts, logo, light/dark) | Must-be-free | Identity ownership; a gray identical page converts nobody |
| Services, Skills sections | Gate-able | Valuable but not essential for a first portfolio |
| Projects 2–3 | Gate-able | Natural usage-based gate: first project free, portfolio growth paid |
| Project galleries, tags, covers | Gate-able | Rich case studies are the freelancer's pitch deck |
| Workspace-asset embeds in projects | Gate-able | The work-to-portfolio pipeline is the premium magic |
| WhatsApp float button | Gate-able | Direct client contact = money feature; high willingness to pay |
| Advanced theme (per-section colors, custom backgrounds, action buttons) | Gate-able | Vanity and polish freelancers pay for once earning |
| Extra project pages (4+) | Gate-able | Scales with freelancer success |
| Testimonials section (build required — data models exist, no builder UI) | Enhancement | Trust signal clients demand; code/UI only |
| Second template, e.g. minimal bold layout (build required) | Enhancement | Template choice is the classic portfolio upsell; pure frontend |
| View counter on dashboard (build required — count rows in existing DB) | Enhancement | "12 clients viewed your profile" is the strongest upgrade nudge; no external service |
| Download-CV / print stylesheet (build required) | Enhancement | Egyptian freelancers still send PDF CVs; pure frontend |
| Link-in-bio block section (build required) | Enhancement | Replaces paid link tools; trivial component |

## Part 2 — Free Tier Design

Free = one complete, beautiful, shareable portfolio with a single proof-of-work project.

- **Hosted public page** — WHY: every shared link is free advertising; gating the URL destroys acquisition.
- **Hero, About, Experience** — WHY: without identity plus history the page is not a CV and the freelancer bounces before aha.
- **1 project page** — WHY: one case study delivers the "my work looks real" moment that builds trust; the pain of the second project sells Pro.
- **EN/AR + RTL + responsive + SEO** — WHY: the differentiator must be experienced, not described; mobile and Google visibility are table stakes.
- **Basic theme (color, font, logo, light/dark)** — WHY: ownership feeling; a page that looks like theirs gets shared.
- **Draft/published** — WHY: technical necessity for safe editing.
- **What Free sees instead for the rest:**
  - 2nd project slot, Services/Skills sections, galleries, WhatsApp button, advanced theme: visible as locked rows/cards with a lock badge opening an upgrade modal — never silently hidden, so desire builds in context.
  - Testimonials, 2nd template, view counts, CV download: hidden until Pro (they do not exist yet; no placeholder debt).

## Part 3 — Pro Tier Design

Price anchor: 99–149 EGP/month — roughly one hour of junior freelance work, paid back by a single client lead.

| Pro feature | Exists today? | Effort | Zero external cost? |
|---|---|---|---|
| Unlimited project pages | Exists (remove cap) | Small | Yes |
| Services + Skills sections unlocked | Exists (visibility gate) | Small | Yes |
| Project galleries, tags, covers | Exists (gate) | Small | Yes — current storage quotas apply |
| Workspace-asset embeds | Exists (gate picker) | Small | Yes |
| WhatsApp float button | Exists (gate toggle) | Small | Yes |
| Advanced theme controls | Exists (gate panel) | Small | Yes |
| Testimonials section | Build required | Medium | Yes — models already in schema |
| 2nd template (minimal) | Build required | Medium | Yes — same data, new layout |
| Profile view counter + dashboard card | Build required | Medium | Yes — internal counting |
| Download-CV print stylesheet | Build required | Small | Yes — browser print to PDF |
| Link-in-bio block | Build required | Small | Yes |

Ship-day Pro = six gates flipped (all Small). Roadmap Pro = five builds, none needing services, DNS, SMTP, or storage upgrades.

## Part 4 — Conversion Strategy

**Trigger 1 — The second project.** The freelancer finishes project one, clicks "Add project," hits the lock the moment they have new work to show — portfolio = pipeline, and growth is blocked.
- Message: "Your second case study is ready to impress — Pro unlocks unlimited projects. Your first client from this page pays for a year. [Upgrade — 149 EGP/mo]"

**Trigger 2 — The silent-view nudge.** Weekly digest area (and dashboard card for Pro-gated counts): "Your profile was viewed 12 times this week" with per-viewer detail locked. Nothing motivates like evidence of demand they cannot see.
- Message: "12 potential clients viewed your portfolio this week. Pro shows you exactly which work they opened. [See who's watching — Pro]"

**Trigger 3 — The WhatsApp moment.** Visitor taps the contact button on a Free page, or the owner toggles contact settings — the direct line between portfolio and income.
- Message: "Clients who message you directly close 3× faster. Add your WhatsApp button with Pro and never lose a lead to a dead page. [Enable WhatsApp — Pro]"
