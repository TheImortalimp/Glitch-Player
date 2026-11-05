# Glitch-Player R4 — Full-Scope Remediation & Confluence Roadmap

- **Target Repository:** `https://github.com/TheImortalimp/Glitch-Player` (`main` @ `db0b29e`, active project `standalone-revision-R-final-4.0/`, baseline tag `v4.2.4-ear-monitor.1`, 189/189 web tests + 3 `--check` manifest/table builders passing)
- **Track Designation:** `R4.3-04` (`docs/r4.3/ROADMAP-04-RANDOMIZATION-AUTOMATION-CONFLUENCE.md`), coordinated with `R4.3-00` (Playback/EAR), `R4.3-01` (Link-List Transitions), `R4.3-02` (Full Confluence), and `R4.3-03` (Rebuilding & Modular Extraction)
- **Subsystems Covered (Full Scope):**
  1. **Preset Randomization** (`MACHINE` 80 deck, `LAB 250` bank, `USER` presets, `-ʁ%AUTO%ʁ-` cycler, `Randomize All`, `Random Seed`, `TEST CANVAS`, `presets.schema.json` & `r4-policy.js`)
  2. **ASCII & Glyph Table Randomization** (`tools/build-glyph-tables.mjs`, `glyph-tables.js`, `glyph-library.js` `SignalGlyphs`, runtime font-support filtering, 13-voice glyph routing, live glyph randomizer/cycler)
  3. **Voice Triggers & Automations** (`Trigger` pulses, `Auto Glitch`, `Continual Randomization`, `Aesthetic Bursts`, `Anti-Washout`, `B&W Sweep`, `Automated Masters`, `AI Video Warp` 30-mode bridge, `GlitchEngine.VOICES`, `ZERO ALL` & cancellation latch)
  4. **Flash & Strobe** (`<= 20%` / `<= 35%` hard ceilings, manual `Trigger` & luminance-stacking fix, `stepLightWander` rest/Soft-Eye cap ordering, `Deepseek-1` & washout-pair fixes, confirmation & `prefers-reduced-motion` parity)
  5. **MilkDrop (`DROP THE MILK?`)** (30-mode `WARP_BLEND`/`WARP_AUX` bridge, composite mode fidelity, master/Hard-Light/Soft-Eye confluence, blur render-budget governor, audio-bass `0` fix, deck controls & seeded shuffle)
  6. **Hardlight (`HARD LIGHT` & `#moon-veil`)** (first-class state API, persistence, preset/lock/`ZERO ALL` integration, MilkDrop & R3 factory awareness, anti-washout & Soft-Eye damping)
  7. **Soft-Eye & EAR (`SOFT-EYE`, Audio/Visual `EAR`, `#earHud`)** (`r3-factories.js` `softEyeK || 1` zero-coercion bug, 43-voice Soft-Eye tables, `dia` B&W cancellation/lock leak, visual/YouTube `EAR` activation & motion proxy without audio capture, source-switch reset)

---

## 1. Non-Negotiable Architecture & Safety Invariants (`AGENTS.md`)

Every phase in this roadmap is strictly bound by the repository's constitutional guardrails:

1. **Offline & Strict CSP:** Keep `default-src 'none'` (`webui/index.html`, `host/AppPolicy.cs`) intact. Zero runtime network fetches, external fonts, CDN scripts, or telemetry.
2. **No YouTube / Loopback Audio Capture:** Never capture YouTube audio, desktop loopback, tab audio, or hidden WebView2 media streams (`host/CaptureGuard.cs`). YouTube `EAR` reactivity must strictly derive from legal `YT.Player` playback state/timing/rate, deterministic track envelopes, and local board/warp cadence.
3. **Photosensitivity Hard Ceilings & Consent:**
   - `Flash` is hard-capped at **`0.20` (`20%`)** and `Strobe` at **`0.35` (`35%`)** across **effective on-screen luminance**, sliders, presets (`USER`, `MACHINE` including `Deepseek-1`, `LAB`, `GHOST // OF ME`), `Trigger` pulses, and automated wander.
   - Automatic `Flash` & `Strobe` movement (`lightAutomationOn`) and `GHOST // OF ME` (`Ctrl+Alt+G`) remain gated behind explicit `window.confirm(...)` photosensitivity warnings and default **OFF** on every launch.
   - `prefers-reduced-motion: reduce` must degrade every animated canvas, shader, MilkDrop, Soft-Eye hue spin, and overlay path to calm/static frames.
4. **Strict Voice Independence:** Never re-couple core voices (`X`) and Revision-3 twins (`R3 X`). Updating, triggering, or tuning one voice never secretly moves its twin unless an explicit multi-voice preset or board-wide randomizer selects both independently.
5. **Lock Hierarchy:** User-clicked locks (`sliderLocks[k]` without `presetLockKeys.has(k)`, plus `voiceFxLocks`) are **hard** across presets, glides, bursts, sweeps, and randomizers. Preset-applied locks live in `presetLockKeys` and release cleanly on the next preset load.
6. **`ZERO ALL` & Cancellation Latch (`R4.1.3`):** `ZERO ALL` (`zeroAllEffects`) and dragging a voice to `< PARKED_EFFECT_EPSILON` (`0.005`) latch `userCancelled[name] = true`. **Zero** background paths (including `autoGlitchInstances`, `autoGlitchSparks`, `aestheticBurstStep` dip-release, `stepBwSweep`, and `softStep` `dia` bursts) may raise or paint a cancelled voice until explicit user intent (`slider > 0`, `Trigger`, `Preset`, `Randomize All`, `Random Seed`, `TEST CANVAS`) wakes it.
7. **Build & Harness Compatibility:** Preserve LF (`\n`) line endings, keep `tools/build-glyph-tables.mjs --check`, `tools/build-effects-manifest.mjs --check`, and `tools/build-surfaces-manifest.mjs --check` green, and preserve function/declaration slicing anchors required by `tests/web/*.test.mjs` until modular imports replace source slicing (`R4.3-03`).

---

## 2. Verified Root-Cause Audit Across the Codebase (`db0b29e`)

### 2.1 Preset & Board Randomization Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **PR-01** | `webui/js/glitch-player.js:9001–9005` (`buildMachinePresets`) | `FX` array hardcodes only **17 legacy R2 voices**. All **17 `R3 *` voices** and all **9 AI-Warp voices** (**26 of 43 voices**) are omitted and initialized to `0`. When `applySettings` (`9366`) loads any `MACHINE` preset, all 26 omitted voices are latched `crParked = true` and `userCancelled = true`. | 60% of the engine's 43 voices never appear in any `MACHINE` (`Deepseek-1..80`) preset and are permanently silenced against automation after loading one. |
| **PR-02** | `webui/js/glyph-library.js:2` (`MACHINE_PRESET_DATA`) & `glitch-player.js:9116, 9200` (`mapLabSnapshot`) | `LAB 250` touches only 19 voice keys (3 remapped via `LAB_EFFECT_ALIASES`), leaving **24 voices at `0`** across all 250 snapshots (`R3 Tech Artist`, `R3 HSL Rainbow`, `R3 ASCII`, `R3 Font Burn`, `R3 Data Bands`, `R3 VHS Glitch`, `R3 B&W Invert`, `R3 Hue/Color Cycle`, `Chromatic Echo`, `Temporal Slices`, etc. are `0` in **all 330 built-in `LAB + MACHINE` presets**). | 10+ R3/AI-Warp voices are dead across every built-in preset bank in the application. |
| **PR-03** | `glitch-player.js:9094–9114` vs `glyph-library.js:2` | Cross-bank state bleed during `-ʁ%AUTO%ʁ-` (`presetAutoStep`, `9690`): `MACHINE` presets omit `glyphBank` (`undefined`) and `voiceFx`, while `LAB 250` presets omit `ghostMode`, `ghostLevel`, `vsyncMode`, `vsyncLevels`, `masterControls`, and `voiceFx`. | Alternating `LAB` ↔ `MACHINE` leaks `LAB`'s last glyph table (often tofu) into every `MACHINE` preset, and leaks `MACHINE`'s Ghost/V-Sync/Master state into every `LAB` preset. |
| **PR-04** | `webui/js/glitch-engine.js:886–982` vs `glitch-player.js:9001–9115` | Two diverged `buildMachinePresets` implementations exist: `glitch-engine.js` uses 34 obsolete `' GC#(3)'` voice names, `Flash`/`Strobe` up to `0.27` (`> 0.20` Flash cap), and emits `toggles.timedAutomation`/`toggles.softEyeMode` rejected by `presets.schema.json`; `glitch-player.js` shadows it with the 17-voice version. Both use biased `.sort(() => rng() - 0.5)` instead of Fisher-Yates. | Dead/divergent engine API, biased voice selection (early alphabetical voices over-sampled), and schema-invalid engine output. |
| **PR-05** | `webui/data/presets.schema.json:52–75` & `webui/js/r4-policy.js:121–175` | `presets.schema.json` sets `additionalProperties: false` on `voiceFx` (allowing only `bwInvert`/`hueOffset`) and `toggles` (allowing only 4 booleans), and omits optional `hardLight`, `milk` (`active`/`presetId`/`opacity`), `glyphAuto`, and `machineSeed`. | Schema & `R4Policy.validPresetSettings` cannot represent or validate full R4 board snapshots when exported/imported. |
| **PR-06** | `glitch-player.js:8326–8355` (`randomizeBoard`) & `8780–8812` (`bindTestCanvas`) | `randomizeBoard` ("Randomize All" button!) **never calls `setEffectCancelled(name, ...)` or updates `crParked[name]`** (unlike `applyRandomSeed` at `8374`). After `ZERO ALL`, clicking **Randomize All** sets `randomTargets`, glides voices briefly, and on the next CR retarget (`7924`) snaps every voice right back to `0` because `userCancelled[name]` stayed `true`! Furthermore, `randomizeBoard` assigns random `[0.03..1.0]` to **all 41 non-light voices at once** (instant mud/washout) instead of a curated voice count, and ignores `SignalGlyphs`, `milk`, and `hardLight`. `bindTestCanvas` likewise sets `effectAlphas` (`8798`) without clearing `userCancelled`/`crParked`. | **Randomize All** is broken after `ZERO ALL`, produces 41-voice full-board washout when uncancelled, and `effect-cancellation.test.mjs:66` misidentified `applyRandomSeed` as `Randomize All`. |
| **PR-07** | `glitch-player.js:8357–8381` (`applyRandomSeed`) & `8984` (`freshMachineSeed`) | `applyRandomSeed(seed)` feeds float `0..1` directly into `(s * 9301 + 49297) % 233280` (`seed = 0.500` vs `0.501` yields initial `s` differing by `0.001`, producing nearly identical boards across adjacent slider ticks), calls `GlitchEngine.confineTarget(...)` **without passing `rng`** (falling back to non-deterministic `Math.random()` inside `confineTarget`!), drives all 41 voices simultaneously, and never seeds `SignalGlyphs` or `MACHINE` deck replay in UI. | `Random Seed` slider is non-deterministic (`Math.random()` leak!), correlated across adjacent steps, washes out all 41 voices, and offers no UI way to view/pin `buildMachinePresets.lastSeed`. |

