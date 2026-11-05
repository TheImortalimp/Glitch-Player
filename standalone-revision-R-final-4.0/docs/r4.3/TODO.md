# TODO-02 — R4.3 Full Confluence

**Program order:** TODO-02, after TODO-00 (EAR playback gate) and TODO-01 (link-list/timing). See the [canonical roadmap/TODO index](../ROADMAP-INDEX.md) and [master sequence](TODO-00-MASTER.md).

This is the proposed execution checklist for `FULL-CONFLUENCE-ROADMAP.md`. Only the approved Phase 0 items with evidence below are checked. Later-phase implementation still requires approval and the preceding gates.

## Gate 0 — Approvals and baseline

- [ ] Confirm where work will live (upstream is archived), release branch, owner, and proposed R4.3/version naming.
- [ ] Approve the roadmap, phase boundaries, user-visible defaults, and rollback policy.
- [ ] Record user's reproduction details: Windows/CPU/GPU, display refresh and monitor layout, WebView2 runtime, exact YouTube/video/quality, build hash, fullscreen/windowed, and enabled effects/automations.
- [ ] Reproduce current 4.2.4 stutter with EAR monitor visible and hidden using the same clip/settings; capture at least 3 runs per case.
- [ ] Compare with the prior known-good build if available; separate playback-clock stalls from animation-frame/compositor stalls and YouTube buffering.
- [ ] Capture local WebView2/Chromium performance trace and Windows ETW/GPUView trace for visible vs hidden monitor.
- [x] Record baseline median/p95/p99 frame intervals, >1.5x/>2x refresh-period gaps, main-thread work, video progress, renderer cost, and machine/runtime details. See [build evidence](../../BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05); decoded-video frame timing and ETW remain unmeasured.
- [ ] Confirm no new instrumentation logs remote URLs, media content, or user data; keep diagnostics opt-in and bounded.

## P0 — Remove unnecessary EAR monitor cost without changing EAR behavior

- [x] Cache EAR HUD/bar/status element references once; avoid repeated `getElementById` lookups in the frame path.
- [x] Add a real hidden/not-playing early exit so a CSS-hidden or user-hidden meter does no display DOM writes.
- [x] Throttle only HUD presentation to the approved 12 Hz maximum using the existing frame loop; do not add a competing RAF or timer.
- [x] Keep EAR sampling, SOFT-EYE, automations and effect state updates at their existing cadence; verify meter throttling does not throttle signal processing.
- [x] Replace repeatedly transitioning CSS `width` meter writes with a transform-based fill (for example `scaleX` from left) or another profiled compositor-friendly form; do not force layers without evidence.
- [ ] Respect reduced-motion behavior and keyboard/screen-reader access; retain truthful source/mode labels. Native reduced-motion and mode/WAIT checks passed; markup is unchanged, but full keyboard/screen-reader checks remain open.
- [x] Add tests: hidden meter causes zero DOM writes; visible update never exceeds selected cadence; signal state still advances; changing EAR modes and hide/show persistence still work. Six new behavioral tests plus existing persistence tests and native mode/hide/show checks pass.
- [ ] Re-run the Windows/WebView2 A/B matrix and meet the roadmap acceptance gate (visible within 5% of hidden baseline on the primary test machine).
- [ ] If the gate fails, keep the regression open and investigate the recorded main-thread/GPU/decode/network evidence; do not mask it by lowering video quality or disabling unrelated features.

## P1 — Inventory and definitions

- [ ] Inventory all 43 voices, four masters, R3 twins, renderers, caps, costs, transitions, locks, presets and cancellation paths.
- [ ] Inventory each automation: manual, Auto Glitch, continual randomization, AUTO preset cycling, AI WARP, V-SYNC, light automation, aesthetic bursts, SOFT-EYE/EAR, and per-track timing.
- [ ] Build and review the read/write interaction graph; flag duplicate writers, implicit feedback loops, and any path that can restart a cancelled voice.
- [ ] Specify source/signal states: local audio, local video visual, YouTube visual proxy, unavailable, warming, stale; define capabilities and audio-vs-visual trigger gates.
- [ ] Reconcile actual behavior and tests before proposing contract changes; identify all constants duplicated between JS, manifests, CSS, host code, docs and tests.
- [ ] Reconcile version labels, installer filenames, and test counts in root/R4 docs against the current source/release evidence.
- [ ] Approve the minimal manifest boundaries for transitions, lights, automations, signals, governor, and input behavior (or justify a smaller grouping).

