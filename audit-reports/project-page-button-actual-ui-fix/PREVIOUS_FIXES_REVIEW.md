# Previous Fixes Review

This review maps prior fixes and what they actually proved.

## Previous attempts
| Attempt | Files touched | What was proved | What was NOT proved | Why the user could still see the bug |
| --- | --- | --- | --- | --- |
| Shared destination resolver | `project-card-links.ts`, templates, tests | Destination resolution for some data shapes | The exact UI rendering lifecycle, actual `hasProjectLinks`/CTA path, and data variations (empty link types, page ID/path, unknown aliases) | Resolver still returned null for valid-but-mistyped data |
| Page id/`/projects/slug` normalization | `project-card-links.ts`, `portfolio.ts`, ProjectManager | Canonical slug persistence and target lookup | Actual homepage CTA rendering and live data | Some persisted shapes still weren't accepted |
| `none` semantics | `project-card-links.ts`, tests | Explicit "none" stays disabled | Actual CTA render path | Not used by held-out UI data |
| Focused render/persistence tests | `project-card-cta.test.ts`, tests | Real component render and server persistence | Browser verification, staged data validation | No staging data to validate target/published/plan conditions |

The key pattern: locator/persistence fixes were added before proving the **exact downstream UI condition**; therefore the resolver could still return null in an unmodelled live-data shape.