### 2.2 ASCII & Glyph Table Randomization Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **AG-01** | `tools/build-glyph-tables.mjs:78–145`, `webui/js/glyph-tables.js`, `webui/js/glyph-library.js` | `SignalGlyphTables` ships 125 Unicode 15.1.0 + CP437 blocks including ancient/supplementary planes (`Linear B`, `Ugaritic`, `Old Persian`, `Cuneiform`, `Egyptian Hieroglyphs`, `Anatolian Hieroglyphs`, `Phaistos Disc`, `Meroitic`, `Linear A`, `Siddham`, `Tangut`, `CJK Unified Ext B–G`) with **zero runtime font-coverage probe**. Windows 10/11 WebView2 lacks system fonts for ~35 of these blocks, rendering missing-glyph `.notdef` boxes (`□` tofu) across `LAB 250` and `All scripts`. | Frequent `.notdef` tofu rectangles whenever `LAB 250` or `All scripts` selects unfonted scripts. |
| **AG-02** | `webui/js/glyph-library.js:15–26` (`VOICE_OFFSETS`) & `glitch-player.js:3430, 4160` | `SignalGlyphs.VOICE_OFFSETS` routes only **9 voices** (`ASCII`, `R3 ASCII`, `Matrix ASCII`, `R3 Matrix ASCII`, `Matrix Chord`, `R3 Matrix Chord`, `Cyber Rain`, `Data Bomb`, `R3 Data Bomb`), omitting **4 glyph-bearing voices**: `Ink Glyphs` (hardcoded `INK_ALPHA` + `INK_SIGIL` at `4160`), `R3 Ink Glyphs`, `Font Burn` (`3430`), and `R3 Font Burn` (`r3-factories.js`). | Selecting or randomizing an ASCII/glyph table leaves 4 of the 13 text/glyph voices stuck on hardcoded alphabets. |
| **AG-03** | `webui/js/glyph-library.js:48–62` (`buildSet` for `'All scripts'`) | `'All scripts'` samples 8 characters per table **once** on selection using unseeded `Math.random()` and caches that static pool until manual bank change; unfonted tofu tables pollute ~30% of the pool. | `'All scripts'` is non-reproducible, never refreshes over time, and mixes `.notdef` tofu into every glyph voice. |
| **AG-04** | `glitch-player.js:4305–4455` (`Matrix ASCII`, `Matrix Chord`) & `2365` (`cyberRainFactory`) | `Matrix ASCII` and `Matrix Chord` cache `col.chars` at column spawn and never check `SignalGlyphs.version`, leaving stale glyphs on screen for many seconds after a glyph table switch. Conversely, `cyberRainFactory` (`2365`) calls `pickFor` on every cell every frame (`O(cols * rows * 60fps)`) and bails out completely (`return`) if `!window.SignalGlyphs`. | Sluggish/stale glyph transitions in Matrix voices, unnecessary per-frame GC/CPU churn in `Cyber Rain`, and brittle null-guard behavior. |
| **AG-05** | `webui/index.html:212–218` & `glitch-player.js` (entire file) | **Zero ASCII/glyph table randomization exists anywhere in runtime:** `#glyph-bank` has no `Randomize` button, no `Auto-Cycle` toggle, and no `<LOCK!>` button; `buildMachinePresets`, `randomizeBoard`, `applyRandomSeed`, `stepContinualRandomization`, and `presetAutoStep` never roll or cycle `SignalGlyphs`. | Users have no way to randomize, lock, or auto-cycle ASCII/glyph tables—only manual dropdown clicks or `LAB 250` side effects. |

### 2.3 Voice Triggers, Automations & `ZERO ALL` Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **VA-01** | `glitch-player.js:8268–8318` (`autoGlitchStep`) & `2595` (`r3Factory`) | `autoGlitchStep` pre-instantiates 37 persistent `autoGlitchInstances` (every voice except `Flash`/`Strobe`) and runs them **every frame `isAutoGlitching` is ON**, completely ignoring `isEffectCancelled(name)` and `sliderLocks[name]`! Worse: `headroom = Math.max(0.18, 1 - base * 0.75)` (`8283`) gives voices at `base === 0` (cancelled/zeroed!) **maximum strength (`1.0`)**, and `autoGlitchSparks` (`8300`) also ignores `isEffectCancelled` and `sliderLocks`! Additionally, `r3Factory` (`2595`) wraps a **single shared stateful `r3Runners[idx]`**, so running `continuousEffectCache` + `autoGlitchInstances` + `triggerTimedEffect` steps the same R3 particle/grid state **2×–3× per frame**! | Turning `Auto Glitch` ON after `ZERO ALL` or on a 1-voice preset blasts all 37 cancelled & locked voices onto the canvas and double-steps R3 physics! |
| **VA-02** | `glitch-player.js:5934–5946` (`triggerTimedEffect`) & `5905` (`effectLiveStrength`) | Clicking `Trigger` on a voice with slider `0` **permanently mutates `effectAlphas[def.name] = 0.5`** (never restoring `0` after `duration`, so `updateContinuousEffectsCache` keeps it on forever!), ignores `sliderLocks` and `isEffectCancelled` intent cleanly, double-renders on top of `continuousEffectCache`, and `effectLiveStrength` (`5909`) forces `pulseFloor = 0.2..0.4` while ignoring `masterOpacity === 0` and `masterControls.effectIntensity === 0`! | A "2-second Trigger" permanently turns `0`-level voices on at `50%`, stacks duplicate renderers (`2×` alpha), and paints even when Global Opacity is `0%`! |
| **VA-03** | `glitch-player.js:10446–10456` (`aestheticBurstStep` `'dip'` exit) & `10185–10345` (`AESTHETIC_GROUPS`) | 1) In `'dip'` release (`10449`), `allEffects.forEach` overwrites `randomTargets[name]` **without checking `isEffectCancelled(name)`, `isManualLight(name)`, or `crParked[name]`**, waking cancelled/parked voices and mutating `Flash`/`Strobe` targets! 2) `AESTHETIC_GROUPS` (15 groups) includes **only 1 of 17 `R3 *` voices** (`R3 Ghost Spectrum`) and **4 of 9 AI-Warp voices**, starving 21 modern voices from curated bursts. | Cancelled/parked voices leak back to ambient `0.02–0.15` after burst dips, and 16 of 17 R3 voices never participate in aesthetic bursts. |
| **VA-04** | `glitch-player.js:6275–6345` (`stepBwSweep`) | `stepBwSweep(now)` runs unconditionally in `frame()` (`10715`) whenever `B&W Invert` is not cancelled—**even when `Continual Randomization`, `Auto Glitch`, and `Automated Masters` are ALL `OFF`**—and ignores `voiceFxLocks.bwInvert`! | Unsolicited 14–45s B&W inversion sweeps hijack manual boards when all automations are switched OFF. |
| **VA-05** | `glitch-player.js:8456–8492` (`zeroAllEffects`) | `ZERO ALL` leaves **7 active systems running**: `presetAutoActive` (`-ʁ%AUTO%ʁ-` re-loads a preset seconds later!), `isAiWarpActive`, `ghostActive`/`ghostModeIndex`, `vsyncModeIndex`, `body.hard-light`, active `Trigger`/`autoGlitchSparks` closures in `activeEffects`, and `SOFT.gate`/`SOFT.burst` (plus leaves `SOFT.cresc` in `'release'` instead of `'calm'`, and leaves `lightStored` non-zero). | Clicking `ZERO ALL` fails to truly silence the stage; presets, AI Warp, Ghost, V-Sync, timed triggers, or Soft-Eye bursts keep painting or restart effects moments later. |
| **VA-06** | `glitch-engine.js:238–256` (`VOICES`), `glitch-player.js:7580` (`VOICE_TRANSITION`), `7196` (`AI_WARP_MODES`), `2612` (`syncR3Engine`) | 1) `GlitchEngine.VOICES` defines realm confine bands for only **17 of 43 voices** (26 voices hit generic `[0.10, 0.90]` fallback). 2) `rerollSomeVoiceTraits` (`7606`) only re-rolls keys of `VOICE_TRANSITION` (skipping 15 `R3 *` twins). 3) `AI_WARP_MODES` (`7196`) picks from only **5 modes** (`aurora`, `prism`, `scan`, `crt`, `void`) while `r3-ghost-vsync.js` defines **30 `WARP_BLEND` modes**, `syncR3Engine` (`2612`) leaves `engine.aiWarpMode` stuck at `'aurora'`, and sets `engine.audioDrive.drive = videoPalette.energy` instead of live `EAR` drive! | 25 of 30 AI Warp modes are unreachable dead code, 26 voices lack realm confinement, and R3 voices miss live `EAR` audio drive and trait re-rolls. |

