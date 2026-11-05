# Release notes — v4.3.1 "Full-Scope Remediation" (prerelease)

**Tag:** `v4.3.1` · **Installer version:** 4.3.1 · **Date:** 2026-11-05

## Downloads

| Asset | Value |
| --- | --- |
| Installer | `Glitch-Player-R4-4.3.1-x64-setup.exe` |
| Size | 44,719,655 bytes |
| SHA-256 | `74d87fa43a5b43876d3eab405770aac62565354f3b97ff4d730dfab3c792d260` |
| CAB payload SHA-256 | `1a390bfb91a2ca13774743965b030ba2665c9c7c4d625a7d677ecf17702401aa` |
| Signed | No. Windows SmartScreen may warn. Keep Windows security protections enabled. |

## What this release is

The complete implementation of the full-scope remediation roadmap
(`GLITCH-PLAYER-FULL-SCOPE-ROADMAP.md`, track R4.3-04), covering all seven
audited subsystems in eight phases:

1. **Glyph & ASCII randomization** — runtime font probe (no tofu), 13-voice
   `SignalGlyphs` routing, seeded `All scripts`, and new **Glyph Roll / Glyph
   Auto / `<LOCK!>`** controls.
2. **Preset randomization** — one canonical 43-voice MACHINE generator with
   unbiased shuffling, full preset fields, zero cross-bank state bleed, a
   replayable **deck seed** UI, and backward-compatible **schema v4**.
3. **Flash & Strobe safety** — manual Trigger pulses through a transient
   envelope (no slider mutation, no instance stacking), true 0.000 rest,
   SOFT-EYE calm caps, and physically reachable washout thresholds. The 20% /
   35% hard ceilings hold on every path.
4. **Automations & ZERO ALL** — cancellation and locks respected by every
   background path, single R3 step per frame, 22 aesthetic groups covering all
   voices, 30 AI-warp modes, and a genuinely airtight ZERO ALL.
5. **DROP THE MILK?** — 30-mode blend confluence, authored composites,
   master/SOFT-EYE/Hard-Light parity, tiered render budget, deck controls.
6. **HARD LIGHT** — first-class, persistent, lockable, preset- and
   ZERO-ALL-aware, with `--moon-veil-k` veil scaling.
7. **SOFT-EYE & EAR** — 43-voice calm tables, guarded `dia` bursts, a visual
   EAR that genuinely drives crescendos, per-source EAR resets, and a YouTube
   reactivity proxy built **only** from legal player state and track metadata —
   **no YouTube/desktop/tab audio is ever captured**.

## Verification

- **353 tests passed**: 96 .NET host, 256 Node web (67 new across 9 suites,
  including the new `milkdrop-hardlight` and `soft-eye-r3` suites), 1 CAB
  launcher integration test.
- Glyph-table, effects-manifest and surfaces-manifest `--check` builders green.
- Microsoft Defender build guard: no threats in the installer or working package.
- Build environment: Windows 11 x64, .NET SDK 10.0.403, Node v24.19.0, NSIS 3.1311.

See [build evidence](../../BUILD_STATUS.md#r431-full-scope-remediation-build-2026-11-05).

## Why this is a prerelease

The manual Windows/WebView2 playback matrix (YouTube and local media, EAR
modes, SOFT-EYE, automations, multiple displays, reduced motion) has **not**
been run against this build. The [R4.3-00 playback gate](TODO-00-MASTER.md)
remains open. No playback-smoothness or performance claim is made; automated
tests cannot substitute for hands-on WebView2 validation.

> **Photosensitivity warning:** source videos and effects can produce flashing
> and high-contrast flicker. Flash and Strobe start at zero and are capped at
> 20% and 35%. Automatic light movement is off by default, session-only and
> requires confirmation. This is not a photosensitivity-safe mode.
