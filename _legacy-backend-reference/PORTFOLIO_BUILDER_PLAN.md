# Portfolio Builder Implementation Plan

## 1. Current Stack Summary
- **Framework:** Next.js 15 (App Router) with React 19
- **Data Layer:** PostgreSQL accessed via Prisma (`@prisma/client` v5.22)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) with CSS variables for dynamic theming
- **State Management:** React Hooks (`useState`, `useCallback`) for the builder UI; Server Actions for data fetching and mutations
- **Icons & UI:** `lucide-react` for icons; custom UI components in `src/components/ui/` (e.g., `Button`, `Input`, `Card`)

## 2. Component Map
- **Navigation Update:**
  - `src/app/workspace/WorkspaceManager.tsx`: Update the "Profile" button inside the account dropdown (line ~601) to act as a `<Link href="/profile/builder">` or add a dedicated "Portfolio" button next to the theme toggle.
- **Builder Pages & Layouts:**
  - `src/app/profile/builder/page.tsx`: Server Component. Fetches the `UserProfile`, `ProfilePage` (slug: 'home'), and related `PageSection` records, then passes them to the client.
  - `src/app/profile/builder/BuilderClient.tsx`: Main Client Component. Manages the split-pane layout (Sidebar + Live Preview) and top-level builder state.
- **Sidebar Controls (Left Pane):**
  - `src/app/profile/builder/SidebarTabs.tsx`: Navigation between Theme, Sections, and Projects.
  - `src/app/profile/builder/ThemeSettings.tsx`: Controls for fonts and colors. Updates `UserProfile.appearance` JSON.
  - `src/app/profile/builder/SectionManager.tsx`: Drag-and-drop list to reorder and toggle visibility of `PageSection` models (Hero, About, Skills, Projects, Contact).
  - `src/app/profile/builder/ProjectManager.tsx`: Manages items inside the `UserProfile.projects` JSON field.
  - `src/app/profile/builder/WorkspacePickerModal.tsx`: A modal to select existing workspace items (Strategies, Plans, Posts, Media) to link to a project without re-uploading.
- **Live Preview (Right Pane):**
  - `src/app/profile/builder/LivePreview.tsx`: Wraps the template in an iframe or scaled container to isolate styles.
  - `src/components/portfolio/templates/ClassicTemplate.tsx`: The single pre-built template. Dynamically reads the builder state to apply CSS variables (colors/fonts) and render the active sections.

## 3. Data Flow & Schema Utilization
1. **Initialization:** When a user navigates to `/profile/builder`, a Server Action `getOrCreateProfile()` ensures a `UserProfile` exists, alongside a default `ProfilePage` and 5 default `PageSection` records.
2. **State Management:** The builder uses a React state object mirroring the database schema.
3. **Theming:** The `appearance` JSON field on `UserProfile` stores `{ themeColor: '#...', font: 'inter' }`. The preview pane injects these as inline CSS variables (e.g., `--color-primary`).
4. **Project Linking:** Instead of file uploads, `ProjectItem` objects inside the `UserProfile.projects` JSON array will store a `relatedContent` array of IDs (e.g., `["strategy:123", "content:456"]`).
5. **Saving:** An auto-save hook (similar to `useAutosave` in `StrategyStudio`) debounces state changes and calls a Server Action `updatePortfolio()` to persist `UserProfile` and `PageSection` updates.

## 4. Step-by-Step Implementation Order
1. **Routing & Scaffolding:**
   - Add the `<Link>` to `WorkspaceManager.tsx` to route to `/profile/builder`.
   - Create `/profile/builder/page.tsx` and the basic split-pane `BuilderClient.tsx` layout.
2. **Data Fetching & Initialization:**
   - Write Server Actions to fetch/create the `UserProfile` and `PageSection` records.
   - Pass this initial data into the `BuilderClient` state.
3. **Live Preview & Template Foundation:**
   - Create `ClassicTemplate.tsx` with dummy data.
   - Mount it in the right pane. Map the `appearance` state to CSS variables on the template wrapper.
4. **Theme & Section Controls:**
   - Build `ThemeSettings.tsx` (color picker, font dropdown) and wire it to update the preview instantly.
   - Build `SectionManager.tsx` to allow toggling visibility and changing the `sectionOrder`. Update the template to respect this order.
5. **Projects Integration (The Differentiator):**
   - Build `ProjectManager.tsx` to add/edit projects.
   - Implement `WorkspacePickerModal.tsx`: Use existing Prisma queries to list user's workspaces, then fetch `Strategy`, `Content`, and `Media` items.
   - Allow adding external links/text to a project.
6. **Template Refinement:**
   - Update `ClassicTemplate.tsx` to resolve the linked workspace item IDs, rendering beautiful cards for Strategies, Posts, and Files.
7. **Publishing:**
   - Create the public route `/u/[username]/page.tsx` to serve the live portfolio using the exact same `ClassicTemplate.tsx` component.

## 5. Open Questions Blocking Implementation
1. **Workspace Access Scope:** Since a user can be a member of multiple workspaces (owned vs. invited), should the `WorkspacePickerModal` allow them to pull items from *all* workspaces they have access to, or strictly workspaces they own?
2. **Project Data Structure:** Should we store the linked workspace item IDs in the existing `UserProfile.projects` JSON array, or should we utilize the `ProjectPage` database model to allow for more scalable relational querying and individual project detail pages in the future?
3. **Public URL Strategy:** Will the published portfolio live under `/u/[username]` (a path routing approach) or a subdomain approach (e.g., `username.portfoliohub.com`)? This affects how the public preview and routing should be configured.
