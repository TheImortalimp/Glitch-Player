# Roadmap R4.3-01 — Link-List Programming, Track Timing, Glides and Cuts

**Program order:** R4.3-01, after R4.3-00 EAR/YouTube performance gate; before R4.3-02 Full Confluence arbitration.  
**Status:** Proposed. Existing per-track behavior must be preserved until the manifest-backed replacement passes parity tests.  
**Source baseline:** R Final 4.2.4, `51af585f2a84f5064de3d750ab3d7dd4213307df`.

## 1. Objective

Make the YouTube link tree a single, ordered, labelled, testable programming catalogue. Each card must own its stable link identity, public label, subtitle, accessible description, playback behavior, category/order, and per-track transition profile. A selected track's profile should shape **effect retarget pace, breathing-room chance, and soft-to-hard visual effect cuts** in a coherent way.

“Cut” means a bounded jump of an **effect target** in approved hard-cut randomization modes. It must never seek, pause, interrupt, or cut the YouTube video itself. The hard-cut system is not a video editor.

## 2. Current system inventory and drift risk

The link-list definition is currently spread across:

- `webui/index.html`: the card order, DOM IDs, visible names, subtitles, tooltips and the hidden MISSING LINK card.
- `webui/js/glitch-player.js`: `SUGGESTED`, `bindSuggestedStart`, special playlist/loop flags, `TRACK_TIMINGS`, duration-class fallbacks, and hard-cut/breath calculations.
- `webui/data/surfaces.manifest.json`: the link-tree surface, but not authoritative per-card metadata or timing.
- `tests/web/track-timing.test.mjs`: checks timing bounds, cards/profiles, representative soft/hard behavior, and the BIRDCAGE profile.

This creates opportunities for stale labels, orphaned IDs, playback flags drifting from UI, and a timing profile that exists without a visible card. Playlist profile selection must use the **currently playing YouTube video ID and duration** after `syncYouTubeNowPlaying()`, not assume that the first item describes every later playlist item.

## 3. Timing semantics to preserve and document

The current controls have different meanings and must never be conflated:

- **pace (currently 0.75–1.40):** multiplies the next retarget interval; above `1.0` creates more room/slower retargets, below `1.0` retargets sooner. It does not set video playback speed.
- **breath (currently 0.65–1.40):** scales the per-retarget chance of an effect voice taking a breathing rest. It is not a rest duration; current rest bounds remain 1.1–3.4 seconds.
- **cut (0–1):** biases both hard-cut frequency and depth. Current frequency factor is `0.6 + 0.8 × cut`; current depth is `0.5 + 0.45 × clamp(cut + jitter)`, with bounded jitter. The cut cannot jump the whole slider range; current design aims for 0.50–0.95 depth.
- **Voice traits:** each eligible voice has a per-session glide/cut character and odds; there is also a per-voice minimum gap and a board-level confluence guard (at most two close hard cuts). Track profile is a bias, not a command that forces every voice to cut.
- **Lights:** Flash/Strobe do not use track timing or hard cuts; their separate capped/confirmed light automation is unchanged.
- **Unknown videos:** current duration classes are long (≥480 s), short (≤150 s), otherwise default. These are fallbacks, not network lookups. Local media uses defaults.

## 4. Proposed link-list order and labels

Use clear named sections and an easy calm-to-energetic browse order. Preserve every existing target, existing behavior, and the deliberately hidden MISSING LINK. Use the current profile values as the baseline; do not silently retune them during the data migration.

### 4.1 SOFT / IMMERSIVE

| Order | Public label | Current card ID / video ID | Current profile (pace / breath / cut) | Playback notes |
| --- | --- | --- | --- | --- |
| 01 | NIGHT CITY WALK | `suggestedNightCity` / `KlcsGjI6Jms` | 1.40 / 1.40 / 0.15 | Calmest ambience profile |
| 02 | MOONLIGHT | `suggestedMoonlight` / `B1CL4PqHh9k` | 1.30 / 1.30 / 0.20 | Radio playlist; preserve loop behavior |
| 03 | TRIPPY FRACTALS | `suggestedFractals` / `u4TPBkN0vIc` | 1.30 / 1.35 / 0.20 | 4K VJ loop; source is described as no audio |
| 04 | TERMINAL 1987 | `suggestedVideo` / `gopYmb38DgM` | 1.25 / 1.25 / 0.25 | Dev stream |

### 4.2 FLOW / MID

| Order | Public label | Current card ID / video ID | Current profile (pace / breath / cut) | Playback notes |
| --- | --- | --- | --- | --- |
| 05 | GHOSTNET.EXE | `suggestedVideo2` / `8o6bdTOhIyE` | 1.10 / 1.10 / 0.40 | Coding mix |
| 06 | DARKSYNTH RADIO | `suggestedDarksynth` / `NpSTV8WJATc` | 1.20 / 1.15 / 0.45 | Radio playlist; preserve loop behavior |
| 07 | BIRDCAGE | `suggestedBirdcage` / `PD3RCwNseqQ` | 1.05 / 1.10 / 0.55 | Radio playlist; known first-track duration 338 s (5:38), not playlist duration |
| 08 | REVISIONS | `suggestedVideo3` / `uvSXL6ypLlw` | 0.95 / 0.90 / 0.60 | Full album visual |

