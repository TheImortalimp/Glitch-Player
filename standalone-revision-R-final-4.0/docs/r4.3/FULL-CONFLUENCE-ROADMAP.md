# Roadmap R4.3-02 — Full Confluence

**Program order:** R4.3-02, after the EAR playback gate (R4.3-00) and link-list/timing contract (R4.3-01). See the [canonical roadmap/TODO index](../ROADMAP-INDEX.md), [R4.3-00 EAR playback roadmap](ROADMAP-00-EAR-PLAYBACK.md), and [R4.3-01 link-list transition roadmap](ROADMAP-01-LINK-LIST-TRANSITIONS.md).

**Status:** Proposed planning baseline; no implementation changes authorized by this document alone.  
**Snapshot:** R Final 4.2.4, commit `51af585f2a84f5064de3d750ab3d7dd4213307df` (2026-11-04).  
**Reported regression:** YouTube playback stutters constantly with the 4.2.4 EAR update; stutter is reduced when the EAR monitor is hidden.

## 1. Recommendation

Treat the visible EAR monitor as a confirmed performance contributor, not yet as the only cause. First make the monitor genuinely low-cost and prove that the shown state approaches the hidden-state playback smoothness. Keep EAR signal analysis and the app's animation/automation engine running at their existing frame cadence; decouple only the monitor's presentation from that loop. Do not weaken effects, lower YouTube quality, disable automation, or change SOFT-EYE defaults as a first-line fix.

Then deliver Full Confluence incrementally: make source/signal semantics, voice/automation ownership, arbitration, timing, safety caps, cancellation, and render cost explicit and machine-checked. Preserve the creative behavior that already works; unify its contracts before attempting a large engine rewrite.

The next release name/version is a proposal only: **R4.3 “Full Confluence.”** The upstream repository is archived, so the maintainer must decide where approved work will live and how the new release will be versioned.

## 2. Evidence and diagnosis

### User observation

The user reports that YouTube stutters constantly while EAR is in use and that hiding the EAR monitor reduces the stutter. This is stronger evidence for monitor presentation/layout/compositing overhead than the earlier source-only inspection. It does not prove that the monitor is the only cost or isolate which DOM/CSS operation is responsible.

### Verified source facts

- `webui/js/glitch-player.js`: `frame()` calls `softStep()` from the shared animation loop. The EAR state, SOFT-EYE, automations, filters, and the draw scheduler all share the WebView2 page's main thread.
- `softUpdateHud()` invokes `softUpdateEarHud()` every SOFT-EYE step. `softUpdateEarHud()` looks up meter nodes and updates five meter widths, status text, classes and the EAR control state.
- `webui/css/glitch-player.css`: meter bars animate `width` with a `.14s` transition. Width is layout-affecting; repeated target changes can repeatedly retarget the transition and add layout/paint/compositing work while YouTube is playing.
- The most recent change scales YouTube's **picture-derived** energy and motion by `1.25` and `1.3` in `softStep()`. This is not tapped YouTube audio. `GlitchEngine.createEar().feedVisual()` currently sets `active = false`; its signal must not be mislabeled as measured audio.
- The Web Audio analyser is attached to the local `<video>` / `<audio>` elements, not the cross-origin YouTube iframe. `startPlayback()` pauses local elements before starting YouTube. The latest local play listeners do not intentionally tap YouTube.
- Existing tests validate source-level behavior and wiring; they do not exercise actual video smoothness in the Windows WebView2 host.

### Likely causes, ranked, still to verify

1. **Most likely: visible monitor's repeated DOM/CSS work.** Five frequently changing `width` properties with transitions, plus per-frame state/status reads and writes, match the user's hide/show observation.
2. **Likely interaction: monitor work plus a busy effects board.** The monitor, effect canvas, filters, YouTube embed, and automation all compete for main-thread/GPU/compositor time. The EAR update's boosted visual drive may change effects/visual activity, although it does not add a second renderer.
3. **Possible: WebView2 GPU/composition pressure or display-refresh mismatch.** The external iframe, canvas filters, full-screen transforms and host display cadence can expose hardware-specific cost.
4. **Less likely for YouTube: local Web Audio analyser/resume path.** It is not connected to YouTube's iframe; retain as a lifecycle audit item, not the leading playback explanation.
5. **Separate cause to rule out: YouTube buffering/network/embed behavior.** It can look like dropped frames, but should not systematically improve merely because a local HUD is hidden. Measure rather than assume.

## 3. Immediate performance options

