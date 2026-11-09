# Builder Functional Audit

Source of truth: `src/app/profile/builder/BuilderClient.tsx` (≈5,200 lines), `ProjectManager.tsx`, section editors, `src/lib/actions/portfolio.ts`, `src/lib/portfolio-schema.ts`.
Line numbers refer to the audited working tree (commit `7c1d08f` + uncommitted template work). Nothing was executed against a database.

## 1. Feature inventory (verified from actual controls)

### 1.1 Global chrome
| Feature | Control | Persistence | Status |
| --- | --- | --- | --- |
| Save | Top-bar button, mobile bottom bar | `updatePortfolio` (optimistic version) | Works, but see F-09 |
| Publish / Unpublish | Top-bar button, mobile bar | `publishProfile` / `unpublishProfile` | Works |
| View Live | Top-bar link | `/u/{username}` | Works only when published; see F-12 |
| Templates | Top-bar button → modal | `appearance.template` via save | Works; UX issues F-27 |
| Undo / Redo | Top-bar icon buttons | none | **Dead controls — F-10** |
| Device preview | Desktop/mobile toggle | local only | Editorial preview wrong — F-04 |
| Builder dark mode | Profile menu | localStorage | Works (builder chrome only) |
| Draft autosave/restore | Background effect | localStorage | Works |
| Version conflict modal | automatic | guarded `updateMany` | Works |
| Settings (appearance) | Right panel | `appearance` JSON | Works for Classic; inert for Editorial — F-01/F-02 |
| Unsaved-changes guard | `beforeunload` | n/a | Works when `isDirty` |

### 1.2 Sections and editors
| Section | Create | Edit | Delete | Reorder | Key controls | Persistence |
| --- | --- | --- | --- | --- | --- | --- |
| Hero | Seeded only | Yes | No | Drag | avatar URL/upload, avatar focal point, background image/position/overlay, display name EN/AR, job title EN/AR | section `content` + profile `avatarUrl`/`localized`/`appearance.avatarPosition` |
| About | Seeded only | Yes | No | Drag | icon, title, biography, stat cards (icon/value/label, add/remove) | section content |
| Experience | Seeded/migrated | Yes | No | Drag within section (`arrayMove`) | per-item fields, current switch, dates, display mode timeline/grid/list, section icon | section content |
| Education | Seeded/migrated | Yes | No | Per-item controls | title/institution/date/description/image/image position | section content |
| Skills | Seeded only | Yes | No | Groups via editor; no group reorder | group name/icon, skills + percentage, display mode chips/bars/both, heading | section content |
| Services | Seeded only | Yes | No | Add/remove only | icon/title/description/features per service, section icon/title/description | section content |
| Projects | Seeded only | Yes | Yes (cards via ProjectManager) | Drag cards (grouped/ungrouped) + move buttons | visual image/file-icon/video/none, cover upload, image fit/aspect, video upload/aspect, tags, groups, external/page links, extra links | `projectPages` + `content.itemCards` |
| Clients | Auto-inserted hidden | Yes | No | Move up/down | logo upload/URL, shape/size/grayscale/underline | section content |
| Testimonials | Seeded/migrated | Yes | Add/remove + move | Yes | name/title/photo/text; **no rating input** | section content |
| Gallery | **No UI to add** | If exists | Yes (if exists) | Add/remove | image upload/URL/caption | section content |
| Files | **No UI to add** | If exists | Yes (if exists) | Add/remove | label/URL/upload | section content |
| Contact | **No UI to add** | If exists | No | move up/down in editor | link type/value/label | section content |
| Footer | Seeded/migrated | Yes | No | Drag | headline/subheading/social links | footer content + `profile.contactLinks` |
| Custom | Yes via "+ Add Section" | Yes | Yes | Drag | icon/title/description/underline/cards (image/icon/link/position)/paragraphs | section content |
| Standalone page | Yes via Pages tab (Pro) | Yes | Yes (immediate) | Sort order | title/slug/link-to-card/show-as-card/back label/description/items | `ProjectPage` + items |

**Creation gap (confirmed):** Only custom sections can be added. `SectionManager` contains the only `addSection('gallery'|'files'|'contact'|'custom')` implementation and is not imported anywhere. `addCustomSection` is the sole add handler used by the UI (`BuilderClient.tsx:1790–1830`, add button `4920–4936`). New profiles are seeded with hero/about/experience/education/skills/services/projects/testimonials/footer only (`actions/portfolio.ts:309–350`), plus an auto-hidden clients section added client-side (`BuilderClient.tsx:1046–1080`) and server-side (`actions/portfolio.ts:199–250`). Therefore **contact, gallery and files sections are unreachable for new users** (F-06).

