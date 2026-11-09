# Cross-System Integration Audit

Purpose: trace a single piece of content end-to-end and identify where Builder input, persistence, preview and public rendering can disagree.

## 1. End-to-end trace (verified)

```
Builder input
  ↓ React state (`updateProfile` = setProfile, no server round-trip)
Client payload (username, avatarUrl, appearance, localized, contactLinks,
                sections = pages[0].sections, projects = projectPages,
                expectedVersion)
  ↓ Server Action `updatePortfolio` (src/lib/actions/portfolio.ts:386)
Auth (`getCurrentUser`) → entitlements (`getSubscriptionState`, server DB)
  ↓ Free plan filtering (locked sections removed, page creation blocked)
Validation (`validateProfileExtras`, `validateSections`, `validateProjects`)
  ↓ Prisma transaction:
      sections updated/created (home page only)
      project pages deleted-by-omission / created / updated
      project items deleted + re-created (with card→page item migration)
      profile JSON + version bump LAST (optimistic concurrency)
  ↓ after(): revalidate /profile/builder and /u/{username}
Reload:
  getOrCreateProfile (builder) / getPublicProfile (public)
  ↓ Builder hydrates top-level linkType/linkedPageSlug from content JSON
  ↓ Public route strips locked sections for Free, resolves template, renders
```

The happy path is transactionally coherent. The defects below occur at the seams.

## 2. Project ↔ standalone page relationship

### What works
- Association stored in `ProjectPage.content` (`linkType`, `linkedPageSlug`); re-hydrated to top level on load (`actions/portfolio.ts:271–288`).
- Card id ↔ page slug linking in both directions (card editor dropdown, page editor "link to project" dropdown) (`ProjectManager.tsx:1062–1105`; `BuilderClient.tsx:2229–2252`, `2334–2375`).
- Public card link rendering uses the same fallback (`content.linkType`/`content.linkedPageSlug`) in Classic and Editorial.
- Public detail route verifies: published page, published/visible portfolio, Pro subscription, and at least one referencing card/item (`projects/[slug]/page.tsx:18–56`).
- Page deletion clears references server-side and client-side (`actions/portfolio.ts:1274–1290`; `BuilderClient.tsx:2254–2295`).

### Confirmed integration failures
| ID | Failure | Evidence |
| --- | --- | --- |
| F-12 | No "View Page" affordance in the Pages list or card list; only top-bar View Live / Edit linked page. View Live 404s for drafts and for unlinked cards whose own slug is not referenced. | `BuilderClient.tsx:4978–5045`, `ProjectManager.tsx:258–302`, `2015–2031`, `4535–4551`; route reference check `projects/[slug]/page.tsx:47–55` |
| F-11 | Renaming a linked page's slug does not update any card's `linkedPageSlug`; all links break. | `updateProjectPageField` `2219–2226`; slug input `2325–2333`; no propagation code |
| F-28 | Deleting a card (local + save-by-omission) does not clear links in *other* cards that point at it; `deleteProjectPage` would, but is not used for cards. | `ProjectManager.tsx:570–588`; `updatePortfolio` deletion `636–644` vs cleanup `1274–1290` |
| F-34 | `isPublished` cannot be changed from the UI; a legacy unpublished linked page produces a card link to a 404. | Model field; only badge read `BuilderClient.tsx:5018`; route filter `projects/[slug]/page.tsx:20–24` |
| F-49 | Low | Linking a card to another card is allowed by the fallback option list when no content pages exist; public route can serve it, but deleting the target card hits F-28. | `ProjectManager.tsx:1068–1085` |

Manual verification required for the exact reported "View Page may not appear" symptom: source contains **no such action at all**, so the report is best explained as a missing affordance (F-12), not a conditional-visibility bug. If a user saw it in an older build, `git log -S "View Page"` finds no matching string in the repository history available locally — confirm with the user which button label/version they mean.

## 3. Attachments, files and inline video

