# Roadmap R4.3-00 — EAR Monitor and YouTube Playback Smoothness

**Priority:** P0, blocks R4.3-01 and R4.3-02 implementation.  
**Status:** Approved monitor fix implemented; limited native checks pass, full playback gate remains open.  
**Phase 0 approval (2026-11-05):** the maintainer approved the minimal monitor-only fix at a maximum 12 Hz. The 286-test build and limited native A/B checks passed; the maintainer assessed the 1080p fullscreen candidate as "Sharp and smooth". This does not establish the monitor as the sole original cause or complete the wider native matrix. See [build evidence](../../BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05); later phases stay blocked. The maintainer separately approved publishing this candidate as prerelease `v4.2.4-ear-monitor.1`, not as a stable release or a gate pass.
**User evidence:** YouTube playback stutters constantly while EAR is active; it stutters less when the EAR monitor is hidden.  
**Full cross-system context:** [`FULL-CONFLUENCE-ROADMAP.md`](FULL-CONFLUENCE-ROADMAP.md), Phase 0.  
**Detailed tasks:** [`TODO-00-MASTER.md`](TODO-00-MASTER.md), section 00.

## Goal

Restore smooth YouTube playback with the EAR monitor visible, at the same time preserving EAR sampling, canvas fallback, SOFT-EYE, effect rendering, and automation behavior. Treat the visible monitor as a demonstrated contributor based on the user's comparison, not as the confirmed sole cause.

## Findings

The 4.2.4 update's EAR analyzer is for app-owned local audio/video elements; it does not tap YouTube's cross-origin iframe. The main loop runs `softStep()` and updates the EAR HUD from the shared WebView2 page thread. Before the patch, the HUD wrote five meter widths while CSS animated those widths with a `.14s` transition, even when the monitor was hidden. Repeated width changes can create layout/paint/compositor work. The approved patch replaces that presentation path with cached, visibility-gated, rate-capped transform fills without throttling `softStep()`.

Other plausible interacting costs are the active effect canvas, full-screen filters/warps, WebView2 compositing of the YouTube frame, display refresh mismatch, or unrelated YouTube buffering. No test in the current source suite measures actual YouTube playback smoothness.

## Recommended implementation option

After capturing a baseline trace, implement the smallest reversible UI-only change:

1. Cache EAR monitor DOM references once instead of looking them up in the frame path.
2. Return before all meter/status DOM reads and writes when the monitor is hidden or playback is not active.
3. Throttle monitor presentation to a measured 10–15 Hz using the existing frame loop; do not add a second RAF or timer.
4. Keep EAR DSP, signal state, SOFT-EYE, automation scheduling and video playback independent of that UI throttle.
5. Replace repeated `width` + `.14s` width transitions with transform-based fill (`scaleX`, origin left) or another measured compositor-friendly implementation.
6. Preserve status accessibility, user hide/show preference, reduced-motion behavior and truth about source provenance (YouTube is picture-derived proxy, not measured audio).

Do not begin with reduced YouTube resolution, disabled effects, disabling SOFT-EYE, or globally lowering the renderer. Those may hide the symptom while preserving avoidable monitor work.

## Diagnosis and exit gate

Run visible-vs-hidden EAR monitor A/B tests on the same Windows/WebView2 machine, YouTube clip/quality, display, window state, SOFT-EYE setting, effects and automation settings. Include three or more repeated runs, a warm-up period and a WebView2/Chromium performance trace. Record Windows/WebView2 versions, CPU/GPU, refresh rate, p50/p95/p99 frame intervals, main-thread work, >1.5x/>2x refresh-period gaps, player state/current-time progression, and whether buffering is reported. Keep diagnostics local, bounded, and opt-in.

Test the monitor visible/hidden under all EAR modes, SOFT-EYE on/off, automations off/individually/all-on, light/heavy effect loads, multiple refresh rates, and fullscreen/windowed. Also compare with a prior known-good release if available. Do not inspect the YouTube iframe DOM, tap its audio, add network calls, or ship telemetry.

**Pass:** visible monitor playback measures within 5% of hidden-monitor baseline on the primary test machine, with no continuous visible-only stutter; monitor does no presentation writes while hidden and refreshes no faster than the approved rate while visible; EAR/automation state progression is unchanged. Repeat on a constrained machine if available. If this fails, keep the issue open and use traces to distinguish main-thread, GPU/compositor, media decode and network causes.

## Dependencies and hand-off

- **Before:** user reproduction is recorded and branch/host machine are available.
- **After pass:** unlock Roadmap R4.3-01 link-list/timing work, then Roadmap R4.3-02 full confluence. Regression evidence and changes become the performance baseline for all later benchmarks.
- **If not reproducible:** preserve the user's report, collect runtime data, and keep the gate blocked; do not mark as fixed based solely on hiding the monitor or passing source tests.