### 4.3 ENERGETIC / CUT

| Order | Public label | Current card ID / video ID | Current profile (pace / breath / cut) | Playback notes |
| --- | --- | --- | --- | --- |
| 09 | SEWERSLVT RADIO | `suggestedPlaylist` / `RgFaK6ZQifE` | 0.85 / 0.80 / 0.70 | Radio playlist; preserve loop behavior |
| 10 | GLITCH SET | `suggestedYoutube` / `QsUmvGkXhnk` | 0.80 / 0.70 / 0.80 | Live set |
| 11 | DEFCON 1 | `Defcon1Video` / `jmEAP7aGo0o` | 0.75 / 0.65 / 0.85 | Current hardest profile |

### 4.4 SPECIAL / HIDDEN

| Order | Public label | Current card ID / video ID | Current profile (pace / breath / cut) | Required behavior |
| --- | --- | --- | --- | --- |
| 12 | WHITE 2 BLACK 2 WHITE | `testCanvas` / `kCP2xZvhJk0` | 1.15 / 1.20 / 0.10 | Pure-glide profile; loop fade; starts Continual Randomization only as the existing explicit special behavior; never enables Flash/Strobe automation |
| Hidden | MISSING LINK | `ghostLink` / `DmStNF35o1w` | 1.00 / 1.10 / 0.35 | Remains hidden until existing deliberate reveal/confirmation flow; selecting it keeps the GHOST // OF ME start hook and warning behavior |

The label is the visible, user-facing short name. Subtitle and tooltip remain separate fields so they can be revised for clarity/accessibility without using titles as program keys. Do not reorder the hidden card into the normal browse sequence or make it discoverable by accident.

## 5. Data and programming model

### 5.1 One catalogue definition

Create a validated `webui/data/tracks.manifest.json` (or equivalent generated data source) with one entry per card:

- immutable unique `key` (not localized/display text);
- `order`, `group`, `visibility` (`listed` / `hidden`), public `label`, `subtitle`, `accessibleDescription`;
- strict video/playlist identifiers and allowed YouTube target type;
- playback behavior: `single`, `radioPlaylist`, `loopSingle`, or `special`; identify the current loop and special action explicitly;
- timing profile (`pace`, `breath`, `cut`) and the scope it applies to;
- provenance for the timing profile (`curated`, `durationClass`, or `measured`), measurement subject (video vs first track), duration seconds where known, and optional review note;
- default/unknown timing policy and a schema version.

Use stable IDs as join keys. Generate or validate the HTML/card order from this definition; do not duplicate playlist IDs, labels, order or special flags in independent arrays. If static HTML remains hand-authored for CSP/accessibility reasons, add a deterministic `--check` that compares every card's ID/order/label/visibility/playback metadata with the manifest and fails on drift. Do not introduce inline script or event handlers.

### 5.2 Profile resolution

1. At source start, apply the known profile for the selected video ID when one exists.
2. Once the bundled YouTube controller reports the actual current item and duration, resolve the profile again for that item. This matters for playlists, where the first video is not the whole playlist.
3. For an unknown item, use the existing documented duration classes only when duration is valid and stable: long ≥480 s, short ≤150 s, otherwise default. If duration is unavailable/zero, use default, not a guess.
4. On playlist item changes, apply timing for the new item at the next safe retarget. Do not reset effect levels, cancel voices, restart presets, or trigger an immediate cut merely because the profile changed.
5. Local audio/video keeps the current neutral default. No new remote lookup, scraping, audio capture, or telemetry is added.

### 5.3 Cut/glide policy

Keep per-voice transition character as the primary voice identity; track timing biases how quickly the board retargets, how often eligible voices breathe, and the chance/depth of eligible hard cuts. Do not turn `cut` into one global snap or synchronize the board to YouTube seeks or playlist boundaries.

- Track changes apply only to future retarget scheduling; in-flight travel holds its current target and completes under the existing easing rules.
- Profile interpolation is optional. If implemented, only interpolate control parameters over a short documented blend (e.g. 1–2 seconds); never interpolate into a forced cut.
- Keep the current hard-cut modes, min-gap, two-close-cut guard, cut depth ceiling, per-voice odds and light exclusion; move constants to one authoritative definition only after parity tests exist.
- `pace` and `breath` remain bounded and monotonic: larger pace means slower retargets; larger breath means more rests. `cut` remains bounded and monotonic: larger bias may increase allowed cut frequency/depth without exceeding guardrails.

## 6. Implementation sequence and exit criteria

### Step 1 — Freeze the playback and timing baseline

