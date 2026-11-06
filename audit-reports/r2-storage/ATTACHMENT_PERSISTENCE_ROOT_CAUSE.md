# Attachment Persistence Root Cause

## Confirmed root cause
Attachment metadata (`attachmentName`, etc.) was stored only in transient item fields and the Explore link was gated on `item.attachmentName`, which is not persisted in the `ProjectItem` row. The server save path persists `externalUrl` but not attachment metadata. After reload, metadata was lost, so the filename and Explore link disappeared.

## Exact files/functions involved
- `src/app/profile/builder/BuilderClient.tsx`: `uploadProjectItemFile` (updated item state), item editor render (gated Explore on `item.attachmentName`).
- `src/lib/actions/portfolio.ts`: `updatePortfolio` (persists `externalUrl`, not attachment metadata; `content` spread preserves `itemCards`).
- `src/lib/project-card-visuals.ts`: `ProjectItemCardMeta`, `sanitizeMeta`, `readProjectItemCardMeta`, `withProjectItemCardMeta`.
- `src/app/u/[username]/projects/[slug]/ProjectPageView.tsx`: `itemHref` uses `externalUrl`.

## Where attachment metadata was lost
- On save: `itemRows.push` omitted `attachment*` fields (no DB columns), and they were only in in-memory item state.
- On reload: `getOrCreateProfile` returned items without `attachment*`, so UI lost filename/Explore gating.
- `itemCards` content JSON was the correct persistent store but was not used for attachment metadata initially.

## Resolution approach
Persist attachment metadata in the page content JSON (`itemCards[index]`) via `updateItemCard`, which is saved as part of `proj.content`. Derive display/Explore from `itemMeta.attachmentName` and persisted `externalUrl`.