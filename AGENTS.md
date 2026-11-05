# Agent instructions for this bundle

## Planning and change control
- Begin with `standalone-revision-R-final-4.0/docs/ROADMAP-INDEX.md` and `docs/r4.3/TODO-00-MASTER.md`; the ordered R4.3-00, R4.3-01 and R4.3-02 roadmaps and detailed TODOs already exist.
- Follow `ROADMAP-PROMPT.md`: review/challenge the documents, do not alter app code or check off tasks until the maintainer approves. After approval, implement only the next unblocked phase in small, test-backed steps.
- Summarize files changed, risks, and test results. Never claim Windows/WebView2 playback validation unless it was actually run on Windows.
- Treat the YouTube stutter as a user-observed regression with the monitor implicated; its sole root cause is unconfirmed. Follow R4.3-00's A/B/performance gate.

## Project constraints
- Main source project: `standalone-revision-R-final-4.0/`.
- Preserve strict CSP, native host security policies, YouTube origin/message constraints, local-only settings, and current no-telemetry/no-new-network-surface rules.
- Do not tap YouTube audio. Do not bypass Flash/Strobe limits, user confirmations, photosensitivity warnings, reduced-motion behavior, effect locks, cancellation, or ZERO ALL guarantees.
- Generated/guarded files must be updated through their build tools and `--check` mode; do not hand-edit generated glyph tables or manifests.
- Keep LF line endings. The project documents that CRLF checkout conversion can break source-slicing tests.

## Validation
- Windows full build: run `build.cmd` from the R4 project folder. It requires .NET 10, Node 22+, NSIS 3 and Windows packaging tools; Defender may run at the end.
- Individual tests are documented in the project README. Report missing platform tools rather than treating skipped build or playback checks as passes.
- Web and source-level tests do not establish YouTube playback smoothness. Manual WebView2 playback testing is required for performance claims.
