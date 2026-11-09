# Phase 8 — Blockers

1. **F-40 requires measurement.** No bundle/network profiling was performed, so no optimization is claimed.
2. **F-41 R2 retention is a destructive policy decision.** No R2 objects were inspected or deleted; a reference-safe GC/retention design requires approval and backups.
3. **F-42 CLS unmeasured.** No browser/CWV tooling was used.
4. **F-43 admin preview** code revalidation was added, but runtime verification is unavailable.
5. **F-44 dead fields** were documented, not removed, to avoid breaking legacy JSON.
6. **No deployment, Git, database, migration, dependency, or browser automation was used.**
