# Portfolio Editor — Implementation Plan

## Objective

Add a **"بروفايلي"** link to the existing sidebar navigation and create the portfolio editor page at `/workspace/[workspaceId]/profile`, accessible from the sidebar under the **الإعدادات** section.

---

## Context

| Property | Value |
|---|---|
| Stack | Next.js 16 App Router, Prisma + PostgreSQL, custom JWT auth |
| UI Direction | RTL Arabic |
| URL Pattern | `localhost:3000/workspace/[workspaceId]/dashboard` |
| Sidebar Theme | Dark, client component |
| Sidebar Sections | WORK · الاستراتيجية · القوائم · الفريق · الإعدادات |
| الإعدادات (current) | Workspace Settings · الفواتير |
| Public Profile URL | `/u/[username]` |
| DB Models (existing/planned) | `UserProfile` · `PortfolioItem` · `Testimonial` · `Service` |
| Subscription field | `user.subscription.plan` — **verify the exact field name in `prisma/schema.prisma` before implementing any plan gate** |

---

## ⚠️ Before You Begin

> [!IMPORTANT]
> **Read `prisma/schema.prisma` first.** Find the exact field that stores the user's subscription plan, confirm its name and enum values, then report it before starting Step 1. Do not assume `user.subscription?.plan === 'PRO'` is correct until verified.

```
First, read prisma/schema.prisma and tell me the exact field
that stores the user's subscription plan, then begin Step 1.
```

---

## Target State

1. Sidebar has a new item **"بروفايلي"** (with `<SquareUser />` icon) as the **first** item in الإعدادات — above Workspace Settings.
2. Clicking it navigates to `/workspace/[workspaceId]/profile`.
3. That page is a full portfolio editor with 4 tabs and a live preview panel.
4. Pro-only fields show a lock icon + upgrade prompt — visible but disabled for Free users.
5. A **"Share Profile"** button copies `/u/[username]` to clipboard and shows a toast.

---

## Sidebar Change

> **Surgical — ONE item added, nothing else touched.**

Find the existing sidebar component (likely `src/components/layout/sidebar/`).  
In the **الإعدادات** section, insert as the **first** item:

```tsx
{
  label: 'بروفايلي',
  href: `/workspace/${workspaceId}/profile`,
  icon: <SquareUser size={18} />,  // from lucide-react (already installed)
}
```

**Do NOT** restructure, restyle, or rename any existing sidebar items.

---

## Profile Editor Page

**Path:** `src/app/workspace/[workspaceId]/profile/page.tsx`  
**Layout:** Two-column on desktop (editor left · live preview right), single column on mobile.

### Auto-create on first load

If no `UserProfile` exists for this user, the page POSTs `/api/profile` with defaults before rendering.

**Username default generation:**
```ts
// slugify(user.name ?? email.split('@')[0]) + random 4-digit suffix if slug is already taken
// e.g. "ahmed-sayed" → "ahmed-sayed-4291" if taken
// Validation: lowercase · alphanumeric + hyphens only · 3–30 chars
```

Generate server-side during auto-create; never let the AI invent a username without this rule.

---

### Tab 1 — المعلومات الأساسية *(Free)*

| Field | Notes |
|---|---|
| `displayName` | Text input |
| `username` | Text input — shows `portfoliohub.com/u/[username]` below it |
| `bio` | Textarea · max 500 chars · character counter displayed |
| `avatarUrl` | Image upload via existing Cloudinary upload helper |
| `skills` | Tag input — press Enter to add, click tag to remove |
| `contactLinks` | Repeater: label + URL pairs · Free: max 3 · Pro: unlimited |

---

### Tab 2 — نماذج الأعمال *(Free with limits)*

> [!IMPORTANT]
> Content items are linked via the `PortfolioItem` join table — **not** an `inPortfolio` boolean field on `ContentItem`.

```ts
// ❌ Wrong
where: { inPortfolio: true }

// ✅ Correct
where: { portfolioItems: { some: { profileId: profile.id } } }
```

- Grid of workspace content items that have a matching `PortfolioItem` row for this profile.
- **"إضافة من المحتوى"** button opens a modal listing all workspace content with a toggle per item.
- **Free limit:** max 6 items — show `6/6 مضاف` badge, disable toggle, show inline upgrade message.
- **Pro:** unlimited · reorder via **up/down arrow buttons only** (no drag-and-drop — avoids RTL drag API issues).
- **Empty state:** if the workspace has zero content items, show:
  > لا يوجد محتوى بعد — أضف محتواك أولاً
  
  with a button **"إضافة محتوى"** that navigates to `/workspace/[workspaceId]/content`.

---

### Tab 3 — المظهر *(Pro only)*

**Free users:** Tab is visible but overlaid with a lock card:

> 🔒 تخصيص المظهر متاح في Pro — شوف كيف يبدو بروفايلك بألوانك وثيمك الخاص

With an **"ترقية للـ Pro"** button.

**Pro users see:**

| Control | Options |
|---|---|
| Theme selector | 6 cards: minimal · dark · warm · bold · soft · glass |
| Accent color | `type="color"` picker + hex text field |
| Font pair | 4 radio options rendered in their actual font: inter · playfair · mono · satoshi |
| Layout | 3 cards with small visual diagram |
| Hide badge | Toggle |