### 2.4 Flash & Strobe Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **FS-01** | `glitch-player.js:5934–5945` (`triggerTimedEffect`) | 1) `if (isManualLight(def.name) && !lightAutomationOn) return;` blocks manual `Trigger` clicks on `Flash`/`Strobe` when automatic wander is OFF—contradicting the manual-output contract. 2) When `lightAutomationOn` IS ON (or once fixed for manual `Trigger`), pushing a second factory instance onto `activeEffects` while `continuousEffectCache['Flash']` is active **doubles on-screen luminance (`2 × 20% = 40%` Flash, `2 × 35% = 70%` Strobe)** via `'screen'`/`'lighter'` compositing, breaching the photosensitivity cap! | Manual `Trigger` on `Flash`/`Strobe` is broken when switch is OFF, and breaches the `20%`/`35%` screen-emission ceiling when switch is ON. |
| **FS-02** | `glitch-player.js:4940–4949` (`stepLightWander`) & `glitch-engine.js:246–247, 308` (`confineTarget`) | `stepLightWander` calls `eng.confineTarget(name, t, ...)` **after** rolling `lt.rest` (`t = 0`) and **after** `eng.softCap(name, t, softK())` (`0.02` in Soft-Eye calm). Because `VOICES.Flash.virtual = [0.10, 0.85]` and `VOICES.Strobe.virtual = [0.12, 0.90]`, `confineTarget` sees `t < band[0]` and **lifts `0` and `0.02` back up to `0.045–0.12`**! Also uses unseeded `Math.random()`. | `Flash` and `Strobe` **never rest at `0`** during `lt.rest` rolls, and **exceed Soft-Eye's `0.02` calm cap by `5×–6×`** whenever AI Warp, virtual Ghost, or `B&W > 50%` is active! |
| **FS-03** | `glitch-player.js:9026–9039` (`buildMachinePresets` `Deepseek-1`) & `10020–10026` (`WASHOUT_PAIRS`) | 1) `Deepseek-1` (`i === 0`) stores raw `Flash: 0.32, Strobe: 0.40` (both above cap and simultaneous) because `balanceMachineLight` is skipped for `i === 0`. 2) In `WASHOUT_PAIRS`, `['Flash', 'Strobe', 1.20]`, `['Flash', 'HSL Rainbow', 1.40]`, and `['B&W Invert', 'Flash', 1.30]` are **mathematically unreachable** (`0.20 + 0.35 = 0.55 < 1.20`; `0.20 + 1.00 = 1.20 < 1.40`), and `antiWashoutStep` mutates `effectAlphas` directly instead of `lightWanderTarget`. | Uncapped raw light values in `Deepseek-1` (skewing `presetBusy`) and dead washout protection for `Flash + Strobe`, `Flash + HSL Rainbow`, and `B&W + Flash`. |

### 2.5 MilkDrop (`DROP THE MILK?`) Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **MD-01** | `glitch-player.js:5533–5545` (`milkBlendProfile`) | Hardcodes `const modeKey = isAiWarpActive ? 'aurora' : '';`, ignoring active AI Warp mode and orphaning **29 of the 30 `WARP_BLEND` & `WARP_AUX` profiles** in `r3-ghost-vsync.js:23–115`. | 97% of the authored MilkDrop × AI-Warp blend/aux engine never executes. |
| **MD-02** | `glitch-player.js:5603–5723` (`renderMilkdrop`) | Line `5718` hardcodes `gctx.globalCompositeOperation = 'source-over'`, **discarding `preset.composite` (`'screen'`, `'lighter'`, `'soft-light'`)** defined on all 80 MilkDrop presets (`MILK_FAMILIES`, `5415–5424`)! Also ignores `masterOpacity`, `masterControls.effectIntensity`, `prefers-reduced-motion`, live `body.hard-light`, and `softK()`/`SOFT.enabled` calm damping. | MilkDrop paints opaque mud (`source-over`) instead of additive/screened light, ignores Global Opacity (`0%` still paints MilkDrop!), and ignores Reduced Motion & Soft-Eye. |
| **MD-03** | `glitch-player.js:5668–5705` (`renderMilkdrop`) | Executes **two unbudgeted full-canvas `mctx.filter = 'blur(...)'` passes per frame** (one feedback blur + one blur **inside** the radial petal `fill()` loop!), completely ignoring `QUALITY_TIERS` / `renderBudget`! Also line `5642` uses `(es.bass || drive)` which treats legitimate silence (`es.bass === 0`) as falsy and substitutes synthetic `drive`, and line `5617` calls synchronous `localStorage.setItem` (`saveVoiceFxControls()`) inside `requestAnimationFrame` every 18s auto-advance! | Severe GPU/CPU frame drops on 1080p/4K displays, false bass pumping during silent audio passages, and main-thread storage stalls inside RAF. |
| **MD-04** | `glitch-player.js:5490–5525` (`orderMilkDeck`) & `index.html:196` | Uses unseeded `Math.random()` in `orderMilkDeck`, has no MilkDrop preset selector / `Prev` / `Next` / `Hold (Pin)` UI (`DROP THE MILK?` is a single blind ON/OFF toggle), and `randomizeBoard` / `randomizeVoiceFx` ignore `milk` even when unlocked. | Users cannot pick, step, hold, or deterministically seed any of the 80 MilkDrop presets. |

### 2.6 Hardlight (`HARD LIGHT` & `#moon-veil`) Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **HL-01** | `glitch-player.js:8683–8694` (`bindHardLight`) | `let on = false;` is trapped inside `bindHardLight`'s local IIFE closure. There is **no** module-scoped `isHardLightActive` state, **no** `setHardLight(on)` API, **no** `localStorage` persistence, **no** lock button, **no** preset capture/apply (`captureSettings`, `normalizePresetSettings`, `applySettings`, `presets.schema.json`), and `zeroAllEffects` cannot turn it off! | `HARD LIGHT` is an isolated DOM class toggle invisible to presets, `ZERO ALL`, persistence, and the rest of the engine. |
| **HL-02** | `webui/css/glitch-player.css:1352–1368` & `glitch-player.js:2575, 5603, 10020` | `body.hard-light #moon-veil` applies full-viewport `mix-blend-mode: overlay; opacity: 1` multi-gradient bloom at `z-index: 6` over `#effects-wrapper`, but `renderMilkdrop`, `syncR3Engine` (`r3-factories.js`), `antiWashoutStep`, and `SOFT-EYE` calm mode are completely blind to it. When `HARD LIGHT` + `MilkDrop` + `Flash`/`Strobe` or `HSL Rainbow` stack, highlights clip/blow out with zero washout or Soft-Eye protection. | Uncontrolled highlight blowout and photosensitivity/contrast spikes when `HARD LIGHT` combines with MilkDrop, R3 voices, or lights. |

### 2.7 Soft-Eye & EAR (`SOFT-EYE`, Audio/Visual `EAR`, `#earHud`) Defects

| ID | Location | Verified Defect | Impact |
| --- | --- | --- | --- |
| **SE-01** | `webui/js/r3-factories.js:2691` (`createR3Voices`) | **`const softK = engine.softEyeK || 1;`** — JavaScript's `||` operator treats `0` (Soft-Eye's **entire calm baseline**, 90%+ of runtime!) as falsy and evaluates to **`1` (full wild crescendo)**! | **Catastrophic inversion:** all 15 `R3 *` canvas voices run at `100%` wild crescendo intensity throughout Soft-Eye calm! |
| **SE-02** | `webui/js/glitch-engine.js:495–545` (`SOFT_EYE`) & `glitch-player.js:3542` (`CHROMA_VOICES`) | `SOFT_EYE.busyVoices`, `SOFT_EYE.calmCaps`, `SOFT_EYE.paintCalm`, and `CHROMA_VOICES` list only legacy R2 voices, omitting **all 17 `R3 *` voices** and `Cyber Rain` (plus 8 other AI-Warp voices in `calmCaps`/`paintCalm`). | `GlitchEngine.softCap(name, v, 0)` and `softPaintK(name, 0)` return unthrottled `1.0` for all `R3 *` voices, defeating Soft-Eye calm caps whenever R3 voices are active. |
| **SE-03** | `glitch-player.js:1661–1671` (`softStep` `dia` burst) & `8456` (`zeroAllEffects`) | During a `dia` burst gate (`gate.kind === 'dia'`), `softStep` unconditionally writes `effectAlphas['B&W Invert']` and `randomTargets['B&W Invert']` (`0.68..0.80`), **bypassing `isEffectCancelled('B&W Invert')`, `ZERO ALL`, and `voiceFxLocks.bwInvert`**! Also `zeroAllEffects` never resets `SOFT.gate` (`SOFT.burst` stays `> 0`) and calls `SOFT.cresc.release(now)` instead of hard-parking `SOFT.cresc` to `'calm'` (`k = 0`). | After `ZERO ALL` or cancelling `B&W Invert`, a Soft-Eye `dia` burst suddenly blasts the screen into 75% negative B&W emission inversion! |
| **SE-04** | `webui/js/glitch-engine.js:642–653` (`createEar.feedVisual`), `678` (`createCrescendo`), `762` (`createBurstGate`) | `createEar.feedVisual` hardcodes **`st.active = false`**! Both `createCrescendo.step` (`var active = earState && earState.active`) and `createBurstGate.step` (`if (!earState || !earState.active) return`) require `earState.active === true`! | **Visual `EAR` is 100% disconnected from Crescendo beat-hits and BurstGate triggers!** On `TEST CANVAS`, silent/untapped video, and **all YouTube playback**, `SOFT.gate` never fires once and `SOFT.cresc` ignores visual energy/motion completely! |
| **SE-05** | `glitch-player.js:1208–1265` (`samplePaletteNow`) & `1595–1618` (`softStep`) | `samplePaletteNow()` returns early on YouTube (`nowPlaying.kind === 'youtube'` matches none of `testCanvasActive`, `local-video`, `local-audio`), leaving `videoPalette` frozen at `PALETTE_FALLBACK` (`energy: 0.35, motion: 0.12`). Thus `SOFT.earVis.feedVisual(videoPalette.energy * 1.25, videoPalette.motion * 1.3)` feeds a **constant `0.4375 / 0.156` every frame forever** on YouTube! | `#earHud` meters (`LVL`, `BASS`, `MID`, `TREB`, `BLD`) sit frozen flat on every YouTube track despite the `4.2.4` `yt ? 1.25 : 1` multiplier. |
| **SE-06** | `glitch-engine.js:585–660` (`createEar`) & `glitch-player.js:845, 1480, 8780` | `createEar` has no `reset()` method; switching sources (`Local MP3/MP4` ↔ `YouTube` ↔ `TEST CANVAS`) leaves stale `peakHold`, `warm`, `ready`, `build`, and `hist` ring-buffer values from the previous source, causing either 10–30s deafness (if switching loud → quiet) or instant false bursts (if switching quiet → moderate). | Cross-source `EAR` threshold contamination on every media switch. |

---

## 3. Phased Execution Architecture & Dependency Order