| Option | Description | Pros | Risks / decision |
| --- | --- | --- | --- |
| A. Stop updating the monitor | Keep the monitor hidden or freeze values | Lowest immediate work | Removes a requested feature; diagnostic only, not the release fix |
| B. Throttle and skip hidden monitor updates | Cache element references once; update only while visible and at 10–15 Hz from the existing frame loop; do not add a competing timer | Small, reversible, preserves EAR analysis and features | Recommended first implementation; 10–15 Hz should be validated for legibility and cost |
| C. Make meter rendering compositor-friendly | Replace repeated `width` changes and `.14s` width transitions with a cached transform/custom property using `scaleX`, left transform origin, no layout-affecting transition; update at the same 10–15 Hz | Reduces layout/paint cost; smooth enough at a bounded UI refresh | Validate WebView2 compositor behavior and accessibility; avoid forcing layers without measurement |
| D. Reduce HUD detail | Fewer bars, static numeric/source summary, or user-selectable compact mode | Additional headroom on low-end hardware | Less information; optional fallback, not the first fix |
| E. Move EAR DSP off the UI thread | Worker/AudioWorklet/off-main-thread processing | Could help if profiling finds DSP cost | High complexity; analyser access/state handoff and privacy/lifecycle risks; not justified until measured |
| F. More aggressive quality tier for the whole app | Lower canvas backing resolution/draw frequency when overloaded | Useful safety net for constrained devices | Changes visual output and does not fix avoidable HUD work; retain as governor fallback only |

**Recommended combination:** B + C, with hidden-state early exit, no extra loop, and a debug-only/manual measurement path. Keep the EAR signal and automation calculations active; only reduce the monitor's DOM presentation cadence. Do not use the monitor's display rate as the EAR sampling rate.

## 4. Performance investigation and acceptance gate

### Baseline matrix

On the user's Windows machine, record Windows version, CPU/GPU, display(s) and refresh rate, WebView2 Runtime version, video identifier/quality, window/fullscreen state, and exact build/commit. Use the same clip, resolution, display, and automation state for each A/B run. Compare the last known-good release where available with current 4.2.4 source. Test at minimum:

1. EAR monitor visible vs hidden; modes AUTO, AUDIO, CANVAS.
2. SOFT-EYE on vs off.
3. All automation off; each major automation alone; all requested automations combined.
4. Low vs high effect load, including active filters/YouTube warps; no effect sliders vs a representative heavy preset.
5. Native display refresh rate(s), windowed vs fullscreen, and a low-power machine if available.
6. A/B candidate meter implementation with the same playback and automation settings.

Change only one variable per run. Include a 30-second warm-up and at least 3 repeat runs. Record when stutter occurs and whether YouTube's playback clock continues.

### Measurement

- Record video progress using the bundled YouTube player controller's allowed player state/current-time data at a coarse interval. Do not inspect the cross-origin iframe DOM or attempt audio capture.
- Measure animation-frame interval distributions and main-thread work (median, p95, p99, count of gaps greater than 1.5x and 2x display period). Keep diagnostics opt-in and memory-bounded.
- Use WebView2/Chromium DevTools Performance tracing or Windows ETW/GPUView during controlled runs to separate page main-thread saturation, compositor/GPU pressure, media decode, and network buffering. Diagnostics must remain local; do not add telemetry or ship verbose logging by default.
- Test hidden monitor early-exit separately from CSS-hidden state. A visually hidden element whose DOM is still updated is not a true no-work baseline.

### Proposed pass criteria

- With the monitor visible, frame-gap and playback-stall measures are within **5% of the hidden-monitor baseline** under the same effect/automation load on the primary supported test machine; no continuous visible-vs-hidden stutter difference remains.
- The monitor performs no DOM writes while hidden and at most 15 UI refreshes per second while visible. EAR sampling/automation timing remains frame-driven and behaviorally unchanged.
- On a constrained test machine, the frame governor still degrades canvas quality as designed rather than freezing video or the UI.
- No material regression in manual meter readability, local-media EAR, source switching, YouTube playback, reduced motion, or any of the existing safety tests.
- Report actual measured values and hardware/runtime. If the 5% target is not met, do not call the regression resolved; continue profiling the combined board/iframe/compositor path.

## 5. Full-confluence target architecture

### 5.1 One explicit signal model

Add a small, validated signal/source contract (new manifest or a clearly scoped section of the central definitions layer) that distinguishes:

- `local-audio`: measured spectrum/time-domain from an app-owned media element;
- `local-video-visual`: image-derived profile from a local video/artwork source;
- `youtube-visual-proxy`: bounded picture/profile-derived proxy only; never actual YouTube audio;
- `none` / unavailable / warming / stale.

Each signal declares capabilities, confidence/quality, update cadence, and which consumers may read it. `active`, `ready`, and `source` semantics must be documented and tested. Visual proxy data must not accidentally satisfy audio-only onset/drop rules. Explicit AUDIO mode must have a clear fallback/wait contract while still showing the user that YouTube's picture proxy is not measured audio.

### 5.2 Unified effects and automation definition system

Retain the current registry and add missing definitions in small, generated, checked manifests rather than starting with one giant rewrite. Candidate boundaries:

