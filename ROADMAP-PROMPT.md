# Copilot handoff: review the roadmap, then implement only after approval

The ordered roadmap set and matching TODOs have been prepared. Start with:

- `standalone-revision-R-final-4.0/docs/ROADMAP-INDEX.md`
- `standalone-revision-R-final-4.0/docs/r4.3/TODO-00-MASTER.md`
- `standalone-revision-R-final-4.0/docs/r4.3/ROADMAP-00-EAR-PLAYBACK.md` + its master TODO section
- `standalone-revision-R-final-4.0/docs/r4.3/ROADMAP-01-LINK-LIST-TRANSITIONS.md` and `TODO-01-LINK-LIST-TRANSITIONS.md`
- `standalone-revision-R-final-4.0/docs/r4.3/FULL-CONFLUENCE-ROADMAP.md` and `TODO.md` (labelled R4.3-02 / TODO-02)

## First request to Copilot

Ask Copilot to inspect these two documents and the referenced source/tests. Have it challenge assumptions, correct path/function references, identify missing blockers, and produce a review summary. **Do not edit implementation code or mark TODO items complete yet.** The maintainer/user must approve the plan and resolve the open decisions.

The reported YouTube stutter is not hypothetical: the user reports constant stutter with the EAR monitor visible and less stutter when the monitor is hidden. Treat the monitor as a demonstrated contributor, not necessarily the sole cause. Keep the regression open until an A/B measurement meets the roadmap's performance gate.

## After explicit roadmap approval

Implement **Phase 0 only** from the roadmap, in a minimal and reversible patch. First add/adjust tests that enforce the planned UI update rate and hidden-state no-write behavior. Then cache HUD references, skip presentation updates while hidden/not playing, throttle only the monitor presentation at the approved cadence using the existing frame loop, and test a compositor-friendly meter rendering approach. Do not throttle EAR DSP, SOFT-EYE, effects, automations, or YouTube playback to make the benchmark look better. Do not add a competing RAF/timer, telemetry, network call, or YouTube audio capture.

Run the web suite and required checks; on Windows also run the native WebView2 playback A/B matrix. Report precise modified files and test evidence. If Windows playback profiling cannot be run, leave the regression unverified and do not claim it is fixed. Do not start P1 or refactor all automations until Phase 0 passes and is approved separately.

## Required safety and design constraints

Follow the project `AGENTS.md` and the roadmap's invariants. Preserve CSP/host security, local-only settings, source provenance (YouTube visual proxy is not audio), reduced-motion behavior, effect independence, user locks, cancellation/`ZERO ALL`, and all photosensitivity/Flash/Strobe limits and confirmations.