```
Phase 0: Deterministic PRNG, Complete 43-Voice Engine Tables & State Primitives
   ├──► Phase 1: ASCII / Glyph Table Font-Guard, 13-Voice Routing & Table Randomizer
   ├──► Phase 2: Preset Schema v4, 43-Voice MACHINE + LAB Hygiene & Board/Seed Randomizers
   ├──► Phase 3: Flash / Strobe Safety Ceilings, Manual Trigger & Wander Ordering
   ├──► Phase 4: Voice Triggers, Auto Glitch Singleton/Cancel Fix, Bursts, Sweep & ZERO ALL
   └──► Phase 7: EAR Reset, Visual/YouTube Reactivity & 43-Voice Soft-Eye Confluence
            └──► Phase 5 & Phase 6: Hardlight First-Class State + MilkDrop 30-Mode & Budget Confluence
                     └──► Phase 8: Manifests, Regression Suite (250+ Tests) & Native Host Verification
```

---

### Phase 0 — Deterministic PRNG, 43-Voice Engine Tables & Shared Primitives

**Goal:** Establish one canonical seeded PRNG utility, complete all 43-voice metadata tables in `GlitchEngine`, and expose clean board-state primitives before touching individual randomizers or automations.

1. **Canonical Seeded PRNG (`GlitchEngine.prng` in `webui/js/glitch-engine.js`):**
   - Expose `GlitchEngine.hashSeed(input)` (32-bit `murmur3`/`xmur3` avalanche mixer accepting uint32, float `0..1`, or string so adjacent slider steps `0.500` vs `0.501` avalanche to completely uncorrelated 32-bit states), `GlitchEngine.mulberry32(seed32)`, and `GlitchEngine.fisherYates(array, rng)` (unbiased in-place/copy shuffle replacing every `.sort(() => rng() - 0.5)` in the repo).
   - Thread optional `rng` parameter cleanly through `GlitchEngine.confineTarget(name, value, ctx, rng)` (`glitch-engine.js:295`) and ensure every caller (`applyRandomSeed`, `buildMachinePresets`, `stepLightWander`, `retargetRandomization`) passes its `rng` when deterministic output is required.
2. **Complete `GlitchEngine.VOICES` (`glitch-engine.js:238`) for All 43 Manifest Voices:**
   - Expand `VOICES` from 17 to **all 43 voices** in `webui/data/effects.manifest.json`:
     - Add all 9 AI-Warp voices (`Chromatic Echo`, `Temporal Slices`, `Signal Tear`, `Cyber Rain`, `Prism Rift`, `Orbit HUD`, `Rolling Scan`, `Tape Grain`, `Tracking Tear`) with calibrated `realm` (`'reality'` for `Rolling Scan`/`Tape Grain`/`Tracking Tear`; `'virtual'` for `Cyber Rain`/`Orbit HUD`/`Prism Rift`; `'mix'` for `Chromatic Echo`/`Temporal Slices`/`Signal Tear`) and `[min, max]` bands.
     - Add all 17 `R3 *` voices (`R3 Neon Grad` .. `R3 V-Sync`, `R3 B&W Invert`, `R3 Hue/Color Cycle`) with independent band definitions aligned to their physical/virtual character—**without coupling runtime state** to their core counterparts.
   - Clamp `VOICES.Flash` bands to `reality: [0.00, 0.20], virtual: [0.00, 0.20]` and `VOICES.Strobe` bands to `reality: [0.00, 0.35], virtual: [0.00, 0.35]` so `confineTarget` can **never** propose a pre-clamp target above safety caps or force a `0` floor onto resting lights.
3. **Complete `VOICE_TRANSITION` (`glitch-player.js:7580`) for All 41 Non-Light Voices:**
   - Explicitly list all 41 non-light voices (including all 17 `R3 *` voices) so `rerollSomeVoiceTraits()` (`7606`) samples across all 41 voices uniformly instead of ignoring 15 `R3 *` voices.

- **Exit Criteria:** `GlitchEngine.VOICES` keys match `effects.manifest.json` 1:1 (43 voices); `fisherYates` statistical chi-square uniformity test passes; `hashSeed(0.500)` and `hashSeed(0.501)` have Hamming distance `>= 10` bits.

---

### Phase 1 — ASCII / Glyph Table Font-Guard, 13-Voice Routing & Randomization

**Goal:** Eliminate `.notdef` tofu boxes on Windows/WebView2, route all 13 text/glyph voices through `SignalGlyphs`, fix stale/churning glyph caches, and add full manual, seeded, preset, and auto-cycled ASCII/glyph table randomization with lock support.

1. **Runtime Canvas Font-Coverage Probe (`webui/js/glyph-library.js`):**
   - Keep `tools/build-glyph-tables.mjs` and `webui/js/glyph-tables.js` 100% deterministic and pinned to Unicode 15.1.0 + CP437 SHA-256 hashes (`--check` stays untouched).
   - At `SignalGlyphs` boot in browser/WebView2 (when `document.createElement('canvas')` has a real 2D context; bypassed cleanly in headless Node unit stubs), run a fast (< 8 ms total, 24×24 offscreen `Uint32Array` pixel signature comparison against `U+FFFD` / `U+FFFF` `.notdef` reference glyph using the exact HUD/canvas font stack `"Courier New", "Segoe UI Symbol", "Segoe UI Historic", "Microsoft YaHei", "Malgun Gothic", monospace`) sampling 3 representative code points per table.
   - Partition tables into `SignalGlyphs.renderableNames` (verified font support on host OS) vs `SignalGlyphs.unfontedNames` (flagged in `<option>` label with `[no system font]` or hidden from random pools).
   - **Rule:** Every automatic/random glyph picker (`All scripts`, `SignalGlyphs.randomize`, `MACHINE` preset generator, `LAB 250` fallback, `landing-backdrop.js`) **exclusively** draws from `SignalGlyphs.renderableNames` (falling back to all `names` only in headless Node tests where canvas probe is stubbed). If a preset requests an unfonted table on the current machine, `SignalGlyphs.set(name, { fallbackRenderable: true })` maps deterministically (`hashSeed(name) % renderableNames.length`) to a renderable script table when `fallbackRenderable` is enabled, eliminating `.notdef` tofu in `LAB 250`!
2. **Expand `SignalGlyphs` Routing from 9 to All 13 Glyph Voices (`glyph-library.js:15`, `glitch-player.js:3430, 4160`, `r3-factories.js`):**
   - Update `VOICE_OFFSETS` to cover all **13 glyph-rendering voices** with distinct coprime/spread offsets across `renderableNames` so no two glyph voices share a table when a single script bank is chosen:
     1. `ASCII` (`0`), 2. `R3 ASCII` (`1`), 3. `Matrix ASCII` (`2`), 4. `R3 Matrix ASCII` (`3`), 5. `Matrix Chord` (`4`), 6. `R3 Matrix Chord` (`5`), 7. `Cyber Rain` (`6`), 8. `Data Bomb` (`7`), 9. `R3 Data Bomb` (`8`), 10. `Ink Glyphs` (`9`), 11. `R3 Ink Glyphs` (`10`), 12. `Font Burn` (`11`), 13. `R3 Font Burn` (`12`).
   - Wire `glitchInkGlyphsFactory` (`4160`), `glitchFontBurnFactory` (`3430`), and `R3 Ink Glyphs` / `R3 Font Burn` (`r3-factories.js`) to read `SignalGlyphs.setFor(voiceName, fallbackSet)` when `SignalGlyphs.current !== 'Engine realms (Revision 3)'`, preserving their classic `INK_ALPHA`/`INK_SIGIL` and burn typesets when `'Engine realms (Revision 3)'` is selected!
   - Update `tests/web/glyph-routing.test.mjs` (`VOICES` list) and `tools/build-effects-manifest.mjs` (`glyphVoice: true` metadata flag) to pin all 13 voices.
3. **Seeded & Refreshable `'All scripts'` + Matrix/Cyber-Rain Cache Fixes:**
   - Replace unseeded `Math.random()` in `buildSet('All scripts')` (`glyph-library.js:48`) with `SignalGlyphs.reseed(seed)` (`mulberry32`), drawing 8 chars per **renderable** table, and expose `SignalGlyphs.reshuffleAllScripts(seed)` so `'All scripts'` refreshes cleanly on seed/auto-cycle ticks.
   - In `glitchMatrixAsciiFactory` (`4305`) and `glitchMatrixChordFactory` (`4405`), track `let seenGlyphVer = -1;` — whenever `SignalGlyphs.version !== seenGlyphVer`, immediately re-populate existing column `chars` in place so glyph table switches appear on the very next frame instead of waiting for columns to fall off screen.
   - In `cyberRainFactory` (`2365`), replace per-cell per-frame `pickFor` calls with a cached per-column glyph ring refreshed on row-step (`row !== col.row`) or `SignalGlyphs.version` change (matching `landing-backdrop.js:126`), and fall back to `GlitchEngine.TYPESETS.cyber` instead of returning early if `SignalGlyphs` is absent.
4. **First-Class ASCII / Glyph Table Randomization Controls & Engine Integration (`index.html:212`, `glitch-player.js`):**
   - Add three compact controls alongside `#glyph-bank` in `#sliderContainer` (and register in `surfaces.manifest.json` if needed):
     - **`Glyph Roll` (`#glyphRandBtn`)**: Immediately picks a random renderable glyph bank (or `'Engine realms (Revision 3)'` / `'All scripts'` with weighted `10%` odds each, `80%` specific script rotation) and updates `#glyph-bank`.
     - **`Glyph Auto` (`#glyphAutoBtn`)**: Session/preset toggle (`glyphAutoActive`, cadence `12–24s` calm / `5–9s` in Soft-Eye crescendo) that automatically cycles `SignalGlyphs` across `renderableNames` while playback is on.
     - **`<LOCK!>` (`#glyphLockBtn`, `sliderLocks.glyphBank`)**: Hard-locks the current glyph table against presets, `-ʁ%AUTO%ʁ-`, `Randomize All`, `Random Seed`, and `Glyph Auto`!
   - Wire `SignalGlyphs` into:
     - `randomizeBoard()` ("Randomize All"): rolls a renderable glyph bank unless `sliderLocks.glyphBank` is locked.
     - `applyRandomSeed(seed)`: deterministically selects a renderable glyph bank from `rng` unless `sliderLocks.glyphBank` is locked.

- **Exit Criteria:** Zero `.notdef` tofu glyphs rendered on Windows WebView2 across 100 consecutive preset/glyph rolls; all 13 glyph voices visibly switch alphabets within 1 frame of `SignalGlyphs.set(...)`; `#glyphLockBtn` holds the active glyph table across `Preset`, `Randomize All`, `Random Seed`, and `Glyph Auto`.

---

