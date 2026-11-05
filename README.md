# Glitch Player

Windows YouTube and local-media playback with a native .NET 10/WebView2 host,
43 effect voices, presets, automation and the EAR/SOFT-EYE engine.

## Download: EAR monitor prerelease

**[Download the Windows x64 installer](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-R4-4.2.4-x64-setup.exe)**

- [Release page and notes](https://github.com/TheImortalimp/Glitch-Player/releases/tag/v4.2.4-ear-monitor.1)
- [Installer checksum](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-R4-4.2.4-x64-setup.exe.sha256)
- [Download the documentation and READMEs](https://github.com/TheImortalimp/Glitch-Player/releases/download/v4.2.4-ear-monitor.1/Glitch-Player-v4.2.4-ear-monitor.1-documentation.zip)

Tag: **`v4.2.4-ear-monitor.1`**. Installer version: **4.2.4**, unchanged.
This is a **prerelease**, not a declaration that every playback regression is resolved.
It fixes unnecessary EAR monitor work without changing EAR processing, effects,
automation, video quality or security settings.

The installer is **44,657,686 bytes**, **unsigned**, and was scanned by the build's
Microsoft Defender guard with no threats reported. Keep Windows security protections
enabled. Older 4.2.4 installers have the same filename; identify this build by its tag
and SHA-256:

```text
f530d6570e6c10b154a4f3368d1998b10bf8a82c732caa692919aff9e3011080
```

**Validation:** 286 tests passed (96 host, 189 web, 1 CAB integration). Native
light-load visible/hidden checks passed; the maintainer reported fullscreen 1080p
as "Sharp and smooth". The wider stress-testing gate remains open; see the
[full evidence and limitations](standalone-revision-R-final-4.0/BUILD_STATUS.md#phase-0-prerelease-candidate-2026-11-05).

> **Photosensitivity warning:** source videos and effects can produce flashing and
> high-contrast flicker. This is not a photosensitivity-safe mode.

## Documentation

- [Player README, installation and controls](standalone-revision-R-final-4.0/README.md)
- [Prerelease notes](standalone-revision-R-final-4.0/docs/r4.3/RELEASE-NOTES-4.2.4-EAR-MONITOR-1.md)
- [Build status and native playback evidence](standalone-revision-R-final-4.0/BUILD_STATUS.md)
- [Changelog](standalone-revision-R-final-4.0/CHANGELOG.md)
- [Security and hardening](standalone-revision-R-final-4.0/SECURITY.md)
- [Ordered roadmaps and TODOs](standalone-revision-R-final-4.0/docs/ROADMAP-INDEX.md)
- [Build from source](standalone-revision-R-final-4.0/README.md#build-from-source)

## About

Glitch Player combines local audio/video and YouTube playback with independently
controlled visual effects, presets, automation and a native Windows shell. EAR
analyzes app-owned local media; YouTube uses a picture-derived visual proxy,
**not captured YouTube audio**.

This repository continues the native player work from
[Glitch-Player-Final-Test-Version](https://github.com/TheImortalimp/Glitch-Player-Final-Test-Version),
preserving its source history. It is separate from the browser-based Glitch-Canvas
project. The original repositories remain unchanged.

Licence: [CC0 1.0](LICENSE). Redistributed components retain their
[third-party notices](standalone-revision-R-final-4.0/THIRD-PARTY-NOTICES.txt).
Historical source-folder and product labels are retained; the current installer
version is 4.2.4.

## Historical releases

The following downloads belong to the archived original repository, not the
monitor-fix prerelease above.

### Revision R Final 4.1

**4.2.4 "Final Confluence"** is the final consolidated release of the Revision R 4.x line, carrying every update
since the r4.2 roadmaps were created (4.1.0 through 4.1.3) plus full voice independence: no voice triggers another's
slider or value, ASCII no longer triggers when R3 ASCII is used, B&W never starts automatically after ZERO ALL, and
only explicit randomization may form confluence pairs.

- [Download the Windows installer from the RELEASE_4.2.4 release](https://github.com/TheImortalimp/Glitch-Player-Final-Test-Version/releases/tag/RELEASE_4.2.4) (`Glitch-Player-R4-4.2.4-x64-setup.exe`, 44,707,295 bytes, silent update 3). Its SHA-256 is `0b18cc42bf1ea1ad3c610fd4e7587f19fc3d48725c6501daf6be37253d2559cc`; compare it before running setup. It is not code-signed, so Windows SmartScreen may warn.
- Silent update 3 fixes the EAR (full listen on YouTube and local media, never starved), adds a hide/show button for the audio and canvas levels monitor, and persists the EAR and auto SOFT-EYE settings.
- Silent update 2 reworked the R3 ASCII voice: the two burst types are totally separated, the soothing small stacks lead, and the wild 006 scatter only strikes at 90-100% of the slider.
- The installer flow is redone: no truncated text, an install-folder page, Final Confluence naming, and **Defender guard rails** — Setup scans everything it installed with `MpCmdRun.exe` and rolls back on any reported threat.
- The installer was built natively on Windows 11 x64 with `build.cmd`; all 272 tests passed (96 .NET host, 175 web, 1 CAB integration) and the build's own Defender guard scanned it clean.
- [Read the 4.1 README](standalone-revision-R-final-4.0/README.md) for the merged effects, presets, building and installing. It includes a photosensitivity warning for the flash and strobe effects.
- [Changelog](standalone-revision-R-final-4.0/CHANGELOG.md), [security and hardening](standalone-revision-R-final-4.0/SECURITY.md), [build status](standalone-revision-R-final-4.0/BUILD_STATUS.md) and [roadmaps beyond 4.1](standalone-revision-R-final-4.0/docs/r4.2-roadmaps/README.md).

### Revision R Final 4.0

Revision 4.0 is a newly coded, hardened Windows app: a .NET 10 host with a locked-down WebView2 view and a per-user NSIS installer. It merges every effect from Revision 3.0, the Glitch Canvas Projector and AI WARP ENGINE into one effects engine and one preset system: 43 effect voices, the AI WARP masters, and 80 MACHINE and 250 LAB built-in presets alongside your own.

This is the **final revised release** of 4.0. Its installer replaces the earlier 4.0.0 builds in the same release; the version number stays 4.0.0.

- [Download the Windows installer from the RELEASE_4.0 release](https://github.com/TheImortalimp/Glitch-Player-Final-Test-Version/releases/tag/RELEASE_4.0) (`Glitch-Player-R4-4.0.0-x64-setup.exe`, 44,706,785 bytes). Its SHA-256 is `1782632d97d6bf15e21176c06119b9faa467dea06ba48e6e99ee653ac89aee26`; compare it before running setup. It is not code-signed, so Windows SmartScreen may warn.
- [Read the 4.0 README](standalone-revision-R-final-4.0/README.md) for the merged effects, presets, building and installing. It includes a photosensitivity warning for the flash and strobe effects.
- [Changelog](standalone-revision-R-final-4.0/CHANGELOG.md), [security and hardening](standalone-revision-R-final-4.0/SECURITY.md) and [build status](standalone-revision-R-final-4.0/BUILD_STATUS.md).

The installer is published as a release asset rather than committed to the repository. You can also build it from source with `build.cmd`.

### Revision R Final 3.0

Revision 3.0 uses the Revision 3 HARD-LIGHT / MOONLIGHT player template with a standalone initialization screen, local MP3/MP4 playback, effect controls, and presets. YouTube playback requires an internet connection.

- [Download the complete portable app](standalone-revision-R-final-3.0-standalone.zip). Extract the ZIP and run `Launch-Standalone-Revision-R-Final-3.0.cmd`.
- [Download the Windows installer](standalone-revision-R-final-3.0-installer.exe).
- [Browse the 3.0 source and packaged files](standalone-revision-R-final-3.0/README.md).

The existing Revision R Final 2.0 package remains available as `standalone-revision-R-final-2.0-standalone.zip`. Its default launcher opens at 1280x720; use Alt+Enter to switch fullscreen/windowed mode.