### 1.3 Appearance
`ThemeSettings.tsx` exposes: default color mode (4 modes), font family, show-theme-toggle, light colors (bg/card/text/muted/border), dark colors (same set), primary/accent/outline, floating button visibility + WhatsApp number, username. All write `appearance.*` JSON. `footerBg`/`footerText` exist in the schema and are consumed by Classic (`ClassicTemplate.tsx:2532`) but have no Builder control. `theme`, `layout`, `hideBadge`, `publicTheme`, `logoUrl` are dead fields (no control, no renderer use).

---

## 2. Projects and standalone-page lifecycle — the reported "View Page" issue

### 2.1 How the relationship works (traced)

1. A card row's link is stored inside the `ProjectPage.content` JSON as `linkType` + `linkedPageSlug` (`actions/portfolio.ts:687–688`).
2. `getOrCreateProfile` re-hydrates top-level `linkType` / `linkedPageSlug` from `content` on every load (`actions/portfolio.ts:271–288`).
3. The Builder's page editor links a card to a page by card id (`linkCardToPage`, `BuilderClient.tsx:2229–2238`) and unlinks all cards by slug (`unlinkPageFromCards`, `2241–2252`).
4. The card editor in `ProjectManager` stores the target page's **slug** (`ProjectManager.tsx:1062–1105`).
5. Public cards resolve the link through `content.linkType`/`content.linkedPageSlug` in both templates (`ClassicTemplate.tsx:1394–1431`; `EditorialMarketingTemplate.tsx:295–310`).
6. The public detail route additionally requires: published project, portfolio status PUBLISHED, owner ACTIVE/GRACE, and that some card/item references the slug (`u/[username]/projects/[slug]/page.tsx:36–56`).

### 2.2 Findings

**F-12 (High) — There is no "View Page" action anywhere in the Builder.**
- Pages list rows have only a delete button (`BuilderClient.tsx:4978–5045`); card list rows have only up/down/edit/delete (`ProjectManager.tsx:258–302`).
- The only way to open a standalone page is: select it in Pages → use the top-bar **View Live** link (`BuilderClient.tsx:4535–4551`), or from a card editor use **Edit linked page** (`BuilderClient.tsx:2394–2424`), which opens the editor, not the public page.
- The top-bar link is disabled only for temp/new slugs or when not editing a project (`liveDisabled`, `2028–2032`); it never checks `profile.status`.
- For an **unlinked card**, `liveHref` falls back to the card's own slug (`2021–2026`), but the public route requires the slug to be referenced by a card (`projects/[slug]/page.tsx:47–55`) and the owner to be Pro (`canViewLockedSections`, `39–40`). Result: a 404, with no warning.
- Desktop **View Live** does not check draft status, while mobile **Go Live** does (`1468–1476`). A draft portfolio's desktop View Live therefore opens a 404.

**F-11 (High) — Renaming a linked page's slug breaks every card that points at it.**
- Slug edits update only that row (`updateProjectPageField`, `BuilderClient.tsx:2219–2226`; slug input `2325–2333`).
- No code rewrites cards' `linkedPageSlug`. The only propagation in the codebase handles temp-id → real-slug after creation (`2067–2110`).
- Symptom: card link 404s; the Pages list shows "Not linked" for the renamed page (`5023–5030`).
- Only `deleteProjectPage` clears references (`actions/portfolio.ts:1274–1290`), and only on page deletion.

**F-28 (Medium) — Deleting a card that other cards link to leaves dangling links.**
- Card deletion is local + payload omission (`ProjectManager.tsx:570–588`); server deletion-by-omission (`actions/portfolio.ts:636–644`) does not clear `linkedPageSlug` on surviving cards.
- `deleteProjectPage` does clear links, but cards never go through it.

**F-34 (Low/Medium) — Page publish state is a dead end.** `ProjectPage.isPublished` exists in Prisma and the public route filters on it, but the Builder only displays a "Live" badge (`BuilderClient.tsx:5018–5021`); no control toggles it. A row left unpublished (legacy/admin DB) renders a card whose link 404s.

**F-31 (Low) — Type drift.** `Appearance.template` is still typed as `'classic-dark' | 'minimal-light' | 'arabic-pro'` (`src/lib/portfolio.ts:112`), while `TemplateId` is imported but unused (`portfolio.ts:5`). This is an unused import plus a stale union that contradicts the new `'classic' | 'editorial-marketing'` registry. It happens not to be a compile error because `noUnusedLocals` is off.

---

## 3. Save, version and dirty-state behavior