### Phase 2 — Preset Randomization, Schema v4 & Cross-Bank State Hygiene

**Goal:** Eliminate the single-17-voice blindness of `MACHINE` presets, fix cross-bank state bleed between `LAB 250` / `MACHINE 80` / `USER`, unify the duplicate `buildMachinePresets` generators, fix `Randomize All` and `Random Seed` washout & cancellation bugs, and align `presets.schema.json` + `r4-policy.js`.

1. **Unify & Upgrade `buildMachinePresets(seedOverride)` Across All 43 Voices (`glitch-engine.js` + `glitch-player.js:9001`):**
   - Consolidate the single canonical generator in `GlitchEngine.buildMachinePresets(seedOverride, opts)` and have `glitch-player.js` delegate to it (retaining thin wrapper `function buildMachinePresets(seedOverride)` in `glitch-player.js` so `machine-presets.test.mjs` source-slicing markers continue to pass seamlessly).
   - Expand voice pool from 17 legacy voices to **all 43 manifest voices**, organized into balanced architectural families so generated boards are musical and crisp rather than muddy:
     - **Core Canvas (13 non-light):** `Neon Grad`, `Scanlines`, `HSL Rainbow`, `ASCII`, `Font Burn`, `Gemini Bomb`, `Tech Artist`, `Data Bands`, `VHS Glitch`, `Data Bomb`, `Ink Glyphs`, `Matrix ASCII`, `Matrix Chord`
     - **AI-Warp Projector (9):** `Chromatic Echo`, `Temporal Slices`, `Signal Tear`, `Cyber Rain`, `Prism Rift`, `Orbit HUD`, `Rolling Scan`, `Tape Grain`, `Tracking Tear`
     - **Revision-3 Independent Twins (17):** `R3 Neon Grad` .. `R3 V-Sync`, `R3 B&W Invert`, `R3 Hue/Color Cycle`
     - **Master Filter Voices (2):** `B&W Invert`, `Hue/Color Cycle`
     - **Capped Lights (2):** `Flash` (`<= 0.20`), `Strobe` (`<= 0.35`)
   - Use unbiased `GlitchEngine.fisherYates(pool, rng)` with curated density budgets (`2–7` active voices for sparse/medium personalities, `6–11` for dense personalities, capping simultaneous full-frame wash voices so presets never white-out).
   - Cap **`Deepseek-1` (`OLD SOUL`, `i === 0`)** at creation time (`Flash: 0.20`, `Strobe: 0.35` routed through `balanceMachineLight` or capped to `[0.20, 0.00]` / `[0.12, 0.30]`) so `machinePresets['Deepseek-1']` obeys `LIGHT_CEILING` in memory as well as on apply.
   - Populate **every** preset field in `buildMachinePresets` so `MACHINE` presets never inherit stale state from prior `LAB` presets:
     - `glyphBank`: deterministically picked via `rng` (`20%` `'Engine realms (Revision 3)'`, `10%` `'All scripts'`, `70%` from `SignalGlyphs.renderableNames`).
     - `voiceFx`: `{ bwInvert, hueOffset }` deterministically rolled.
     - `hardLight`: boolean (`~15%` odds on virtual/high-contrast personalities, `false` otherwise).
     - `milk`: `{ active: boolean (~18% odds when warp is on), presetId: 1..80, opacity: 0.35..0.85 }`.
   - Expose **Machine Deck Seed UI** in the preset browser header (`#machineSeedInput` / `Copy` / `Re-roll` button wired to `rebuildMachineBank(customSeed)`), allowing users to replay any 80-preset `MACHINE` deck by its 32-bit seed!
2. **Eliminate Cross-Bank State Bleed in `normalizePresetSettings` & `applySettings` (`glitch-player.js:9122, 9200, 9345`):**
   - In `mapLabSnapshot(settings)` (`9200`), supply explicit clean defaults for fields omitted by `LAB 250` (`ghostMode: 'OFF'`, `ghostLevel: 0`, `vsyncMode: 'OFF'`, `masterControls: DEFAULT_MASTERS`, `voiceFx: { bwInvert: 0, hueOffset: 0 }`, `hardLight: false`, `milk: { active: false }`) and resolve `glyphBank` through `SignalGlyphs` renderable fallback when unfonted on the host OS.
   - Result: switching `MACHINE` → `LAB` → `MACHINE` (manually or via `-ʁ%AUTO%ʁ-`) never leaks Ghost, V-Sync, Hardlight, MilkDrop, or unfonted tofu glyph tables across preset banks!
3. **Fix `randomizeBoard()` ("Randomize All"), `applyRandomSeed(seed)`, and `bindTestCanvas()` (`glitch-player.js:8326, 8357, 8780`):**
   - **`randomizeBoard()` (`8326`):**
     - Select a curated voice ensemble (`3–9` active voices across Core + AI-Warp + R3 using `fisherYates`, plus optional `B&W Invert` landmark and `Hue/Color Cycle`), setting unselected unlocked voices to `0` instead of turning all 41 voices on simultaneously!
     - Explicitly update **`crParked[name] = v < PARKED_EFFECT_EPSILON`** and **`setEffectCancelled(name, v < PARKED_EFFECT_EPSILON)`** for every unlocked voice so **Randomize All** cleanly wakes selected voices after `ZERO ALL` and parks unselected ones!
     - Roll unlocked `SignalGlyphs` (unless `sliderLocks.glyphBank`), unlocked `voiceFx`, unlocked `milk` (when `milk.active` or with curated odds), and unlocked `hardLight`.
   - **`applyRandomSeed(seed)` (`8357`):**
     - Replace `(s * 9301 + 49297) % 233280` with `const rng = GlitchEngine.mulberry32(GlitchEngine.hashSeed(seed));`.
     - Pass `rng` into `GlitchEngine.confineTarget(name, raw, ctx, rng)` so identical slider values produce **100% bit-identical boards** every time (zero `Math.random()` leak!).
     - Select a curated subset (`3–10` voices determined by `rng`) rather than driving all 41 voices simultaneously, and deterministically set `SignalGlyphs` (unless `sliderLocks.glyphBank`).
   - **`bindTestCanvas()` (`8780`):**
     - Clear `userCancelled[n] = false` and `crParked[n] = false` for every voice woken by `WHITE 2 BLACK 2 WHITE` so `Continual Randomization` doesn't immediately re-zero them after a prior `ZERO ALL`.
4. **Update `webui/data/presets.schema.json` & `webui/js/r4-policy.js` (Backward-Compatible v3/v4):**
   - Keep `version: 3` valid for all existing `USER` exports and `LAB 250` (`presets-schema.test.mjs` stays 100% green), while permitting optional `hardLight` (`boolean`), `milk` (`{ active: boolean, presetId?: 1..80, opacity?: 0..1 }`), `glyphAuto` (`boolean`), `seed` (`integer`), and `sliderLocks.glyphBank` / `sliderLocks.hardLight` in both `presets.schema.json` and `R4Policy.validPresetSettings`.

- **Exit Criteria:** All 43 voices appear across a generated 80-preset `MACHINE` deck (`machine-presets.test.mjs`); `applyRandomSeed(0.42)` called twice produces identical `effectAlphas` + `glyphBank`; `ZERO ALL` → `Randomize All` keeps woken voices alive across 60 seconds of `Continual Randomization`; `LAB` ↔ `MACHINE` auto-cycling exhibits zero Ghost/V-Sync/Glyph bleed.

---

### Phase 3 — Flash & Strobe Safety, Manual `Trigger` & Wander Confluence

**Goal:** Guarantee that `Flash <= 0.20` and `Strobe <= 0.35` hold under **every** code path (including on-screen luminance), restore manual `Trigger` while `lightAutomationOn === false` without double-instance stacking, and fix `stepLightWander` so lights genuinely rest at `0` and obey Soft-Eye `0.02` calm caps.

1. **Fix `triggerTimedEffect` for `Flash` & `Strobe` (and All Voices) (`glitch-player.js:5934–5946`):**
   - Remove the erroneous `if (isManualLight(def.name) && !lightAutomationOn) return;` block so clicking the manual `Trigger` button on `Flash` or `Strobe` works as an explicit one-shot manual pulse when `lightAutomationOn === false` (capped strictly at `0.20` / `0.35` and gated by `prefers-reduced-motion` and `masterOpacity`).
   - **Eliminate `effectAlphas` mutation & double-instance luminance stacking:**
     - Introduce `timedPulseUntil[name]` + `timedPulsePeak[name]` (a transient envelope read by `effectLiveStrength(name)` that decays cleanly to `0` at `now >= timedPulseUntil[name]`), **never** mutating `effectAlphas[name]` when `effectAlphas[name] === 0`!
     - Ensure a voice renders through **at most ONE factory instance per frame** (if `continuousEffectCache[def.name]` is already active, `triggerTimedEffect` only refreshes `triggerTimestamps[def.name]` / `timedPulseUntil[def.name]` instead of pushing a duplicate `inst` onto `activeEffects`; if `continuousEffectCache[def.name]` is NOT active, register the temporary instance in a `timedActiveMap[def.name]` deduplicated by voice name so rapid `Trigger` clicks never stack `2×–5×` instances!).
     - Result: On-screen `Flash` alpha can **never** exceed `0.20 * masterOpacity` and `Strobe` can **never** exceed `0.35 * masterOpacity`, even if the user clicks `Trigger` 10 times in a row while the slider is at `20%`/`35%`!
2. **Fix `stepLightWander` Ordering (`glitch-player.js:4932–4955`):**
   - Reorder target computation in `stepLightWander`:
     1. If `Math.random() < lt.rest` (or seeded `rng() < lt.rest`), set `t = 0` and **skip `confineTarget`** so resting lights actually ease all the way to **`0.000`**!
     2. Otherwise, roll `t = Math.pow(rng(), lt.pow) * lightCap(name)`, apply `eng.confineTarget(name, t, ctx, rng)` **first**, then apply mutual-peak ducking (`if (effectAlphas[other] > 0.5 * lightCap(other)) t *= 0.4`), then apply **`eng.softCap(name, t, softK())`**, and finally **`clampLight(name, t)`**!
     - Result: In Soft-Eye calm (`softK() === 0`), `Flash` and `Strobe` never exceed `0.02` (`2%`), even in `'virtual'` realm (`AI Warp` ON), while still reaching up to `0.20` / `0.35` during crescendos (`softK() === 1`) or when `SOFT-EYE` is switched OFF!