- `effects.manifest.json`: 43 voices, aliases/twins, renderer, caps, photosensitivity class, manual/automatic permissions, blend/filter ownership, cost class and baseline-off state.
- `presets.schema.json`: user/MACHINE/LAB preset constraints and migration/version rules.
- `surfaces.manifest.json`: screens, controls and reduced-motion behavior.
- `transitions.manifest.json`: glide/cut character, travel/hold/jitter/rest ranges, per-track profile and global cut-spacing rules.
- `lights.manifest.json`: Flash/Strobe caps, confirmation gates, rates, activation and rest envelopes; one enforced safety path for manual, preset and automated contributions.
- `automations.manifest.json`: Auto Glitch, Continual Randomization, AUTO preset cycle, AI WARP, V-SYNC, light automation, aesthetic bursts, ear-driven SOFT-EYE, named priorities, trigger capabilities, schedules and cancellation/lock behavior.
- `signals.manifest.json` (or signal section): EAR source contracts above, source switching, crossfade, staleness, and permitted trigger consumers.
- `governor.manifest.json`: cost classes, quality tiers, pixel caps, draw cadence, adaptation thresholds and recovery hysteresis.
- `input.manifest.json`: keys/chords and explicit confirmation actions.

The roadmap phase may consolidate this into fewer files if it demonstrates simpler ownership. The invariant is one authoritative definition per behavior, deterministic generation/validation, and no duplicated safety constants—not a predetermined number of JSON files.

### 5.3 One arbitration and contribution pipeline

Plan an explicit pipeline for every effect target: **source signal → automation intent → eligibility checks → arbitration/ownership → safety/cancellation/lock gate → contribution/transition → renderer → governor accounting**. Automations should submit intents/contributions rather than silently writing the same slider/value state through unrelated paths. Keep manual user action highest priority; preserve preset semantics and locks; make randomization/session seeds reproducible. Ensure all sources converge only where the definition permits them.

Required precedence (refine against current behavior in the plan):

1. hard safety policy and user cancellation/`ZERO ALL` latch;
2. direct manual action and explicit user lock;
3. explicit user-selected preset, randomize, or tuning action;
4. enabled automation intents (individually named and attributable);
5. ambient/fallback defaults.

No authority may bypass the safety layer. Define how a slider wakes a cancelled voice, how a preset releases only preset-sourced locks, how a lock behaves across simultaneous automations, and how ZERO ALL prevents automatic restart until an explicit wake.

### 5.4 Harmony without synchronized overload

Preserve the existing per-voice independence, staggered join odds, breathing room, seeded MACHINE decks, hard-cut spacing, and selective confluence pairs. Model shared timing as bounded coordination, not one universal trigger that synchronizes all voices. Reserve headroom for the source video: cost-aware choices and the governor should shed decorative/canvas work before video playback or user interaction degrades. Lights remain special, capped, confirmation-gated and never hard-cut.

### 5.5 One host/UI contract and diagnostics

Keep the host trust boundary intact. UI reads immutable/validated definitions and explains why a voice is active, suppressed, capped, locked, cancelled, or waiting for a signal. Diagnostics are opt-in, local, bounded, and do not log media URLs, content, or user presets by default. Generated docs explain signal provenance and each automation's effect on each voice.

## 6. Phased roadmap and exit gates

### Phase 0 — Stutter regression and monitor fix

- Reproduce visible/hidden difference; gather a real trace before and after the minimal B+C fix.
- Cache EAR HUD node refs; bypass all HUD work when hidden/not playing; refresh at a bounded 10–15 Hz from the existing frame loop.
- Replace width animation with `scaleX`/compositor-friendly rendering; verify accessibility/reduced motion and WebView2 behavior.
- Add tests for hidden-state no-write, refresh-rate cap, stable signal values and unchanged EAR/automation cadence.
- Exit only when the acceptance criteria in Section 4 pass on Windows WebView2. If another path dominates, record it and revise rather than masking it.

### Phase 1 — Behavior inventory and interaction graph

- Build a checked inventory of effects, voice twins, automations, signals, presets, locks, cancellation, safety constraints, surfaces, renderer costs, build-time and runtime owners.
- Generate a directed interaction graph from definitions; flag shared state writes and implicit feedback paths.
- Resolve duplicate/stale counts and release labels in docs.
- Exit: every active behavior has an owner, inputs, outputs, gates, and tests; no undocumented hidden writer remains.

### Phase 2 — Definition and validation contracts

- Add the smallest set of manifests/definitions that closes actual gaps; generate/validate at startup or build time with the existing fail-safe conventions.
- Add schema versions and migration policy for stored EAR/SOFT-EYE/HUD settings and presets.
- Define capability-safe signal fallback and source labels.
- Exit: `--check` catches drift; all voice/automation/signal bounds and relations are asserted; failed optional data cannot prevent safe app startup.

