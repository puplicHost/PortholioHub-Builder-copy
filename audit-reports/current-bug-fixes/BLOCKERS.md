# Current Bug Fixes — Blockers

1. **Issue A live reproduction:** the exact reported no-button case could not be reproduced against real data (no DB). A shared resolver and regression tests were added; the final click-through requires staging.
2. **Issue C component behavior:** the Apply state bug was source-proven and fixed, but no browser automation/React DOM tests exist. Preview/Apply switching remains a manual check.
3. **Issue E performance:** no baseline or post-change timing could be measured without database/browser access. The source bottlenecks were fixed; index/query-plan work remains a staging/DB decision.
4. **Issue F visual fidelity:** a dedicated Editorial detail component was added, but visual QA and full content/media matrix require staging screenshots or manual review.
5. **Issue D external destination:** the existing Classic footer uses `https://portfolio-hub.online`; it was reused rather than inventing a new URL. Confirm it is the desired destination.
6. **No database changes were needed or made.** No SQL files were created.
7. **Build not run:** safe isolation from database/external services was not established.
8. Two pre-existing `features-v2` test failures and two pre-existing ESLint errors remain; they are outside this task’s scope.