### 3.1 Happy path (correct)
- Payload includes username/avatar/appearance/localized/contactLinks/all page sections/all project pages plus `expectedVersion` (`BuilderClient.tsx:1296–1310`).
- Server writes sections and projects inside one transaction, then applies a guarded version bump last (`actions/portfolio.ts:520–830`); stale writers bump 0 rows and roll back.
- On success, the client applies server version and temp-id remaps (`1311–1365`).
- Content validation is server-side (`validateSections` / `validateProjects`); appearance/contact/localized use silent sanitization (`portfolio-schema.ts:669–695`).

### 3.2 Findings

**F-09 (High) — Edits made while a save is in flight are discarded.**
`handleSaveChanges` captures `src = stateOverride ?? profile` before `await updatePortfolio(...)`, then on success calls `setProfile(nextProfile)` where `nextProfile` is built from that old snapshot (`BuilderClient.tsx:1256–1365`). Any keystroke during the network round-trip updates state, then is overwritten by `src`-based `nextProfile`. The saved snapshot is also marked clean, so the lost edit leaves no dirty indicator. This is a source-code-proven React state race; reproducing requires a slow network.

**F-07 (Critical) — A downgraded user with Editorial saved cannot save at all.**
`updatePortfolio` rejects **every** save whose `appearance` object contains an Editorial `template` for a Free caller (`actions/portfolio.ts:455–468`). The Builder always sends the whole appearance (`BuilderClient.tsx:1301`), so after a Pro→Free lapse the payload always contains `template:'editorial-marketing'`. Every Save/Publish-save returns `PRO_TEMPLATE_REQUIRED`; only applying Classic in the Templates modal clears it. There is no automatic prompt, and the error is a generic toast (`getFriendlyErrorMessage`).

**F-27 (Medium) — Preview state is invisible outside the modal, and Apply saves pending edits.**
- `previewTemplateId` drives the canvas (`BuilderClient.tsx:4424`, LivePreview prop) but no badge/label appears in the chrome after the modal closes. Closing with X leaves preview active; only "Done" clears it.
- `handleApplyTemplate` builds `updated` from the full current profile and calls `handleSaveChanges` (`1406–1422`), so **all pending content edits are committed** when applying a template. The modal copy says applying saves the template choice only (`dictionaries.ts:464–465`), which is misleading.
- `currentTemplate` passed to the modal is `previewTemplateId ?? saved` (`4424`), so the "Active" badge reflects the preview rather than the saved template while previewing.

**F-10 (High) — Undo/Redo are dead controls.** The buttons render with tooltips but no `onClick` handler; no history stack exists — `updateProfile` is only `setProfile` (`BuilderClient.tsx:4453–4466`, `1534–1536`).

**F-32 (Low) — Seed/UI defaults mismatch.** New profiles seed `theme:'classic-dark'` and `font:'cairo'` (`actions/portfolio.ts:320–329`), while ThemeSettings expects `'Cairo'` and its type union does not include `'classic-dark'`. The font Select can show no selected option on a fresh profile.

**F-48 (Medium) — Destructive migrations on read.** `getOrCreateProfile` deletes duplicate experience/clients sections and inserts new sections every time the Builder loads when conditions match (`actions/portfolio.ts:44–250`). A read action mutating content is a data-integrity risk under concurrent tabs and contradicts the "read" naming. It also contains a hard-coded individual customer email bypass (F-18).

---

## 4. Content editor findings (section-by-section)