### What works
- Project-page item uploads go to R2; `ProjectPageView.itemHref` maps `/api/files/r2/{id}` to `/portfolio/viewer/{id}` (viewer), and page links to `/u/{user}/projects/{slug}` (`ProjectPageView.tsx:89–104`).
- R2 content routes authorize: public files readable, private files owner-only (`api/files/r2/[id]/content/route.ts:12–20`; download route same).
- Video: upload stores `/api/files/r2/{id}/content`; both templates restrict inline video sources to that same-origin route (`ProjectCard.tsx:27–32`, `ProjectCardMedia:126–135`; Editorial `EditorialMarketingTemplate.tsx:326–331`). Video does not autoplay; poster-first.
- `itemCards` metadata is positional and validated through `readProjectItemCardMeta`/`withProjectItemCardMeta`; card visual, file type, image fit/aspect and item links survive reload (`ProjectManager`/`ProjectPageView`).
- Deleting an item splices both the relational item array and `itemCards` metadata consistently in the page editor (`BuilderClient.tsx` around `2510–2535`).

### Risks/limitations
- **No lifecycle cleanup of R2 objects on deletion**: deleting a project page/item removes DB rows but does not delete `MediaFile`/R2 objects (media remains until reclaimed by storage tooling). Label: confirmed behavior, storage-cost risk, not data loss.
- Home **cards** cannot expose a card-level R2 attachment: the card editor only supports image/URL items (files are page-item mode), and public card link rows only render http(s) extra links (`ClassicTemplate.tsx:1400–1404`; Editorial `319`). Card-level attachments therefore cannot be published as downloads; project pages are the supported path.
- `ProjectPage.gallery` string array is persisted but never rendered in `ProjectPageView` or Classic’s project detail path — dead field, no user-facing effect.

## 4. Template switching and appearance preservation

- **Switching Classic → Editorial**: builder writes the whole current snapshot with only `appearance.template` changed. All sections/projects/appearance keys travel unchanged. Correct when there are no pending edits (see F-27 for the pending-edit side effect).
- **Switching back**: template key `classic`, all prior appearance keys still present. Correct.
- **No silent re-skin of existing customers**: resolver uses an explicit `template` key only; legacy `theme:'warm'` is intentionally *not* mapped (`templates.ts:22–30`). New profiles have no `template` key → Classic.
- **Project detail pages do not follow the template**: `ProjectPageView` renders Classic appearance/palette and Classic classes regardless of `appearance.template` (F-16). A customer who switches back to Classic still has consistent detail pages; an Editorial portfolio looks discontinuous.
- **Lapsed Pro with Editorial stored**: public pages keep rendering Editorial (presentation-only), project pages 404 (Pro-only), and Builder saves fail entirely (F-07). There is no automatic downgrade of the stored template and no proactive prompt; the Templates modal’s Classic Apply is the only escape.
- **Free plan section stripping**: public and builder preview strip locked sections with the same helper (`free-sections.ts`). Editorial reads the stripped profile, so it does not leak locked content. Verified correct.

## 5. Preview vs public rendering

| Aspect | Builder inline preview | Public route | Consistency |
| --- | --- | --- | --- |
| Data source | `profile` state (all pages/pages rows) | Prisma public subset (published home page + published project pages) | Preview can show unpublished pages/cards; public filters them. Minor and expected. |
| Free stripping | `stripLockedSectionsForFree` for Free | same helper | ✅ |
| Template choice | `templateOverride ?? saved` | saved template resolver | ✅ |
| Language/dir | `getPortfolioLang` | same | ✅ |
| Classic responsive | container queries (`cq-*`) | `.no-cq` viewport fallback | ✅ |
| **Editorial responsive** | **viewport media queries inside container frame** | viewport media queries | ❌ **F-04** |
| Editorial scrolled/header state | window scroll listener, preview scrolls inner div | correct | ❌ F-04b (low) |
| Draft/published | preview shows draft | public 404 unless PUBLISHED | expected, but View Live labels do not warn (F-12) |
| Admin preview | same resolver + device frames | public | F-04 applies to admin device previews |

## 6. Subscription transitions