3. **Recalibrate `WASHOUT_PAIRS` for Capped Lights & Protect Light Targets (`glitch-player.js:10020–10095, 10449`):**
   - Update `WASHOUT_PAIRS` to physically reachable thresholds scaled to `[0.20, 0.35]` caps:
     - `['Flash', 'Strobe', 0.38, 1200]` (fires when both sit near ceiling simultaneously > 1.2s)
     - `['Flash', 'HSL Rainbow', 0.95, 2000]`
     - `['Strobe', 'HSL Rainbow', 1.05, 1500]`
     - `['B&W Invert', 'Flash', 0.90, 1000]`
     - `['B&W Invert', 'Strobe', 0.98, 1000]`
   - When `antiWashoutStep` pulls a light down, route through `lightWanderTarget[name]` (only when `lightAutomationOn === true` and `!sliderLocks[name]`) and never touch manual/preset light levels when `lightAutomationOn === false`!
   - In `aestheticBurstStep` `'dip'` exit (`10449`), skip `isManualLight(name)` so bursts never write `randomTargets.Flash` / `randomTargets.Strobe`.

- **Exit Criteria:** All 19 existing tests in `tests/web/light-model.test.mjs` pass unchanged + new tests verify: (a) manual `Trigger` pulses `Flash` <= `0.20` when `lightAutomationOn === false` and returns cleanly to `0` after 2s without mutating `effectAlphas`; (b) 10 rapid `Trigger` clicks never create > 1 entry in `activeEffects`; (c) `stepLightWander` in `'virtual'` realm with `softK() === 0` stays `<= 0.02` and hits `0` on rest rolls.

---

### Phase 4 — Voice Triggers, Automations, Singleton R3 Guard & Airtight `ZERO ALL`

**Goal:** Make every automation (`Auto Glitch`, `Continual Randomization`, `Aesthetic Bursts`, `B&W Sweep`, `Automated Masters`, `AI Video Warp`) obey `userCancelled`, `sliderLocks`, `masterOpacity`, and R3 singleton state, and make `ZERO ALL` a complete, unambiguous stage reset.

1. **Overhaul `autoGlitchStep` & R3 Singleton Execution (`glitch-player.js:8268–8318, 2595`):**
   - **Respect Cancellation & Locks:** In `autoGlitchStep` (`8278`) and `autoGlitchSparks` (`8300`), immediately skip any voice where `isEffectCancelled(name)` or `automationHeld(name)` (`sliderLocks[name]`) is true, or `masterOpacity <= 0.001`!
   - **Fix Inverted Headroom Formula:** Replace `const headroom = Math.max(0.18, 1 - base * 0.75)` (which drove `0`-slider voices at `100%`!) with intent-proportional modulation:
     - Voices already active (`base >= PARKED_EFFECT_EPSILON`) receive rhythmic glitch modulation scaled by `masterControls.autoGlitchPower * masterControls.effectIntensity`.
     - Parked, **uncancelled** voices are woken **solely** through `autoGlitchUnpark(now)` (`8215`), which visibly raises their slider (`effectAlphas` / `randomTargets`) so "what the sliders say and what is rendered" stay 100% in sync (`R1 OLD-SOUL` invariant at `4753`)!
   - **Eliminate Double-Stepping of `r3Runners`:** Do **not** push separate `r3Factory` instances into both `continuousEffectCache` and `autoGlitchInstances` / `activeEffects` in the same frame. Instead, fold Auto Glitch's transient boost into `effectLiveStrength(name)` (where `glitchBoost` at `5392` already lives!) and invoke `continuousEffectCache[name]` **once** per frame!
2. **Fix `effectLiveStrength` Master Scaling (`glitch-player.js:5905–5920`):**
   - Multiply `pulseFloor` by `masterOpacity * (0.35 + 0.65 * clamp01(masterControls.effectIntensity))` and return `0` immediately when `masterOpacity <= 0.001`, so `Global Opacity = 0%` guarantees a 100% clean black/source frame even during `Trigger` pulses.
3. **Fix `AESTHETIC_GROUPS` Coverage & `'dip'` Release Leak (`glitch-player.js:10185–10460`):**
   - Add `if (isManualLight(name) || isEffectCancelled(name) || (!isAutoGlitching && crParked[name] && (effectAlphas[name] || 0) < PARKED_EFFECT_EPSILON)) return;` to the `'dip'` exit loop (`10449`).
   - Expand `AESTHETIC_GROUPS` with 6 curated R3 & AI-Warp confluence groups (`r3Aurora`, `r3CyberGrid`, `r3TapeBroadcast`, `r3PrismMatrix`, `temporalRift`, `orbitalSignal`) so all 17 `R3 *` voices and all 9 AI-Warp voices participate in curated bursts when uncancelled.
4. **Gate `stepBwSweep` on Active Automation & `voiceFxLocks.bwInvert` (`glitch-player.js:6275`):**
   - Require `(isContinuallyRandomizing || isAutoGlitching || isAutomatedMasters)` before scheduling or starting an automatic B&W sweep in `stepBwSweep(now)`, and stand down whenever `sliderLocks['B&W Invert']` **or** `voiceFxLocks.bwInvert` is locked!
5. **Unlock All 30 `AI_WARP_MODES` & Fix `syncR3Engine` (`glitch-player.js:2612, 7196`):**
   - Replace the 5-item `AI_WARP_MODES` array (`7196`) with all **30 mode keys** from `R3GhostVsync.WARP_BLEND` (`aurora`, `prism`, `scan`, `crt`, `void`, `plasma`, `vortex`, `nebula`, `laser`, `horizon`, `echo`, `bloom`, `rift`, `pulse`, `silk`, `ember`, `frost`, `acid`, `velvet`, `chrome`, `sonar`, `mirage`, `flux`, `halo`, `abyss`, `cipher`, `solstice`, `ion`, `dusk`, `zenith`).
   - Track `currentAiWarpMode` in module scope when `updateAiWarp` shifts modes, pass `engine.aiWarpMode = isAiWarpActive ? currentAiWarpMode : 'aurora'` in `syncR3Engine` (`2612`), and wire `engine.audioDrive` from `SOFT.ear.state` (`bass`, `mid`, `treb`, `drive: SOFT.ear.state.level || videoPalette.energy`) so R3 voices react to real `EAR` bass/mid/treble!
6. **Make `ZERO ALL` (`zeroAllEffects`, `glitch-player.js:8456`) Complete & Airtight:**
   - In addition to zeroing all 43 `effectAlphas`, latching `crParked[name] = true` & `setEffectCancelled(name, true)`, and stopping CR / AG / AM / `lightAutomationOn`:
     - Call `setLightLevelNow('Flash', 0)` and `setLightLevelNow('Strobe', 0)` (unless hand-locked? No: `ZERO ALL` is explicit user emergency/board zero—zeroes `lightStored` too while preserving lock flags or zeroing cleanly per `light-model.test.mjs`).
     - Stop `presetAutoActive` (`if (presetAutoActive) togglePresetAuto();`) so `-ʁ%AUTO%ʁ-` cannot ambush a zeroed board 3 seconds later!
     - Clear transient `activeEffects.length = 0`, `timedActiveMap`, `timedPulseUntil`, and `autoGlitchSparks.length = 0`.
     - Turn off `isAiWarpActive = false`, `ghostModeIndex = 0` (`ghostActive = false`, `ghostLevel = 0`), `vsyncModeIndex = 0`, `setMilkActive(false)` (if active), and `setHardLight(false)` (if active), syncing all button labels/ARIA attributes.
     - Reset `SOFT.gate.reset()` (`SOFT.burst = 0`) and `SOFT.cresc.calmNow()` (`k = 0`, phase `'calm'`).

- **Exit Criteria:** Clicking `ZERO ALL` during maximal chaos (`Preset Auto` + `Auto Glitch` + `CR` + `AI Warp` + `MilkDrop` + `Hard Light` + `Ghost` + `V-Sync` + active `Trigger` + `Soft-Eye` crescendo) produces an **instant, 100% clean source frame on the very next tick** and stays at `0.000` across 60 seconds of playback (`effect-cancellation.test.mjs` expanded).

---

### Phase 5 — MilkDrop (`DROP THE MILK?`) 30-Mode Confluence, Render Budget & Deck UI

**Goal:** Restore MilkDrop's authored composite modes and 30-mode AI-Warp synergy, eliminate dual-blur frame drops and RAF `localStorage` stalls, fix the `bass === 0` bug, and give users real MilkDrop deck controls.

1. **Connect `milkBlendProfile` to `currentAiWarpMode` (`glitch-player.js:5533`):**
   - Replace `const modeKey = isAiWarpActive ? 'aurora' : '';` with `const modeKey = isAiWarpActive ? (currentAiWarpMode || 'aurora') : '';`, unlocking all **30 `R3GhostVsync.WARP_BLEND` and `WARP_AUX` modes** (`warpSpeed`, ` zoom`, `rot`, `petals`, `rings`, `trail`, `hueShift`, `satBoost`, `blendOp`)!
2. **Restore Composite Modes, Master Scaling, Hardlight & Soft-Eye Parity (`glitch-player.js:5603–5723`):**
   - Respect `preset.composite` (`'screen'`, `'lighter'`, `'soft-light'`, modulated by `WARP_BLEND[modeKey].blendOp` when AI Warp is active) when compositing `milk.canvas` onto `gctx` (`5718`) instead of hardcoding `'source-over'`.
   - Scale final MilkDrop alpha by `masterOpacity * (0.35 + 0.65 * clamp01(masterControls.effectIntensity))` (so `Global Opacity = 0%` silences MilkDrop cleanly), apply Soft-Eye calm cap (`lerp(0.58, 1.0, softK())` when `SOFT.enabled`), and damp petal lightness/alpha by `0.78` when `isHardLightActive` is true so `HARD LIGHT` + `MilkDrop` never clips white.
   - Under `prefers-reduced-motion: reduce`, freeze `milk.phase` rotation/zoom motion and suppress auto-advance rapid flashes, painting a calm ambient mandala.