- **Experience:** add/edit/remove/current/date validation work; client-side date validation blocks save (`BuilderClient.tsx:3598–3610`); display mode is persisted to `content.displayMode` (builder `3612–3635`) and consumed by Classic (`ClassicTemplate.tsx:948`). Editorial ignores it (F-03).
- **Skills:** groups/skills/percentage editing works; `displayMode chips|bars|both` persisted (`BuilderClient.tsx:3270–3290`); Classic consumes it (`ClassicTemplate.tsx:784–905`). Editorial always renders pills (F-03). The `heading` field is persisted but Editorial reads only `title` (F-21).
- **Services:** services builder shape and legacy items are supported; `features` are limited to 4 in Editorial display and extra features beyond 4 are silently dropped, whereas Classic shows a `+n` indicator (F-26).
- **Education:** image + focal point controls exist; Classic shows a lightbox; Editorial never renders the image (F-23).
- **Testimonials:** new items seed `rating: 5` and `photoUrl: ''` (`TestimonialsEditor.tsx:25–37`); **there is no rating control** despite the schema. Classic's slider **skips every item without a photo** (`TestimonialsSlider.tsx:51–55`) and is only rendered when `items.length > 0` (`ClassicTemplate.tsx:1329–1333`), so photo-less testimonials produce an empty section with no fallback (F-13). Editorial shows the text but renders the hidden 5-star default (F-24).
- **Clients:** logo upload/URL mode, shape/size/grayscale/underline all persist (`ClientsEditor.tsx:173–235`); Classic consumes them (`ClassicTemplate.tsx:1613–1636`); Editorial ignores all four and always applies grayscale (F-22). Classic hides the whole section unless at least one item has `logoUrl` (`ClassicTemplate.tsx:442–446`), so name-only clients never render.
- **Contact:** the editor writes only `type/value/label` (`ContactEditor.tsx:54–60`, `144–172`); no URL field. Classic builds `https://{value}` when the value is not http/mailto/tel (`ClassicTemplate.tsx:1789–1800`), producing broken links for phone/WhatsApp values stored in the schema's expected format (F-14). Classic's icon fallback is unreachable because `getSocialIcon` always returns a Globe (`PortfolioFooter.tsx:44–110`, `ClassicTemplate.tsx:1803`).
- **Footer:** the editor writes the same link list to **both** `profile.contactLinks` and `footer.content.links` (`BuilderClient.tsx:4130–4235`). The displayed source prefers `profile.contactLinks` even when empty ([] is truthy), so legacy footer-only links are not shown in the editor (F-38).
- **Gallery / Files:** editors and schema exist; **no creation entry point** (F-06). Classic renders both with section descriptions; Editorial ignores descriptions (F-21).
- **Custom:** duplicate/delete work; duplicate un-hides the copy and resequences (`BuilderClient.tsx:1841–1865`). Card icon/link icon/image focal point are persisted and rendered by Classic (`ClassicTemplate.tsx:1837–1870`) but ignored by Editorial (F-25).
- **Sidebar drag reorder:** `handleDragEnd` mutates `section.sectionOrder` on state objects before calling `setProfile` (`BuilderClient.tsx:1770–1788`). It works but mutates existing state; no user-facing failure found.
- **Section visibility:** writes both `visible` and `settings.isVisible` through the shared helper (`BuilderClient.tsx:1700–1718`); both templates filter with `isSectionVisible`. Correct.
- **Deletion:** custom sections delete server-first with confirmation (`BuilderClient.tsx:1870–1895`); base sections have no delete affordance. Cards delete locally then persist by omission; pages delete immediately server-side (F-28 inconsistency).
- **Attachments/video:** project-page items upload to R2 and render through `/portfolio/viewer/{id}` on the public project page (`ProjectPageView.tsx:89–104`); R2 video is restricted to same-origin routes in both templates (`ProjectCardMedia`, Editorial `media.kind==='video'`). Card-level uploaded attachments only ever exist in item mode, so no public card-attachment bug was confirmed.

---

## 5. Forms/interaction reliability summary

| Check | Result |
| --- | --- |
| Required field validation | Education title and experience date validated client-side; server schema validates most content; project titles can be empty (`'Untitled'`). |
| Loading states | Upload/save/publish/applying have spinners; page creation has `creatingProjectPage`. |
| Duplicate submissions | Save guarded by `saveStatus === 'saving'`; apply guarded by `applyingTemplate`; publish guarded by publish state. |
| Stale state | **F-09** save race; **F-11** slug drift; ProjectManager `editingItem` becomes stale after saving a new card (its `new-` id is replaced but the local editor keeps the old id — further edits silently stop applying). |
| Dirty tracking | JSON snapshot excludes `version/status`; includes the fields edited. Save success sets clean even if F-09 lost an edit. |
| Lost unsaved changes | Local draft restore exists; `beforeunload` fires when dirty. |
| Destructive confirmation | Section/page/card deletes use `useConfirm`; **card delete only confirms locally, server deletion happens on next save** (F-28). |
| Error surfacing | Server action errors mapped through `getFriendlyErrorMessage`; `PRO_TEMPLATE_REQUIRED` has no tailored mapping, making F-07 harder to resolve. |
| A11y of errors | Form errors are toasts; toast component has roles (out of scope of deep audit). |

### Additional confirmed reliability defect — stale card editor after save

`ProjectManager` keeps `editingItem` with the temporary id (`new-…`). After a successful save, `BuilderClient` remaps `profile.projectPages` ids (`1311–1365`), but the child's `editingItem` is not synchronised. `updateEditingCard` matches `proj.id === editingItem.id` (`ProjectManager.tsx:588–600`), so subsequent edits in the open form target no row. Impact: edits after "Save" appear to do nothing until the user backs out and reopens the card. This is source-code-confirmed.

### Additional UX finding — publish/save ordering
The mobile bottom bar calls `handlePublish` via the same path (`handlePublish` → `handleSaveChanges`), so publish waits for a successful save. No defect found. Desktop View Live/Go Live inconsistency remains F-12.
