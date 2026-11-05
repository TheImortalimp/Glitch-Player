# Roadmap & TODO Index — canonical order

This index labels and orders every planning document. **Use the R4.3 execution sequence below as the active queue.** The R4.1 and R4.2 documents are historical/source references; they do not override the current master TODO. Do not create parallel, unlabeled TODO lists.

## Active R4.3 execution order

| Order / label | Roadmap | TODO | Scope and gate |
| --- | --- | --- | --- |
| **R4.3-00 / TODO-00** | [`r4.3/ROADMAP-00-EAR-PLAYBACK.md`](r4.3/ROADMAP-00-EAR-PLAYBACK.md) | [`r4.3/TODO-00-MASTER.md`](r4.3/TODO-00-MASTER.md) — section 00 | Reproduce and resolve EAR monitor / YouTube stutter; pass Windows/WebView2 performance gate before timing/confluence work. |
| **R4.3-01 / TODO-01** | [`r4.3/ROADMAP-01-LINK-LIST-TRANSITIONS.md`](r4.3/ROADMAP-01-LINK-LIST-TRANSITIONS.md) | [`r4.3/TODO-01-LINK-LIST-TRANSITIONS.md`](r4.3/TODO-01-LINK-LIST-TRANSITIONS.md) | Catalogue, order and label the 12 visible + 1 hidden link-tree entries; unify per-track pace/breath/cut profiles. |
| **R4.3-02 / TODO-02** | [`r4.3/FULL-CONFLUENCE-ROADMAP.md`](r4.3/FULL-CONFLUENCE-ROADMAP.md) | [`r4.3/TODO.md`](r4.3/TODO.md) | Unify signals, all voices/effects, all automations, arbitration, safety, timing and render-cost contracts. Depends on 00; link-list contracts from 01 are an input. |
| **R4.3-03 / TODO-03** | [`r4.2-roadmaps/REBUILDING.md`](r4.2-roadmaps/REBUILDING.md) — use its reproducibility/release phases as the reference | [`r4.3/TODO-00-MASTER.md`](r4.3/TODO-00-MASTER.md) — section 03 | Build, test, reproducibility and release hygiene for approved R4.3 work. Update this legacy reference when release tasks are approved; do not fork a second queue. |

**Master execution checklist:** [`r4.3/TODO-00-MASTER.md`](r4.3/TODO-00-MASTER.md). It owns cross-roadmap ordering and status. Detailed checkboxes live only in the linked TODOs; the master contains gates and hand-offs.

On 2026-11-05 the maintainer approved R4.3-00 Phase 0 only, with a 12 Hz monitor presentation cap,
on the local `fix/ear-youtube-playback` branch. The monitor fix, 286-test native build,
and limited native A/B checks are complete; the maintainer reported the 1080p fullscreen
candidate "Sharp and smooth". The broader playback/sharpness matrix remains open.
See [build evidence](../BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05).
The maintainer separately approved publication to `TheImortalimp/Glitch-Player` as
[prerelease v4.2.4-ear-monitor.1](r4.3/RELEASE-NOTES-4.2.4-EAR-MONITOR-1.md),
retaining installer version 4.2.4. This does not unlock R4.3-01/02 or the stable-release gate.

## Historical / design-reference roadmaps, in reference order

These are not active implementation authorization. Their delivered status must be checked against current code before carrying a task forward.

| Reference label | Document | Relation to active R4.3 work |
| --- | --- | --- |
| **HIST-4.1-00** | [`r4.1/ROADMAP.md`](r4.1/ROADMAP.md) | Prior R4.1 plan; historical context only. |
| **HIST-4.2-00** | [`r4.2-roadmaps/TOTAL-CONFLUENCE.md`](r4.2-roadmaps/TOTAL-CONFLUENCE.md) | Parent definition-layer vision; R4.3-02 supersedes its execution order and adds EAR/source/performance/link-list contracts. |
| **HIST-4.2-01** | [`r4.2-roadmaps/TRANSITION-TIMING.md`](r4.2-roadmaps/TRANSITION-TIMING.md) | Transition design reference; R4.3-01 makes the named link list and its profiles explicit, R4.3-02 unifies automation timing. |
| **HIST-4.2-02** | [`r4.2-roadmaps/PRESET-RANDOMIZATION-AND-LEARNING.md`](r4.2-roadmaps/PRESET-RANDOMIZATION-AND-LEARNING.md) | Preset/seeded-randomization design reference, incorporated into R4.3-02 inventory and arbitration. |
| **HIST-4.2-03** | [`r4.2-roadmaps/AESTHETICS.md`](r4.2-roadmaps/AESTHETICS.md) | Visual-language reference; maintain as design input, not a competing task queue. |
| **HIST-4.2-04** | [`r4.2-roadmaps/REBUILDING.md`](r4.2-roadmaps/REBUILDING.md) | Build/reproducibility reference for R4.3-03. |

## Existing TODO lists and status

| Label | TODO file | Status / handling |
| --- | --- | --- |
| **HIST-TODO-4.1** | [`r4.1/TODO.md`](r4.1/TODO.md) | Historical checklist; do not treat as current work queue. Carry forward only after checking current code and updating the R4.3 master. |
| **TODO-00** | [`r4.3/TODO-00-MASTER.md`](r4.3/TODO-00-MASTER.md) | Canonical ordered R4.3 queue and gate tracker. |
| **TODO-01** | [`r4.3/TODO-01-LINK-LIST-TRANSITIONS.md`](r4.3/TODO-01-LINK-LIST-TRANSITIONS.md) | Detailed track catalogue/profile work. |
| **TODO-02** | [`r4.3/TODO.md`](r4.3/TODO.md) | Detailed full-confluence implementation checklist. Title within file identifies it as TODO-02. |

## Naming and status rules

- Active roadmap titles use `Roadmap R4.3-00`, `Roadmap R4.3-01`, etc.; active TODO titles use `TODO-00`, `TODO-01`, etc.
- Update this index and the master TODO when a document is added, reordered, approved, blocked or completed.
- A task is not “done” because code exists or a unit test passes. Performance gates require Windows/WebView2 playback evidence; build gates require the specified native build/test evidence.
- Keep old roadmap files as reference rather than renaming/deleting stable links. Record supersession here.
- Each detailed task has one canonical checkbox; do not duplicate checklists in status notes.