3. **Budget Blur Passes & Fix `es.bass === 0` + RAF `localStorage` Stall (`glitch-player.js:5617, 5642, 5668–5705`):**
   - **Audio Bass Zero Fix (`5642`):** Replace `(es.bass || drive)` with `(es && es.active ? es.bass : drive)` (using `Number.isFinite` / `es.active` check instead of `||` so quiet sections with `bass === 0` actually calm the mandala instead of jumping to `drive`!).
   - **Eliminate Per-Petal Blur (`5698`):** Remove `mctx.filter = 'blur(...)'` from inside the radial petal loop (use soft alpha gradient stops instead, which are `10×–25×` faster on Canvas2D), and scale `milk.canvas` internal resolution + feedback blur by `QUALITY_TIERS[qualityTier]` (`tier 0`: `0.5×` viewport + 1 feedback blur; `tier 1`: `0.38×` viewport, no blur filter; `tier 2`: `0.28×` viewport, crisp feedback only).
   - **Debounce Storage Writes (`5617`):** Never call synchronous `localStorage.setItem` inside `renderMilkdrop` auto-advance; schedule idle persistence via a `500 ms` debounced timer outside `draw()`.
4. **Seeded Deck Shuffle & Compact MilkDrop Deck Controls (`index.html:196`, `glitch-player.js:5490, 5745`):**
   - Pass optional `rng` into `orderMilkDeck(bank, rng)` (`mulberry32` seeded from session/preset seed).
   - Add compact inline MilkDrop sub-controls next to `#aiwMilkBtn` in the AI-Warp master strip: `◀` (`#aiwMilkPrev`), `▶` (`#aiwMilkNext`), `HOLD` (`#aiwMilkHold`, freezes the 18s auto-advance on the current `01/80` preset), and `Milk Opacity` slider/readout (`voiceFxSettings.milkOpacity`, already partially scaffolded in `voiceFxSettings`!), while respecting `voiceFxLocks.milk`.
   - Include `milk` in `antiWashoutStep` (preventing `MilkDrop 100% + HSL Rainbow 100% + Neon Grad 100%` sustained white-out).

- **Exit Criteria:** All 30 `WARP_BLEND` profiles demonstrably alter `milkBlendProfile()` output; `renderMilkdrop` frame cost drops by `>= 60%` at 1080p (`<= 1.8 ms` CPU in tier 0, `<= 0.6 ms` in tier 2); zero `localStorage.setItem` calls occur synchronously inside `draw()`.

---

### Phase 6 — Hardlight (`HARD LIGHT` & `#moon-veil`) First-Class Engine Integration

**Goal:** Promote `HARD LIGHT` from an isolated closure boolean into a first-class, lockable, persistable, preset-aware, `ZERO ALL`-compliant visual stage mode integrated with MilkDrop, R3 factories, Anti-Washout, and Soft-Eye.

1. **Module-Scoped State, Persistence & Lock (`glitch-player.js:8683`, `index.html:125`):**
   - Hoist `let isHardLightActive = false;` and `function setHardLight(on, opts)` to player scope; restore initial state from `localStorage.getItem('glitch-hard-light') === '1'` (default `false` on fresh install) and persist user toggles.
   - Add `sliderLocks.hardLight` support (optional lock badge or shift-click lock parity) so a user-locked `HARD LIGHT` state is never overwritten by presets or `Randomize All`.
   - Wire `setHardLight(false)` into `zeroAllEffects()` (unless user-locked) and expose `hardLight: isHardLightActive` in `captureSettings()`, `normalizePresetSettings()`, and `applySettings()`.
2. **Engine, MilkDrop, Anti-Washout & Soft-Eye Confluence (`glitch-player.js:2612, 6015, 10020`, `r3-factories.js`, `glitch-player.css:1352`):**
   - Pass `engine.hardLight = isHardLightActive` in `syncR3Engine()` (`2612`) so R3 voices crisp their stroke alpha and trim bloom radius (`× 0.82`) instead of washing into `#moon-veil`'s `mix-blend-mode: overlay`.
   - Drive a CSS custom property `--moon-veil-k` on `document.body` (`0.0`..`1.0`) scaled by `masterOpacity * (SOFT.enabled ? lerp(0.55, 1.0, softK()) : 1.0)` so:
     - `Global Opacity = 0%` fades `#moon-veil` hard-light bloom down cleanly (`opacity: var(--moon-veil-k, 1)`).
     - `SOFT-EYE` calm mode softens `#moon-veil` overlay intensity to `55%`, swelling to `100%` on crescendos!
   - Add `isHardLightActive` awareness to `antiWashoutStep`: tighten washout-pair hold timeouts by `25%` while `HARD LIGHT` is ON so stacked bright overlays pull back before clipping highlights.

- **Exit Criteria:** `HARD LIGHT` state round-trips through `Save Preset` → `ZERO ALL` → `Load Preset`, persists across page reload when toggled manually, dims cleanly with `Global Opacity` and `SOFT-EYE` calm, and turns OFF on `ZERO ALL`.

---

### Phase 7 — Soft-Eye & EAR (`SOFT-EYE`, Audio/Visual `EAR`, `#earHud`) Full Repair

**Goal:** Fix the `softEyeK || 1` zero-coercion bug in R3 voices, extend Soft-Eye tables to all 43 voices, stop `dia` bursts from violating `ZERO ALL` and locks, make Visual `EAR` and YouTube playback genuinely drive `Crescendo`, `BurstGate`, and `#earHud` **without capturing YouTube audio**, and reset `EAR` state cleanly on every source switch.

1. **Fix `r3-factories.js` Zero-Coercion Bug (`webui/js/r3-factories.js:2691`):**
   - Replace:
     ```js
     const softK = engine.softEyeK || 1;
     ```
     with:
     ```js
     const softK = Number.isFinite(engine.softEyeK) ? engine.softEyeK : 1;
     ```
   - Verify every `engine.softEyeK` read across `r3-factories.js` and `r3-ghost-vsync.js` uses `Number.isFinite(...)` / `?? 1` rather than `|| 1`.
2. **Expand `GlitchEngine.SOFT_EYE` & `CHROMA_VOICES` to All 43 Voices (`glitch-engine.js:495–545`, `glitch-player.js:3542`):**
   - Add all 17 `R3 *` voices and all 9 AI-Warp voices to `SOFT_EYE.calmCaps`, `SOFT_EYE.paintCalm`, and `SOFT_EYE.busyVoices` (`R3 Gemini Bomb`, `R3 Data Bomb`, `R3 Tech Artist`, `R3 VHS Glitch`, `Cyber Rain`, `Signal Tear`, `Temporal Slices`, `Tracking Tear`), and add `R3 HSL Rainbow`, `R3 Neon Grad`, `R3 Hue/Color Cycle`, `Chromatic Echo`, and `Prism Rift` to `CHROMA_VOICES`.
   - Ensure `softGroupAllowed(effects, softK)` also gates any burst group containing high-flash combinations until `softK > 0.35`.
3. **Fix `softStep` `dia` Burst Cancellation & Lock Bypass (`glitch-player.js:1661–1671`):**
   - Gate the `gate.kind === 'dia'` `B&W Invert` burst behind:
     ```js
     if (!automationHeld('B&W Invert') && !voiceFxLocks.bwInvert && !isEffectCancelled('B&W Invert') &&
         (isContinuallyRandomizing || isAutoGlitching))
     ```
     and restore `B&W Invert` back to its pre-burst target when `gate.active` ends instead of stranding `effectAlphas['B&W Invert']` at `0.75`!
   - Add `calmNow()` to `createCrescendo` (`glitch-engine.js:735`) and `reset()` to `createBurstGate` (`glitch-engine.js:785`), called by `zeroAllEffects()`.
4. **Fix `createEar.feedVisual` Deafness & Add `ear.reset()` (`webui/js/glitch-engine.js:585–660`):**
   - In `createEar.feedVisual(energy, motion, dt, opts)`:
     - Set **`st.active = true`** whenever playback is active and non-zero visual/motion frames are arriving (setting `st.active = false` only when `opts && opts.held` is true, e.g., paused local media), while keeping `st.source = (opts && opts.source) || 'canvas'` so `#earHud` continues to display `SRC: CANVAS` or `SRC: YT-SYNC` honestly!
     - Derive distinct pseudo-spectral bands from visual dynamics: `bass` from low-passed luminance/beat swell, `mid` from palette chroma/energy delta, `treb` from high-frequency frame-to-frame motion/edge delta, and `build` + `beat` through the **same** adaptive `hist` ring buffer and `peakHold` detector used by `feedFrequency`!
     - Result: `createCrescendo` and `createBurstGate` now genuinely respond to visual drops, flashes, and motion spikes on `TEST CANVAS` and `YouTube`!
   - Add **`ear.reset()`** to `createEar` (clearing `hist`, `histIdx`, `histFill`, `warm`, `ready`, `peakHold`, `build`, `beat`, `level`, `bass`, `mid`, `treb`), and call `SOFT.earAud.reset(); SOFT.earVis.reset();` inside a unified `resetEarForSource(kind)` hook invoked in `startPlayback()` (`845`), `loadLocalFile()` (`1480`), and `bindTestCanvas()` (`8780`).
5. **YouTube Legal Visual/Cadence Proxy for `videoPalette` & `EAR` (`glitch-player.js:1208, 1595`) — Zero Audio Capture:**
   - Strictly obeying `AGENTS.md` (zero tab/desktop/WebView2 audio capture!), add a `youtube` branch in `samplePaletteNow()` (`1208`) when `nowPlaying.kind === 'youtube'`:
     - Read legal `YT.Player` state (`getPlayerState() === 1` playing vs paused/buffering, `getCurrentTime()`, `getDuration()`, `getPlaybackRate()`), `TRACK_TIMINGS` phrase/BPM metadata (for curated link-tree tracks, coordinated with `R4.3-00`/`R4.3-01`), and live `ytWarpShell` / `mainCanvas` feedback motion so `videoPalette.energy`, `videoPalette.motion`, and `videoPalette.hue` evolve dynamically during playing YouTube tracks and drop to `0` (`held = true`) when YouTube is paused, buffering, or ended!
   - Fix local `<video>`/`<audio>` `AudioContext` lifecycle (`bindEarRetap`, `8735`): resume suspended `SOFT.ctx` on user gesture (`play`, `click`, `keydown`), handle `local-audio` artwork/visualizer fallback smoothly while `analyser` warms up (`warm < 18` frames), and surface honest `SRC: AUDIO` vs `SRC: CANVAS` vs `SRC: YT-VIS` vs `PAUSED` badges in `#earHud`.