### Phase 3 — Arbitration and automation contributions

- Introduce intent/contribution arbitration behind tests, then migrate one automation family at a time (ear/SOFT-EYE, preset/Auto Glitch, continual randomizer/AI WARP/V-SYNC, lights/aesthetic bursts).
- Preserve cancellations, locks, independent voice controls, seeded randomness and only explicitly allowed confluence pairs.
- Exit: duplicate writers are eliminated or intentionally composed, each resulting contribution can be explained in the UI/debug trace, and existing behavior tests pass.

### Phase 4 — Cost-aware render and timing integration

- Assign renderer cost classes; aggregate board workload; define bounded quality shedding and recovery. Include the monitor/UI separately from effects canvas and embedded-video media.
- Connect track timing, per-voice transitions, lights and governor through definitions without making all automations fire on the same beat.
- Exit: representative light/heavy automation tests meet frame and playback budgets; 24/30/50/60+ Hz behavior is tested; no timer/RAF duplication.

### Phase 5 — Full UI, docs, release and migration

- Generate effect/automation/signal reference docs, UI explanations and roadmap status from definitions; document the EAR/CANVAS provenance plainly.
- Run host, web, manifest, packaging/CAB, Defender and Windows manual playback suites. Rebuild native x64 installer; record hashes and unsigned status.
- Exit: release checklist complete, migration/backout validated, no stale counts, no unverified performance claims.

## 7. Test strategy

- **Unit/pure logic:** signal modes/capabilities, local-vs-visual semantics, stale/warming state, arbitration/priority, per-voice ownership, seeded random streams, transitions, caps, locks, cancellation, schema migration.
- **DOM/source tests:** EAR HUD element caching, max refresh rate, no DOM writes while hidden, transform meter implementation, no extra RAF/timer, status clarity, reduced-motion parity.
- **Integration:** current sequence order; source switching from local media to YouTube and back; audio context lifecycle; AUTO/AUDIO/CANVAS fallback; all automations individually and combined; no YouTube audio tap.
- **Safety/security:** Flash/Strobe and photosensitivity tests across every path; CSP/Trusted Types; host bridge and YouTube message policy; settings local-only; no new network sources.
- **Performance:** opt-in synthetic loop tests for costly combinations, plus Windows/WebView2 manual playback matrix and trace-backed acceptance. JavaScript unit tests alone cannot pass the playback gate.
- **Build/release:** current .NET host tests, web tests, manifest/table checks, CAB integration tests, native Windows x64 publish, Defender scan, unsigned release notes/checksum verification.

## 8. Risks and mitigations

- **UI changes do not solve all stutter:** retain the A/B matrix and continue to isolate main thread, GPU, decode, and network paths.
- **Visual proxy misrepresented as audio:** distinct source type and UI label, audio-only gates require measured audio.
- **Too much unification causes regressions:** migrate by automation family with shadow comparisons and rollback switches during development; avoid a big-bang rewrite.
- **Central arbitration alters creative output:** record existing behavior, seeded regression scenarios, and user-visible source attribution before enabling it.
- **Safety bypass through a new contribution path:** put caps, photosensitivity and cancellation after aggregation; test every intent source against one shared gate.
- **Performance budget overfits one PC:** test multiple refresh rates and at least one constrained device; do not trade playback for decorative effects.
- **Archived upstream / build availability:** confirm maintainer's new working remote/release approach; build only from reviewed local branch.

## 9. Decisions needed before implementation

1. Confirm the proposed R4.3/version/release branch and ownership, given the upstream repo is archived.
2. Approve the recommended EAR HUD fix (10–15 Hz, cached refs, skip hidden, transform-based meters) after Phase 0 measurement.
3. Decide whether AUTO and AUDIO modes may use a **labeled visual proxy** for SOFT-EYE behavior when YouTube audio is unavailable, or whether AUDIO should explicitly wait and not drive visual automation.
4. Approve the automation precedence/contribution model after the behavior inventory maps current edge cases.
5. Set the lowest supported performance target/hardware and whether the proposed 5% shown-vs-hidden acceptance target is realistic.
6. Approve manifest boundaries after the inventory; the named manifests above are candidate boundaries, not a mandate.
7. Decide whether timer-driven SOFT-EYE on YouTube remains independent of EAR signal source, or whether the mode must gate it.

## 10. Current baseline notes

- Root `README.md`/R4 documentation has historical version labels and test-count text that should be reconciled during release hygiene. The latest commit message reports 280 total tests; the current web suite passed 183 tests in the sandbox, while the host/CAB suites require the Windows build environment.
- Build requirements and LF line-ending caveat are documented in the R4 README and `docs/r4.2-roadmaps/REBUILDING.md`.
- No source implementation has been modified as part of this roadmap deliverable.