Selecting any option applies a CSS preview instantly (no save required).

---

### Tab 4 — التوصيات والخدمات *(Pro only)*

Same lock treatment as Tab 3 for Free users.

**Pro users:**
- **التوصيات (Testimonials):** Add / edit / delete cards (author · role · body).
- **الخدمات (Services):** Add / edit / delete cards (title · description · price).

---

### Live Preview Panel *(desktop right column)*

> [!WARNING]
> Do **not** use an `<iframe>` — it makes a real network request to `/u/[username]`, meaning only saved data appears. This breaks the "live" contract.

- Render a `<ProfilePreview />` component that accepts the current **unsaved** form state as props and mirrors the public page layout — zero network requests.
- Debounced updates on every field change (500 ms).
- **"Preview"** label + **"فتح في تاب جديد"** button opening the actual public URL `/u/[username]` (for the saved, published version).

---

### Save Behavior

- Single **"حفظ التغييرات"** button in a sticky bottom bar.
- On save: `PATCH /api/profile` with all fields.
- Pro-only fields from Free users are silently ignored server-side.
- **Success toast:** `✅ تم حفظ البروفايل`
- **Error toast** on failure.
- **Share Profile** button (next to Save): copies `[origin]/u/[username]` → toast `✅ تم نسخ الرابط`.

---

## File Scope

### Files to create (new)

```
src/app/workspace/[workspaceId]/profile/
  └── page.tsx
src/components/profile/
  ├── ProfileEditor.tsx          # Main editor shell (tabs + sticky save bar)
  ├── tabs/
  │   ├── BasicInfoTab.tsx
  │   ├── PortfolioItemsTab.tsx
  │   ├── AppearanceTab.tsx
  │   └── TestimonialsServicesTab.tsx
  ├── ContentPickerModal.tsx
  ├── ProfilePreview.tsx         # Pure component — renders public profile layout from props (no network)
  └── LivePreviewPanel.tsx      # Wrapper: holds debounce logic, "فتح في تاب جديد" button
```

### Files to modify (minimal)

```
src/components/layout/sidebar/   # Add ONE nav item in الإعدادات section
```

### Files NOT to touch

- Any existing page or route
- Any existing API route
- `.env`
- `schema.prisma`
- Auth logic
- Any other sidebar item

---

## Plan Gating Logic

```ts
// Server-side (page loader)
const isPro = user.subscription?.plan === 'PRO'  // adapt to actual field

// Client-side (UI gating)
// Pass isPro prop down; lock UI elements when !isPro
```

Check plan **both** server-side (page loader) and client-side (UI gating).

---

## Constraints

- **No new npm packages** without asking — use `lucide-react` (installed) for icons.
- Use the **existing Cloudinary upload helper** for avatar.
- **RTL layout throughout** — `dir="rtl"` + Tailwind RTL utilities.
- **Dark theme** consistent with existing UI (match dark sidebar and card styles).

---

## Acceptance Criteria

- [ ] **"بروفايلي"** appears in the sidebar under الإعدادات and navigates to `/workspace/[workspaceId]/profile`.
- [ ] All 4 tabs render with correct Free / Pro gating.
- [ ] Saving **المعلومات الأساسية** updates the DB and shows success toast.
- [ ] **"إضافة من المحتوى"** modal lists workspace content items; toggling adds / removes from portfolio.
- [ ] Free user adding a 7th item sees the upgrade message and cannot add more.
- [ ] **"Share Profile"** button copies the correct public URL to clipboard.
- [ ] No existing sidebar items are moved, renamed, or restyled.

---

## Action Boundaries

| Proceed with | Stop and ask before |
|---|---|
| Creating new files listed above | Modifying any existing page or route |
| Adding the single sidebar link | Changing sidebar structure beyond the one new item |
| Reading existing components for style reference | Adding any npm package |
| | Touching auth or DB schema files |

---

## Progress Log

> After each implementation step, record: `✅ [step] — [file path] — [what was verified]`

| # | Step | File | Status |
|---|---|---|---|
| 1 | Add sidebar nav item | `src/components/layout/sidebar/` | ⬜ |
| 2 | Create profile page shell | `src/app/workspace/[workspaceId]/profile/page.tsx` | ⬜ |
| 3 | Build `ProfileEditor` with tab shell | `src/components/profile/ProfileEditor.tsx` | ⬜ |
| 4 | Build `BasicInfoTab` | `src/components/profile/tabs/BasicInfoTab.tsx` | ⬜ |
| 5 | Build `PortfolioItemsTab` + `ContentPickerModal` | `src/components/profile/tabs/PortfolioItemsTab.tsx` | ⬜ |
| 6 | Build `AppearanceTab` (Pro gate) | `src/components/profile/tabs/AppearanceTab.tsx` | ⬜ |
| 7 | Build `TestimonialsServicesTab` (Pro gate) | `src/components/profile/tabs/TestimonialsServicesTab.tsx` | ⬜ |
| 8 | Build `ProfilePreview` + `LivePreviewPanel` | `src/components/profile/ProfilePreview.tsx` · `LivePreviewPanel.tsx` | ⬜ |
| 9 | Wire PATCH `/api/profile` + toasts | `src/components/profile/ProfileEditor.tsx` | ⬜ |
| 10 | QA: RTL, dark theme, Free/Pro gating, Share button | — | ⬜ |
