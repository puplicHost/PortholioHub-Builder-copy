# Sprint F — deferred (NOT started, NOT scoped away)

Decision (user, 2026-10-15): skip Sprint F entirely for now. Order is E → G → H.

## What Sprint F covers (from gap-closure-plan.md §1, Sprint F)

1. Section types `gallery` / `files` / `contact`-split / `custom` (editor panels + `ClassicTemplate` `renderSection` cases) — Phase 5 §16.
2. Autosave + save queue + backoff + beforeunload + `expectedVersion` conflict modal (wiring the dead `useAutosave` hook) — Phase 5 §37, criteria 1–3.
3. Zod `.strict()` portfolio doc (`schemaVersion:1`, per-type schemas, length/count caps, link allowlist) enforced on save/publish — Phase 5 §14–19, criterion 8.
4. Additive-only presets (current free font/color dropdown stays pixel-identical).
5. Media-reference sync (`syncMediaReferences`) is implicitly included (Phase 5 criterion 13) since it rides the same save path.

## Conformance math (corrected)

The 60% figure reported after Sprint C was wrong — it omitted Sprint D's +10 (wrong order of addition). Audited recount, same formula ((DONE + PARTIAL×0.5)/118):

| Point | DONE | PARTIAL | MISSING | % |
|---|---|---|---|---|
| Baseline (gap report) | 19 | 28 | 71 | 28% |
| After A | 32 | 27 | 59 | 39% |
| After B | 46 | 27 | 45 | 50% |
| After D (actual order) | 56 | 27 | 35 | 59% |
| **Now (A+B+D+C)** | **68** | **27** | **23** | **69%** |

(+1 DONE vs naive sum comes from A14 `?redirect`, the single PARTIAL→DONE conversion.)

Forward without F: E (+4) → 72% · G (+2) → 74% · H (+8) → **~81% ceiling** (DONE 82, PARTIAL 27, MISSING 9). With F later (+6): **~86%** (DONE 88). The 9 permanently-missing without F: 4 section/caps items + autosave/conflict + Zod validation, plus template-2, CV, CMS (out of A–H scope regardless).

## Why the ceiling stops at ~81%

Everything in §§1–4 is implementable without touching the visual freeze or stack. The gap to 100% is: Sprint F (above), Phase 10 second template + badge, Phase 12 CV, Phase 13 CMS, FCM live push, full E2E matrix, KVM1/Docker host specifics — all previously recorded as out-of-scope or intentionally-not-aligned in gap-closure-plan.md §3.
