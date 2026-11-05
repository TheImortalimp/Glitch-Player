# TODO-00 — R4.3 Master Sequence and Gate Tracker

**Canonical ordered queue:** [`../ROADMAP-INDEX.md`](../ROADMAP-INDEX.md).  
**Rule:** detailed task checkboxes live in the linked child TODO only. This file tracks phase gates, decisions and hand-offs. All tasks start open; no implementation work is authorized until roadmap approval.

## Program status

- [x] Confirm new working branch/repository; upstream is archived/read-only. Local branch `fix/ear-youtube-playback`, based on `51af585f2a84f5064de3d750ab3d7dd4213307df`. The maintainer separately approved public `TheImortalimp/Glitch-Player`, branch `main`, and prerelease `v4.2.4-ear-monitor.1`; existing repositories remain unchanged.
- [ ] Review/approve the numbered R4.3 roadmaps and target release/version.
- [x] Maintain one source of status in this master plus each canonical detailed TODO; update [`../ROADMAP-INDEX.md`](../ROADMAP-INDEX.md) on status/order changes.

## R4.3-00 — EAR monitor / YouTube playback gate

The maintainer approved Phase 0 only on 2026-11-05: a 12 Hz maximum monitor presentation rate,
cached nodes, no hidden/inactive meter work, and transform-based fills. EAR processing, SOFT-EYE,
effects and YouTube resolution must remain unchanged. Constant blurriness is also reported and
remains a separate validation requirement. This is not approval for later phases or a release/version change.

Subsequently, the maintainer explicitly approved publishing this tested candidate
as prerelease `v4.2.4-ear-monitor.1` in the new public `TheImortalimp/Glitch-Player`
repository. Installer version remains 4.2.4. That authorization does not pass this
gate or authorize a stable release or later implementation.

The approved monitor change and 286-test native build are complete. Three baseline,
three initial-candidate and three final-candidate visible/hidden pairs were recorded.
Final hidden runs had zero monitor mutations, and light-load frame timing matched
visible/hidden within 5%. Final visible main-thread task time remained about 9.5%
higher; the final series also used a different DPR from the earlier series.
The maintainer reported the initial 1080p fullscreen candidate "Sharp and smooth".
The [build record](../../BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05)
contains conditions and limits. This is not a full matrix/gate pass.

- [ ] Complete [`ROADMAP-00-EAR-PLAYBACK.md`](ROADMAP-00-EAR-PLAYBACK.md) and its A/B/performance acceptance criteria.
- [ ] Complete the matching stutter-investigation and P0 tasks in [`FULL-CONFLUENCE-ROADMAP.md`](FULL-CONFLUENCE-ROADMAP.md) / [`TODO.md`](TODO.md).
- [x] Review/approve the minimal presentation fix before coding.
- [x] Record WebView2/Windows A/B evidence: monitor shown vs hidden, same track/load; frame gaps, playback progression, traces and hardware/runtime. Limited matrix only; see the build record.
- [ ] Gate decision: **BLOCKED** until the visible-vs-hidden result is within the roadmap target or a measured alternative root cause is fixed and re-tested.
- [ ] On pass, update this status with test evidence and unlock R4.3-01.

## R4.3-01 — Link-list catalogue and track timing

- [ ] Approve proposed groups/order/labels or choose to retain current order with headings.
- [ ] Complete [`ROADMAP-01-LINK-LIST-TRANSITIONS.md`](ROADMAP-01-LINK-LIST-TRANSITIONS.md) and [`TODO-01-LINK-LIST-TRANSITIONS.md`](TODO-01-LINK-LIST-TRANSITIONS.md).
- [ ] Confirm manifest/check strategy and current profile values as migration baseline.
- [ ] Do not start until R4.3-00 passes; do not tune timing to disguise playback stutter.
- [ ] On pass, update the manifest/docs/test evidence and unlock R4.3-02.

## R4.3-02 — Full effects/automation/EAR confluence

- [ ] Complete [`FULL-CONFLUENCE-ROADMAP.md`](FULL-CONFLUENCE-ROADMAP.md) and [`TODO.md`](TODO.md) (this file's TODO-02 child).
- [ ] Inventory every voice, automation, signal, safety gate, timing system, cost class and shared state writer.
- [ ] Approve source/signal provenance, precedence/arbitration, schema/migrations, and phase boundaries before implementation.
- [ ] Migrate by automation family with behavior parity, deterministic tests and rollback points.
- [ ] Validate safety, reduced motion, locks/cancellation, presets/randomization, UI explanations and performance under combined workloads.

## R4.3-03 — Rebuild, release hygiene and final playback validation

- [ ] Use [`../r4.2-roadmaps/REBUILDING.md`](../r4.2-roadmaps/REBUILDING.md) as the existing reproducibility reference; update it only through reviewed changes.
- [ ] Run all manifest/table checks, Node 22+ web tests, .NET host tests, CAB/launcher tests, native Windows x64 build and Defender scan.
- [ ] Run full Windows/WebView2 manual media matrix (local audio/video, YouTube, playlist item changes, EAR modes, monitor visibility, SOFT-EYE, automations, effects, displays, reduced motion).
- [ ] Verify zero new network/telemetry surface, no YouTube audio tap, CSP/host policy preserved, photosensitivity limits/confirmations preserved, installer hash and unsigned status recorded.
- [ ] Reconcile labels, release/version and test counts in every README/roadmap/release note; mark each child TODO only with evidence.
- [ ] Release gate: attach exact commit/tool versions/test counts/performance summary/hash/Defender result and list any unverified limitations.

## Cross-roadmap decisions still open

- [x] New remote/repository/branch/release owner after archive: `TheImortalimp/Glitch-Player`, `main`, maintainer-owned prerelease `v4.2.4-ear-monitor.1`.
- [ ] Approve order and group labels in R4.3-01.
- [ ] Decide whether AUTO/AUDIO can use a clearly named YouTube visual proxy for SOFT-EYE; never describe it as captured audio.
- [ ] Decide whether timer-driven SOFT-EYE remains independent of EAR mode for YouTube.
- [ ] Approve measured monitor refresh rate and performance acceptance hardware scope. The 12 Hz maximum is approved; broader hardware acceptance remains open.
- [ ] Approve manifest boundaries and behavior precedence after inventory.
