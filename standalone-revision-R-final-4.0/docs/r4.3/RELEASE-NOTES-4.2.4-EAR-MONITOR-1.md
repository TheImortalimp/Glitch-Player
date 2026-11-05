# Glitch Player v4.2.4-ear-monitor.1

**Prerelease: EAR monitor presentation fix.** Installer version remains **4.2.4**.
This release contains the complete source history, the monitor fix and tests, the
supplied roadmaps/TODOs, updated READMEs, About information and build evidence.

## Downloads

- [Windows x64 installer](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-R4-4.2.4-x64-setup.exe)
- [Installer SHA-256 file](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-R4-4.2.4-x64-setup.exe.sha256)
- [Documentation and README ZIP](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-v4.2.4-ear-monitor.1-documentation.zip)
- [Source repository and About](https://github.com/TheImortalimp/Glitch-Player#about)
- [Tagged source](https://github.com/TheImortalimp/Glitch-Player/tree/v4.2.4-ear-monitor.1)

Installer size: **44,657,686 bytes**.

```text
f530d6570e6c10b154a4f3368d1998b10bf8a82c732caa692919aff9e3011080
```

The installer is **unsigned**. The native build's Microsoft Defender scan reported
no threats; this is not a signing or universal safety guarantee. Keep Windows
security protections enabled. Compare the downloaded file's SHA-256 with the value
above before running it:

```powershell
Get-FileHash -LiteralPath '.\Glitch-Player-R4-4.2.4-x64-setup.exe' -Algorithm SHA256
```

Use the actual downloaded path. Earlier 4.2.4 builds have the same filename but
different hashes. Do not run a file whose hash differs.

## What changed

- EAR monitor nodes are cached rather than repeatedly looked up in the frame path.
- Hidden/inactive/paused presentation does no monitor DOM work.
- Visible presentation is capped at **12 Hz maximum** in the existing frame loop.
- Meter fills use transforms instead of changing widths. Canonical numeric strings
  avoid repeated writes after native CSSOM serialization.
- The separate EAR mode/WAIT button remains current when the monitor is hidden.
- EAR processing, SOFT-EYE, effects, automation, YouTube quality, host security,
  reduced-motion rules and photosensitivity safeguards are unchanged.

YouTube uses a picture-derived visual proxy, **not captured YouTube audio**.

## Verification and limitations

- **286 tests passed:** 96 .NET host, 189 web, 1 CAB integration.
- Native Windows/WebView2 testing included three visible/hidden pairs per series,
  with warm-up and bounded local traces.
- Final light-load runs at 24 Hz measured p50/p95/p99 RAF intervals of
  **41.7/41.8/41.8 ms**, with no >1.5x or >2x display-period gaps, no repeated sampled
  playback-clock values, and **zero hidden monitor mutations**.
- Native AUTO/AUDIO/CANVAS, AUDIO WAIT, hide/show and reduced-motion checks passed.
- Fullscreen automatically selected 1080p; the maintainer assessed the initial
  fullscreen candidate as **"Sharp and smooth"**.

This is **not** a universal sharpness/stutter fix or a full roadmap-gate pass.
The original light-load baseline did not reproduce continuous visible-only stutter.
RAF timing does not measure decoded-video frames. Final visible main-thread task
time was about 9.5% higher than hidden, and the final run's DPR differed from the
earlier runs. Local-media and playlist changes, SOFT-EYE off, heavy/all-automation
loads, additional refresh rates/hardware, a known-good-release comparison, ETW/GPUView
and full keyboard/screen-reader validation remain open.

See the complete [build record](https://github.com/TheImortalimp/Glitch-Player/blob/v4.2.4-ear-monitor.1/standalone-revision-R-final-4.0/BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05)
and [ordered roadmaps](https://github.com/TheImortalimp/Glitch-Player/blob/v4.2.4-ear-monitor.1/standalone-revision-R-final-4.0/docs/ROADMAP-INDEX.md).
Later implementation and stable-release gates remain blocked.

## Installation, source and licensing

Requires Windows x64, Windows 10 build 19041 or later, .NET Framework 4.8 for the
launcher, and Microsoft Edge WebView2 Evergreen. The .NET 10 player runtime is
bundled. Close the running player before installing. See the
[player README](https://github.com/TheImortalimp/Glitch-Player/blob/v4.2.4-ear-monitor.1/standalone-revision-R-final-4.0/README.md#install-and-uninstall).
This publication does not install the app or replace the maintainer's Downloads copy.

The tested installer was built from archived baseline
`51af585f2a84f5064de3d750ab3d7dd4213307df` plus the monitor patch now recorded by this
tag. Publication documentation did not change its bytes. Rebuilds need not be
byte-identical; use the published asset hash to identify this installer.

Licence: CC0 1.0 for the project; redistributed components retain their notices.
The original repositories and their protections remain unchanged.

> **Photosensitivity warning:** source videos and effects can produce flashing and
> high-contrast flicker. This is not a photosensitivity-safe mode.