- Preserve the current link order/profile table in fixture data; record current card behavior and exact target IDs.
- Confirm the EAR monitor/YouTube stutter fix from roadmap 00 first, so link-list and transition work is not measured on a known-bad UI baseline.
- Add tests that identify existing profile resolution, playlist looping, special fade, hidden egg, long/short fallback and safe cut behavior before refactoring.

**Exit:** baseline fixture matches the 12 listed and one hidden card, with all current playback behaviors documented.

### Step 2 — Establish one track manifest and generated ordering

- Add `tracks.manifest.json`, schema validation and `node tools/build-tracks-manifest.mjs --check` (or an equivalent narrow tool).
- Use a generated card order or a checked static HTML representation. Keep the CSP and current no-inline-code policy.
- Render accessible group headings and labels in the sequence above; keep actions and controls keyboard accessible.

**Exit:** no orphaned/duplicate cards, no duplicated timing/target flags, check is deterministic, hidden-card contract is tested.

### Step 3 — Move and verify timing resolution

- Make timing profile lookup read the track definition; retain current defaults and profile values.
- Resolve by actual playing video ID for each playlist item; apply duration fallback only where valid.
- Add deterministic tests for each link's profile, order, monotonic profile effects, playlist item switching, and no-reset/no-immediate-cut semantics.

**Exit:** no behavior drift from the baseline except intentional, reviewed label/order presentation; every radio playlist's current item is independently resolved.

### Step 4 — Calibrate transitions and cut character

- Use the named soft/mid/energetic categories as editorial labels; do not automatically modify profile numbers based on category alone.
- Capture transition/cut event histograms in local opt-in test runs for representative tracks. Keep them seeded/reproducible in tests; do not log user media.
- Tune only after user review and A/B visuals; change one profile at a time with before/after numeric values and rationale.
- Check that each profile still feels distinct while cuts remain rare, staggered and never full slams.

**Exit:** track feel is intentional; exact ranges, guards and light exclusions remain test-asserted; no category causes a video seek or playback discontinuity.

### Step 5 — Integrate into Full Confluence and document

- Register track profiles as a named input to the accepted automation/timing arbitration contract.
- Generate the link catalogue/timing reference and add a user-facing explanation of the three parameters.
- Run the complete web/host/packaging suite and Windows/WebView2 playback matrix, including the monitor-hidden/visible stutter regression gate.

**Exit:** generated docs match manifest; build is clean; playback and transition acceptance criteria pass; release notes clearly distinguish measured vs curated timing.

## 7. Required tests and acceptance

- Exactly 12 ordinary visible cards and one hidden card; stable, unique keys, labels, target IDs, order, group and visibility.
- Each label and subtitle maps to the correct target. No missing/inaccessible group name; no `innerHTML`/inline handlers or broadened CSP.
- Loop and special-action flags match current behavior: radio playlists loop, special fade loops and starts Continual Randomization, MISSING LINK stays hidden and confirmed.
- All link profiles resolve and remain within declared bounds; every listed known video has one profile, no stale/unreferenced profile remains.
- Unknown-duration classes behave exactly at 150 s and 480 s boundaries, and handle 0/missing/invalid duration safely.
- Playlist transition test updates current video ID/duration and future timing without resetting voice state or forcing a cut.
- For seeded tests, higher pace delays the next retarget, higher breath raises rest odds, higher cut raises the permitted frequency/depth; none can violate the board/per-voice gap or cut-depth ceiling.
- Lights never read track cut/breath profile. Flash/Strobe caps and confirmations are unchanged.
- Verify special and hidden cards under keyboard navigation, reduced motion, and the existing easter-egg confirmation flow.
- Actual YouTube playback remains smooth with the EAR monitor visible/hidden and under supported refresh rates; track-list tests do not substitute for the roadmap 00 performance gate.

## 8. Risks and decisions

- **Playlist duration ambiguity:** YouTube API reports current video duration, not total playlist duration. Store first-track duration as first-track provenance only; never present it as playlist duration.
- **Metadata unavailable:** stay on default timing until valid current-item data arrives; do not fetch extra metadata.
- **Display order alters user's muscle memory:** confirm proposed calm-to-energetic sections/order before changing the shipped UI; if preserving current order is preferred, retain it in manifest but still group/label all entries.
- **Category conflated with hard-cut severity:** labels describe editorial mood, not guaranteed content or safety. Numeric timing is the actual behavior.
- **Timing tuning masks stutter:** no timing/cut changes may be used to hide the EAR monitor regression. Pass the performance gate first and compare the same automation load.

## 9. Approval checklist

- [ ] Approve the proposed group/order or choose “preserve current order with headings.”
- [ ] Approve short labels, subtitles, and any corrections for factual accuracy.
- [ ] Confirm existing profile values are the migration baseline; tune only in the later calibration step.
- [ ] Confirm radio/loop/special/hidden behaviors before the manifest becomes authoritative.
- [ ] Approve the track-manifest schema and generation strategy.
- [ ] Approve the cut/glide test acceptance and measurement method.