- **Exit Criteria:**
  1. With `SOFT-EYE: ON` in calm phase (`softK() === 0`), all 15 `R3 *` voices render at calm caps (`<= 0.22–0.35`), never `1.0`.
  2. `ZERO ALL` followed by 120 seconds of `SOFT-EYE: ON` never triggers a `dia` B&W inversion.
  3. On both `TEST CANVAS` and playing `YouTube` tracks, `#earHud` meters (`LVL`, `BASS`, `MID`, `TREB`, `BLD`) animate dynamically, pause cleanly when YouTube pauses (`getPlayerState() === 2`), and trigger `SOFT.cresc` & `SOFT.gate` without touching any audio capture API (`host-guards.test.mjs` & `CaptureGuard.cs` remain 100% untouched and green).

---

### Phase 8 — Manifests, Test Suite Expansion & Native Rebuild Verification

**Goal:** Lock every fix behind automated `--check` manifest builders and deterministic Node tests so none of these regressions can ever return.

1. **Manifest & Generator Sync (`tools/*.mjs`):**
   - Run and verify:
     - `node tools/build-glyph-tables.mjs --check`
     - `node tools/build-effects-manifest.mjs --check` (regenerating `webui/data/effects.manifest.json` if `glyphVoice` / `r3` metadata fields are added)
     - `node tools/build-surfaces-manifest.mjs --check` (regenerating `webui/data/surfaces.manifest.json` after adding `#glyphRandBtn`, `#glyphAutoBtn`, `#glyphLockBtn`, `#aiwMilkPrev`, `#aiwMilkNext`, `#aiwMilkHold`, `#machineSeedInput`)
   - Fix `package.json` `"test"` script cross-Node compatibility (`node --test tests/web/` directory target instead of quoted `"tests/web/*.test.mjs"` glob so `npm test` succeeds on both Node 20 LTS and Node 22+).
2. **New & Updated Web Test Suites (`tests/web/*.test.mjs`):**
   - **`machine-presets.test.mjs`**: Assert all 43 voices appear across generated `MACHINE` decks, `Deepseek-1` (`i === 0`) obeys `Flash <= 0.20` and `Strobe <= 0.35`, every `MACHINE` preset defines `glyphBank` + `voiceFx` + `hardLight` + `milk`, and `fisherYates` shows uniform voice distribution.
   - **`presets-schema.test.mjs` & `r4-policy.test.mjs`**: Validate v3 backward compatibility + new optional `hardLight`, `milk`, `glyphAuto`, and `seed` fields; test zero state bleed across `MACHINE` → `LAB` → `USER` transitions.
   - **`glyph-routing.test.mjs` & `glyph-tables.test.mjs`**: Assert all **13** glyph voices route through `SignalGlyphs`, `Matrix ASCII`/`Matrix Chord` refresh on `SignalGlyphs.version` increment, `All scripts` is deterministic under `SignalGlyphs.reseed(seed)`, `#glyphLockBtn` blocks preset/randomizer overrides, and canvas font-probe filters `.notdef` tables out of random pools.
   - **`effect-cancellation.test.mjs` & `automation-guards.test.mjs`**: Assert `randomizeBoard` ("Randomize All") updates `userCancelled` and `crParked`; assert `autoGlitchStep`, `autoGlitchSparks`, `aestheticBurstStep` `'dip'` exit, `stepBwSweep`, and `softStep` `dia` bursts **never** raise or render cancelled or locked voices; assert `r3Runners` step at most once per frame; assert `zeroAllEffects` halts `presetAutoActive`, `isAiWarpActive`, `ghostActive`, `vsyncModeIndex`, `milk.active`, `isHardLightActive`, `activeEffects`, `SOFT.gate`, and `SOFT.cresc`.
   - **`light-model.test.mjs`**: Keep all 19 existing tests green + add tests for manual `Trigger` with `lightAutomationOn === false`, non-mutation of `effectAlphas` on `0`-slider `Trigger`, single-instance deduplication (`<= 0.20` / `<= 0.35` effective output), and `stepLightWander` `lt.rest = 0` + `softCap(0.02)` compliance in `'virtual'` realm.
   - **`milkdrop-hardlight.test.mjs` *(new)***: Test all 30 `WARP_BLEND` modes through `milkBlendProfile`, `preset.composite` preservation, `masterOpacity = 0` silence, `es.bass === 0` handling, tier-2 blur bypass, zero RAF `localStorage` writes, and `HARD LIGHT` state/persistence/preset/`ZERO ALL` round-trip.
   - **`ear-hud.test.mjs` & `soft-eye-r3.test.mjs` *(new)***: Test `r3-factories.js` with `engine.softEyeK = 0` (`softK === 0`, NOT `1`!), 43-voice `SOFT_EYE.calmCaps`/`paintCalm`, `createEar.feedVisual` activating `createCrescendo` + `createBurstGate`, `ear.reset()` clearing `peakHold`/`hist` on source switch, and YouTube `samplePaletteNow` motion/pause behavior with zero audio capture.

---

## 4. Master File-Touch Matrix & Effort Map

| File | Phases | Planned Changes |
| --- | --- | --- |
| `webui/js/glitch-engine.js` | 0, 2, 7 | Add `hashSeed`, `mulberry32`, `fisherYates`; expand `VOICES` (17 → 43, light bands `<= 0.20`/`0.35`); unify 43-voice `buildMachinePresets`; expand `SOFT_EYE` (`busyVoices`, `calmCaps`, `paintCalm`) to 43 voices; fix `createEar.feedVisual` (`st.active`), add `ear.reset()`, `crescendo.calmNow()`, `burstGate.reset()`. |
| `webui/js/glyph-library.js` | 1 | Add offscreen canvas `.notdef` font-coverage probe (`renderableNames`); expand `VOICE_OFFSETS` from 9 → 13 voices; add seeded `All scripts` sampler + `randomize()` + `reseed()`. |
| `webui/js/r3-factories.js` | 1, 6, 7 | Fix `const softK = Number.isFinite(engine.softEyeK) ? engine.softEyeK : 1` (`:2691`); wire `R3 Ink Glyphs` & `R3 Font Burn` to `SignalGlyphs`; add `engine.hardLight` bloom/stroke trim. |
| `webui/js/r3-ghost-vsync.js` | 4, 5, 7 | Verify `softEyeK` numeric checks; export `WARP_MODES` (`Object.keys(WARP_BLEND)`) cleanly for player & MilkDrop consumption. |
| `webui/js/glitch-player.js` | 1–7 | Glyph UI/auto/lock + Matrix/Cyber-Rain/Ink/FontBurn routing; 43-voice `buildMachinePresets` wrapper + `mapLabSnapshot` clean defaults + `randomizeBoard`/`applyRandomSeed`/`bindTestCanvas` fixes; `triggerTimedEffect` pulse-envelope & deduplication + `stepLightWander` ordering + reachable `WASHOUT_PAIRS`; `autoGlitchStep` cancel/lock/singleton fix + `AESTHETIC_GROUPS` R3/AI-Warp + `'dip'` guard + `stepBwSweep` gate + 30 `AI_WARP_MODES` + complete `zeroAllEffects`; MilkDrop 30-mode/composite/budget/bass-0/UI; `isHardLightActive` API/persistence/confluence; `softStep` `dia` guard + `resetEarForSource` + YouTube `samplePaletteNow` visual proxy. |
| `webui/index.html` & `webui/css/*.css` | 1, 2, 5, 6 | Add `#glyphRandBtn`, `#glyphAutoBtn`, `#glyphLockBtn`, `#machineSeedInput`/`#machineSeedBtn`, `#aiwMilkPrev`/`#aiwMilkNext`/`#aiwMilkHold`; bind `--moon-veil-k` on `body.hard-light #moon-veil` + `prefers-reduced-motion` rules. |
| `webui/data/presets.schema.json` & `webui/js/r4-policy.js` | 2, 5, 6 | Permit optional `hardLight`, `milk`, `glyphAuto`, `seed`, and new lock keys while keeping v3 presets 100% valid. |
| `webui/data/effects.manifest.json` & `surfaces.manifest.json` | 1, 8 | Regenerate via `tools/build-effects-manifest.mjs` and `tools/build-surfaces-manifest.mjs`; verify `--check`. |
| `package.json` & `tests/web/*.test.mjs` | 8 | Make `npm test` Node 20/22 portable; update 7 existing test suites and add `milkdrop-hardlight.test.mjs` + `soft-eye-r3.test.mjs`. |

---

## 5. Acceptance Verification Checklist (Release Gate)

- [ ] `node tools/build-glyph-tables.mjs --check` exits `0`
- [ ] `node tools/build-effects-manifest.mjs --check` exits `0`
- [ ] `node tools/build-surfaces-manifest.mjs --check` exits `0`
- [ ] `node --test tests/web/*.test.mjs` passes 100% (target `>= 250` assertions across all 7 remediated subsystems)
- [ ] `dotnet test` / `build.cmd` passes host policy, `CaptureGuard`, `AppPolicy` CSP, and LF checkout checks
- [ ] Manual smoke verification across all 3 playback modes (**YouTube Link Card**, **Local MP3/MP4**, **`WHITE 2 BLACK 2 WHITE` Test Canvas**):
  - [ ] `MACHINE` 80 presets, `Randomize All`, and `Random Seed` activate Core, AI-Warp, and `R3 *` voices cleanly without 41-voice washout, replay identically from seed, and switch cleanly with `LAB 250` without leaking Ghost/V-Sync/Glyph state.
  - [ ] ASCII / Glyph Roll, Auto-Cycle, and `<LOCK!>` switch all 13 glyph voices within 1 frame with zero `.notdef` tofu boxes.
  - [ ] `Flash` (`<= 20%`) and `Strobe` (`<= 35%`) respond to manual `Trigger` without mutating sliders or stacking instances, rest at `0.000` during automatic wander, and obey `<= 2%` calm caps under `SOFT-EYE`.
  - [ ] `ZERO ALL` immediately silences every voice, trigger, spark, preset cycler, AI Warp, Ghost, V-Sync, MilkDrop, Hardlight, and Soft-Eye burst—and nothing restarts until explicit user action.
  - [ ] `DROP THE MILK?` honors additive/screen composites, all 30 AI-Warp modes, Global Opacity, Hardlight damping, Soft-Eye calm, and `QUALITY_TIERS` without RAF storage stalls.
  - [ ] `SOFT-EYE` keeps all 15 `R3 *` voices calm (`softEyeK = 0` respected), and `#earHud` responds dynamically across Local Audio, Local Video, Test Canvas, and YouTube (with zero audio capture).
