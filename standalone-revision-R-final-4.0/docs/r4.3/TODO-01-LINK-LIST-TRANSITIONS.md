# TODO-01 — Link-List Programming, Track Timing, Glides and Cuts

**Execution dependency:** complete R4.3-00 performance baseline / EAR monitor gate first.  
**Roadmap:** [`ROADMAP-01-LINK-LIST-TRANSITIONS.md`](ROADMAP-01-LINK-LIST-TRANSITIONS.md).  
**Status:** Proposed; all tasks remain open until reviewed and approved.

## 01.0 Approval and baseline

- [ ] Confirm the work branch/repository and approve proposed card groups/order.
- [ ] Confirm visible labels, subtitles, tooltip/accessibility copy, and factual content.
- [ ] Confirm radio-loop, special fade, hidden-card and GHOST confirmation behavior.
- [ ] Complete R4.3-00 EAR/YouTube playback stutter gate before changing transition programming.
- [ ] Record the 12 listed cards plus hidden MISSING LINK as a fixture: DOM id, video/playlist id, display order, label, profile, loop/special action, hidden state.
- [ ] Preserve all 13 card targets and current profile values in a before-refactor snapshot.

## 01.1 Link catalogue data source

- [ ] Approve stable track keys independent of visible labels/HTML IDs.
- [ ] Design versioned `webui/data/tracks.manifest.json` schema (or approved equivalent): target, list type, display order/group, label/subtitle/accessibility description, visibility, playback action, timing, provenance.
- [ ] Decide whether cards are generated from manifest data or remain static HTML checked by a deterministic generator; preserve CSP/no-inline-code policy.
- [ ] Add generator and `--check` verification for manifest schema, duplicate/orphan IDs, HTML order/labels, hidden card and playback-action parity.
- [ ] Update `surfaces.manifest.json` / surface generator only if the card group/order/visibility contract belongs there; avoid duplicating the track catalogue.
- [ ] Add generated catalogue/timing reference documentation and a clear owner for each field.

## 01.2 Proposed normal link-tree order

- [ ] SOFT / IMMERSIVE: 01 NIGHT CITY WALK (`KlcsGjI6Jms`; 1.40/1.40/0.15).
- [ ] SOFT / IMMERSIVE: 02 MOONLIGHT (`B1CL4PqHh9k`; 1.30/1.30/0.20; radio loop).
- [ ] SOFT / IMMERSIVE: 03 TRIPPY FRACTALS (`u4TPBkN0vIc`; 1.30/1.35/0.20; no-audio VJ-loop label).
- [ ] SOFT / IMMERSIVE: 04 TERMINAL 1987 (`gopYmb38DgM`; 1.25/1.25/0.25).
- [ ] FLOW / MID: 05 GHOSTNET.EXE (`8o6bdTOhIyE`; 1.10/1.10/0.40).
- [ ] FLOW / MID: 06 DARKSYNTH RADIO (`NpSTV8WJATc`; 1.20/1.15/0.45; radio loop).
- [ ] FLOW / MID: 07 BIRDCAGE (`PD3RCwNseqQ`; 1.05/1.10/0.55; radio loop; 338 s is first-track duration).
- [ ] FLOW / MID: 08 REVISIONS (`uvSXL6ypLlw`; 0.95/0.90/0.60).
- [ ] ENERGETIC / CUT: 09 SEWERSLVT RADIO (`RgFaK6ZQifE`; 0.85/0.80/0.70; radio loop).
- [ ] ENERGETIC / CUT: 10 GLITCH SET (`QsUmvGkXhnk`; 0.80/0.70/0.80).
- [ ] ENERGETIC / CUT: 11 DEFCON 1 (`jmEAP7aGo0o`; 0.75/0.65/0.85).
- [ ] SPECIAL: 12 WHITE 2 BLACK 2 WHITE (`kCP2xZvhJk0`; 1.15/1.20/0.10; fade loop + current Continual Randomization action only).
- [ ] HIDDEN SPECIAL: MISSING LINK (`DmStNF35o1w`; 1.00/1.10/0.35; deliberate reveal/confirmation remains intact).
- [ ] If order is declined, preserve shipped order while retaining manifest order fields and group labels; do not lose the metadata improvement.

## 01.3 Transition profile resolution

- [ ] Define and document pace, breath, and cut in the schema and UI/docs: pace scales interval (higher = slower); breath scales rest chance (not duration); cut biases eligible visual cut frequency/depth.
- [ ] Preserve current named profile values as migration baseline; do not tune during extraction.
- [ ] Resolve timing from the actual current YouTube video ID/duration after `syncYouTubeNowPlaying`, including every playlist item change.
- [ ] For unknown items use current safe duration classes only: >=480 s long, <=150 s short, otherwise default; missing/zero/invalid duration uses default.
- [ ] Use first-track provenance for known playlist first entries; never treat a first-track duration as total playlist duration.
- [ ] On item/profile change, affect future retarget scheduling only. Do not reset effect alphas/targets, clear locks/cancellations, trigger an immediate cut, or change media time.
- [ ] Local media remains on default timing; no new network lookup, scraping, telemetry, or YouTube audio capture.
- [ ] Keep lights excluded from per-track profile/cut handling.
- [ ] Keep per-voice glide/cut identity, 900 ms per-voice minimum gap, max-two-in-600ms board guard and 0.50–0.95 cut-depth limits (or explicitly approved, tested replacement).

## 01.4 Tests

- [ ] Exactly 12 listed + 1 hidden entry, unique keys/IDs, all expected link targets present once.
- [ ] Group order, public labels, accessibility names, subtitles, hidden state and link target stay synchronized.
- [ ] Loop flags and special action parity for radio playlists and WHITE 2 BLACK 2 WHITE.
- [ ] Hidden MISSING LINK stays hidden through normal list render; explicit reveal/start hook and confirmation remain tested.
- [ ] Every known video ID resolves exactly one profile and no unreferenced timing entry remains.
- [ ] Duration resolver tests valid boundaries at 150 s and 480 s plus invalid/missing/zero data.
- [ ] Playlist test changes current item ID/duration; next timing applies without resetting current targets or forcing cuts.
- [ ] Seeded monotonic tests for pace/breath/cut semantics and all hard-cut guards.
- [ ] Regression tests prove Flash/Strobe never use track cuts and continue through their separate safety/confirmation path.
- [ ] Keyboard, reduced-motion, CSP, Trusted Types, link allow-list and surface-manifest tests pass.
- [ ] WebView2 manual test confirms link launch/loop behavior and smooth playback; include monitor visible/hidden matrix.

## 01.5 Calibrate and ship

- [ ] Run opt-in seeded/local transition histograms for representative calm, mid, high-cut and playlist tracks.
- [ ] Conduct visual A/B review with the same video/effect preset; report current vs proposed values and rationale.
- [ ] Tune one profile at a time only after approval; keep seeded tests stable and update provenance.
- [ ] Confirm transition character is distinct without synchronized bursts or full slider jumps.
- [ ] Regenerate docs and run all web/host/packaging tests plus full Windows x64 build.
- [ ] Update ordered roadmap index and master TODO statuses; add release notes only after measured verification.