| Transition | Behavior | Evidence | Assessment |
| --- | --- | --- | --- |
| NONE → ACTIVE | Entitlements resolved per save; builder UI is stale until reload (`initialSubscriptionState` snapshot) | `builder/page.tsx:20–40`; `getEntitlements` | Server correct; UI may still show locks until refresh (Medium/Low UX) |
| ACTIVE → EXPIRED/GRACE end | Public home still renders (home route does not gate on subscription); locked sections stripped; project pages 404; builder is Free | `u/[username]/page.tsx:41–47`; `visibility.ts`; `free-sections.ts` | Intentional? Visibility helper says subscription required, home route ignores it — **inconsistent** (F-35) |
| ACTIVE → SUSPENDED (admin `canceledAt`) | Treated Free immediately, regardless of `expiresAt` | `subscriptions.ts:47–56`; admin suspend route | Admin semantics; note that suspension is not "cancel at period end" |
| Subscription lookup failure (builder page) | `getSubscriptionState(...).catch(() => null)` → UI Free, saves fail server-side | `builder/page.tsx:22–24`; `getEntitlements` throws | Fail-closed but confusing; no retry/notice |
| Subscription lookup failure (public) | Route throws → 500 | `getPublicProfile` no catch | Availability risk, low frequency |
| Pro → Free with Editorial | Saves blocked until Classic applied (F-07) | `actions/portfolio.ts:455–468` | **Critical** |
| Free → Pro | Server permits editorial immediately; UI still locked until reload | `canUseTemplate` | Low UX |

## 7. Content/persistence integrity checks

- **Appearance JSON**: whole-object overwrite, no patch semantics. Builder always sends the full object. A client that omits a key removes it on save (e.g. an older client can silently drop `template`). Not a bug for current clients, but a compatibility note.
- **Appearance validation fallback**: if `appearanceSchema.safeParse` fails, the raw object is kept (`portfolio-schema.ts:681–693`); unknown keys pass via `.catchall`. No rejection/loss.
- **Section strictness**: envelope `.strict()` allows only known DB fields; content schemas are strict except experience items (passthrough) and project payloads (loose). Legacy unknown keys in strict content types would make the save fail. Not reproducible from code alone; needs a staging data sample (see manual checklist).
- **Sections are updated by id, never reconciled by omission**; deleting a section requires `deleteSection`. Correct UI uses it.
- **Project deletion by omission**: `updatePortfolio` deletes any project row absent from the payload (except Free standalone pages). A stale/partial client that omits a page would delete it. Current builder sends every row; optimistic concurrency reduces risk. Label: design risk (Low).
- **Card items migration**: items attached to a card that links to a page are moved server-side to the linked page if their URL is not http(s) (`actions/portfolio.ts:769–788`). HTTP(s) extras stay on the card. This preserves both behaviours; verified by code.
- **`itemCards` metadata** is positional; removing an item splices metadata in the page editor. Uploading/reordering items can therefore mismatch metadata if another path reorders items without splicing meta. Only the page editor and ProjectManager item mode modify items; card mode uses page rows. No confirmed mismatch found, but positional coupling is fragile (Low risk).
- **Localized values** are merged per field; `{ar,en}` and flat strings are both accepted. `pickLang` falls back to the other language. Correct.
- **Free section count vs publish limits**: save caps 30/50; publish limits from plan; free countable pages exclude standalone pages. Correct.

## 8. Analytics flow

- `page_view` fired from the public route beacon (`u/[username]/page.tsx:126`), `project_view` from the detail route (`projects/[slug]/page.tsx:125`).
- `whatsapp_click` is fired **only** by Classic’s floating button (`ClassicTemplate.tsx:2197`). Editorial has no floating CTA and never fires the event (F-08). The analytics dashboard still shows the metric (`actions/portfolio.ts:1450–1460`), so an Editorial customer will see permanent zeros for WhatsApp clicks; their contact-section links also do not track.
- Template selection itself is not tracked; no analytics for template usage.

## 9. Cross-system issues summary

| ID | Severity | Area | Summary |
| --- | --- | --- | --- |
| F-07 | Critical | Subscription/template | Lapsed Editorial user cannot save anything |
| F-11 | High | Project↔page | Slug rename breaks linked cards |
| F-12 | High | Builder navigation | No View Page action; View Live 404 paths |
| F-16 | High | Template↔detail | Project detail stays Classic-styled |
| F-28 | Medium | Project↔page | Card deletion leaves dangling links |
| F-35 | Medium | Visibility | Home route ignores subscription gate that visibility helper claims |
| F-08 | High | Analytics/actions | WhatsApp clicks and floating actions lost in Editorial |
| — | Low | Media | R2 objects not deleted on page/item deletion |
| — | Low | Project payload | Legacy unpublished pages can 404 from cards |
| — | Low | Appearance | Whole-object overwrite can drop unknown keys from old clients |