## P2 — Source-of-truth and validation

- [ ] Add versioned schema(s) only after P1 inventory approval; preserve current values as the migration baseline.
- [ ] Add deterministic build/check tools for every accepted definition source; fail checks when source, generated data, and docs drift.
- [ ] Add tests for each bound, capability, source label, default, photosensitivity rule, voice alias/twin, and automation relationship.
- [ ] Define safe startup behavior if a nonessential definition fails validation; never silently bypass safety policy.
- [ ] Define migration/rollback for persisted EAR mode, monitor visibility, SOFT-EYE state, presets, and future settings schema.
- [ ] Generate a reviewable before/after behavior report for any definition migration.

## P3 — Unified intent, arbitration and safety

- [ ] Design contribution/intent types with origin, target voice, value/range, priority, seed/trace ID, expiry, and eligibility reason.
- [ ] Document and test precedence: safety/cancellation → manual/user locks → explicit user action → enabled automation → fallback defaults.
- [ ] Migrate one automation family at a time; compare its output against the current implementation before enabling it by default.
- [ ] Make every live voice explainable as manual, preset, named automation, or fallback; show why a request was suppressed/capped/locked/cancelled.
- [ ] Preserve independent sliders/locks and explicit-only confluence pairing; no master should wake an unintended R3 twin.
- [ ] Preserve seeded/reproducible MACHINE deck generation and separate random streams so unrelated automations do not synchronize.
- [ ] Reassert ZERO ALL/cancel latch and explicit wake semantics across every automation/intent path.
- [ ] Route all Flash/Strobe contributions through one last-mile gate enforcing 20%/35% caps, rate/density constraints, opt-in/confirmation, and warning policy.
- [ ] Prove lights never hard-cut and cannot be selected by forbidden automatic/preset/randomized paths.

## P4 — Timing, cost and governor confluence

- [ ] Define per-voice transition curves, holds, jitter, breathing/rest, per-track timing and global cut-spacing in one validated source.
- [ ] Define renderer/automation cost classes and a measurable frame budget, separating UI, effects canvas, WebView2 video surface, and host costs.
- [ ] Ensure the governor sheds decorative/effects work before video playback, essential controls, or accessibility degrade.
- [ ] Test hysteresis/recovery and real display cadence at 24/30/50/60+ Hz and across supported monitor arrangements.
- [ ] Validate full automation combinations, not only isolated unit tests; ensure bounded concurrency, no unintended synchronized peaks, and no repeated quality-tier oscillation.

## P5 — Release readiness

- [ ] Generate effect, automation, source-signal, safety, settings, and troubleshooting documentation from accepted definitions.
- [ ] Update user-facing EAR wording so YouTube is clearly described as a picture-derived proxy, not captured audio.
- [ ] Run manifest/table `--check` tools and the complete Node web suite under Node 22+.
- [ ] Run .NET host tests, CAB/launcher integration tests, native Windows x64 publish and NSIS build.
- [ ] Run manual WebView2 media matrix: local audio/video, YouTube, source switches, EAR modes, monitor hide/show, SOFT-EYE, all automation combinations, display rates, reduced motion.
- [ ] Verify the stutter acceptance gate on the primary and constrained test machine; archive local trace summaries without private media details.
- [ ] Run Defender scan; record commit, tool versions, test counts, installer hash, unsigned status and scan outcome.
- [ ] Review security/CSP/network-surface diff, photosensitivity warnings, settings migration and rollback before release.
- [ ] Publish release notes that distinguish verified results from known limitations; do not claim signed or universally stutter-free playback without evidence.

## Open decisions blocking implementation

- [ ] Work branch/repository and version naming after upstream archive.
- [ ] Whether `AUTO` and `AUDIO` modes permit a clearly labeled YouTube visual proxy to drive SOFT-EYE, or whether AUDIO must wait/no-drive when measured audio is unavailable.
- [ ] Whether timer-driven SOFT-EYE remains independent of EAR mode on YouTube.
- [ ] Whether the 10–15 Hz monitor update and transform-based meter are approved after profiling.
- [ ] Hardware scope and acceptance target for the visible-vs-hidden stutter comparison.
- [ ] Final manifest grouping and level of generated UI/explanation detail.
