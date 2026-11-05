/* Phase 5 (FS-06): MilkDrop 30-mode confluence, render budget and deck UI.
   Phase 6: HARD LIGHT first-class state — persistence, locks, ZERO ALL and
   preset round-trips, the #moon-veil --moon-veil-k integration, tightened
   washout holds and the R3 engine hard-light flag. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readWeb, runInSandbox } from './harness.mjs';

const player = readWeb('js/glitch-player.js');

const sliceBetween = (startMarker, endMarker) => {
    const start = player.indexOf(startMarker);
    const end = player.indexOf(endMarker, start);
    assert.ok(start >= 0, 'start marker present: ' + startMarker);
    assert.ok(end > start, 'end marker present: ' + endMarker);
    return player.slice(start, end);
};

const blendSlice = sliceBetween('const MILK_FLAT_BLEND', 'function ensureMilkBuffers');
const renderSlice = sliceBetween('const MILK_TIER_SCALE', 'function activateTunedVoicePair');
const drawSlice = sliceBetween('function draw(now)', 'const QUALITY_TIERS');

const vsyncApi = runInSandbox('js/r3-ghost-vsync.js', {}).R3GhostVsync;
const profileFor = (win, warpActive, mode) =>
    new Function('window', 'isAiWarpActive', 'currentAiWarpMode',
        blendSlice + ';return milkBlendProfile();')(win, warpActive, mode);

/* ---------------- 30-mode confluence ---------------- */

test('Phase 5: all 30 WARP_BLEND modes produce distinct milkBlendProfile outputs', () => {
    assert.equal(vsyncApi.warpModes.length, 30, 'thirty WARP_BLEND modes exported');
    const win = { R3GhostVsync: vsyncApi };
    const idle = JSON.stringify(profileFor(win, false, 'aurora'));
    const seen = new Set();
    for (const mode of vsyncApi.warpModes) {
        const p = profileFor(win, true, mode);
        const key = JSON.stringify(p);
        assert.notEqual(key, idle, mode + ' alters the idle blend');
        seen.add(key);
        assert.ok(['screen', 'lighter', 'soft-light'].includes(p.blendOp), mode + ' elects a valid blendOp');
    }
    assert.equal(seen.size, 30, 'every mode yields a unique profile');
});

test('Phase 5: milkBlendProfile keys off the live currentAiWarpMode with an aurora fallback', () => {
    assert.match(blendSlice, /isAiWarpActive \? \(currentAiWarpMode \|\| 'aurora'\) : ''/);
    assert.ok(!/isAiWarpActive \? 'aurora' : ''/.test(blendSlice), 'the hardcoded aurora key is gone');
    const win = { R3GhostVsync: vsyncApi };
    assert.deepEqual(profileFor(win, true, ''), profileFor(win, true, 'aurora'),
        'an empty live mode falls back to aurora');
});

test('Phase 5: warp modes spread across the lighter/soft-light/screen composite ops', () => {
    const win = { R3GhostVsync: vsyncApi };
    assert.equal(profileFor(win, true, 'newblue_neon_edges').blendOp, 'lighter', 'hot glow pushes lighter');
    assert.equal(profileFor(win, true, 'cybergrid').blendOp, 'soft-light', 'line-heavy pushes soft-light');
    assert.equal(profileFor(win, true, 'liquid').blendOp, 'screen', 'the rest ride screen');
});

/* ---------------- composite + master scaling parity ---------------- */

test('Phase 5: renderMilkdrop honours preset.composite, modulated by the warp blendOp', () => {
    assert.match(renderSlice, /MILK_COMPOSITE_OPS\[preset\.composite\] \? preset\.composite : 'screen'/);
    assert.match(renderSlice, /isAiWarpActive && mb\.blendOp && MILK_COMPOSITE_OPS\[mb\.blendOp\]/);
    assert.match(renderSlice, /gctx\.globalCompositeOperation = compositeOp/);
    assert.ok(!/gctx\.globalCompositeOperation = 'source-over'/.test(renderSlice),
        'the final milk lay-down no longer hardcodes source-over');
});

test('Phase 5: Global Opacity 0% silences MilkDrop through the master scale', () => {
    assert.match(renderSlice,
        /const masterScale = clamp01\(\(\+masterOpacity \|\| 0\) \*\s*\(0\.35 \+ 0\.65 \* clamp01\(masterControls\.effectIntensity\)\)\);/);
    assert.match(renderSlice, /if \(masterScale <= 0\.001\) return;/);
    assert.match(renderSlice, /clamp01\(milk\.opacity\) \* masterScale/);
});

test('Phase 5: Soft-Eye calm cap rides the final milk alpha', () => {
    assert.match(renderSlice, /if \(SOFT\.enabled\) finalAlpha \*= lerp\(0\.58, 1\.0, softK\(\)\);/);
});

/* ---------------- hardlight damp + Phase 6 first-class state ---------------- */

test('Phase 5/6: hard light damps petal lightness/alpha and the final alpha by 0.78 off first-class state', () => {
    assert.match(renderSlice, /const hardLightOn = isHardLightActive;/,
        'the Phase 5 body-class read is replaced by first-class state');
    assert.match(renderSlice, /const petalDamp = hardLightOn \? 0\.78 : 1;/);
    assert.match(renderSlice, /if \(hardLightOn\) finalAlpha \*= 0\.78;/);
});

test('Phase 6: HARD LIGHT is module state with a persisted default-OFF restore', () => {
    assert.match(player, /let isHardLightActive = false;/, 'fresh installs default to OFF');
    assert.match(player, /localStorage\.getItem\('glitch-hard-light'\) === '1'/, 'restore reads the stored flag');
    assert.match(player, /setHardLight\(saved\);/, 'the restore flows through the single setHardLight path');
    assert.match(player, /setHardLight\(!isHardLightActive, \{ persist: true \}\);/,
        'only the user click persists');
    assert.match(player,
        /if \(opts && opts\.persist\) \{\s*try \{ localStorage\.setItem\('glitch-hard-light', next \? '1' : '0'\); \} catch \(e\) \{\}\s*\}/,
        'preset / ZERO ALL traffic never writes storage');
    assert.match(player, /toggleUserLock\('hardLight'\)/, 'shift-click lock parity with the slider lock buttons');
});

test('Phase 6: capture, apply and ZERO ALL route through setHardLight and respect the hand lock', () => {
    assert.match(player, /hardLight: isHardLightActive,/, 'captureSettings saves the first-class state');
    assert.match(player,
        /if \(typeof s\.hardLight === 'boolean' && !sliderLocks\.hardLight\) \{\s*setHardLight\(s\.hardLight\);\s*\}/,
        'applySettings drives the state switch, not the button');
    assert.ok(!player.includes('hlBtn.click()'), 'no preset path clicks the HARD-LIGHT button any more');
    assert.match(player, /if \(!sliderLocks\.hardLight\) setHardLight\(false\);/,
        'ZERO ALL stands hard light down unless user-locked');
});

test('Phase 6: randomizers never touch hard light, so a locked state cannot be overwritten', () => {
    const randomize = sliceBetween('function randomizeBoard()', 'function applyRandomSeed');
    const seeded = sliceBetween('function applyRandomSeed(seed)', 'if (randomSeedSlider)');
    assert.doesNotMatch(randomize + seeded, /hardLight|hard-light/i);
});

/* Runs the real setHardLight source with DOM/storage stand-ins. */
function hardLightSandbox() {
    const src = player.slice(player.indexOf('function setHardLight(on, opts)'),
        player.indexOf('(function bindHardLight()'));
    assert.ok(src.length > 0, 'setHardLight found');
    const store = {};
    const bodyClasses = new Set();
    const btn = {
        attrs: {}, classes: new Set(), textContent: '',
        classList: { toggle(c, on) { if (on) btn.classes.add(c); else btn.classes.delete(c); } },
        setAttribute(k, v) { btn.attrs[k] = v; }
    };
    const sandbox = {
        isHardLightActive: false,
        sliderLocks: { hardLight: false },
        document: {
            body: { classList: { toggle(c, on) { if (on) bodyClasses.add(c); else bodyClasses.delete(c); } } },
            getElementById: () => btn
        },
        localStorage: { setItem(k, v) { store[k] = v; }, getItem(k) { return k in store ? store[k] : null; } }
    };
    vm.createContext(sandbox);
    const run = (code) => vm.runInContext(code, sandbox);
    run(src);
    return { run, store, bodyClasses, btn };
}

const ZERO_LINE = 'if (!sliderLocks.hardLight) setHardLight(false);';
const APPLY_LINE = "if (typeof s.hardLight === 'boolean' && !sliderLocks.hardLight) { setHardLight(s.hardLight); }";

test('Phase 6: state round-trips Save Preset → ZERO ALL → Load Preset and syncs class/label/ARIA', () => {
    const { run, store, bodyClasses, btn } = hardLightSandbox();
    run('setHardLight(true, { persist: true })');
    assert.equal(run('isHardLightActive'), true);
    assert.equal(store['glitch-hard-light'], '1', 'the user toggle persists');
    assert.ok(bodyClasses.has('hard-light'));
    assert.equal(btn.attrs['aria-pressed'], 'true');
    assert.match(btn.textContent, /HARD-LIGHT: ON/);
    const saved = run('isHardLightActive');            /* Save Preset: hardLight: isHardLightActive */
    run(ZERO_LINE);                                    /* ZERO ALL */
    assert.equal(run('isHardLightActive'), false);
    assert.ok(!bodyClasses.has('hard-light'));
    assert.equal(store['glitch-hard-light'], '1', 'ZERO ALL never rewrites the stored user toggle');
    run('var s = { hardLight: ' + saved + ' };');      /* Load Preset */
    run(APPLY_LINE);
    assert.equal(run('isHardLightActive'), true, 'the preset restores hard light');
    assert.ok(bodyClasses.has('hard-light'));
    assert.equal(btn.attrs['aria-pressed'], 'true');
});

test('Phase 6: a hand lock blocks ZERO ALL and preset overwrites', () => {
    const { run } = hardLightSandbox();
    run('setHardLight(true, { persist: true })');
    run('sliderLocks.hardLight = true');
    run(ZERO_LINE);
    assert.equal(run('isHardLightActive'), true, 'locked hard light survives ZERO ALL');
    run('var s = { hardLight: false };');
    run(APPLY_LINE);
    assert.equal(run('isHardLightActive'), true, 'locked hard light survives a preset');
    run('sliderLocks.hardLight = false');
    run(ZERO_LINE);
    assert.equal(run('isHardLightActive'), false, 'unlocked again, ZERO ALL turns it off');
});

test('Phase 6: --moon-veil-k scales with Global Opacity and Soft-Eye calm', () => {
    const veil = sliceBetween('let moonVeilK = -1;', 'function softEar');
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const kFor = (op, enabled, k) => new Function('masterOpacity', 'SOFT', 'softK', 'clamp01', 'lerp',
        veil + '; return moonVeilTarget();')(op, { enabled }, () => k, clamp01, lerp);
    assert.equal(kFor(0, false, 1), 0, 'Global Opacity 0% fades the veil out');
    assert.equal(kFor(1, false, 0), 1, 'Soft-Eye off leaves the veil at full strength');
    assert.equal(kFor(1, true, 0), 0.55, 'a calm Soft-Eye softens the veil to 55%');
    assert.equal(kFor(1, true, 1), 1, 'a crescendo swells the veil back to 100%');
    assert.equal(kFor(0.5, true, 0.5), 0.5 * lerp(0.55, 1.0, 0.5), 'opacity and calm multiply');
    assert.match(player, /applyMasterFilters\(\);\s*updateMoonVeil\(\);/, 'the frame loop drives the property');
    assert.match(player, /document\.body\.style\.setProperty\('--moon-veil-k', k\.toFixed\(3\)\);/);
    const css = readWeb('css/glitch-player.css');
    assert.match(css, /#moon-veil \{[\s\S]*?opacity: calc\(0\.85 \* var\(--moon-veil-k, 1\)\);/,
        'the soft-light veil reads the custom property');
    assert.match(css, /body\.hard-light #moon-veil \{[\s\S]*?opacity: var\(--moon-veil-k, 1\);/,
        'the hard-light overlay veil reads it too');
});

test('Phase 6: washout-pair holds tighten by 25% while hard light is ON', () => {
    const wash = sliceBetween('function antiWashoutStep', 'AESTHETIC BURST SYSTEM');
    const seq = wash.match(/let effectiveHold = holdMs;[\s\S]*?if \(isHardLightActive\) effectiveHold \*= 0\.75;/);
    assert.ok(seq, 'the hard-light tighten follows the energy patience scale');
    const holdFor = (hardOn) => new Function('holdMs', 'isAiWarpActive', 'WARP_BLEND_EFFECTS', 'a', 'b',
        'R16', 'isHardLightActive', seq[0] + '; return effectiveHold;')(
        1000, false, new Set(), 'X', 'Y', { washHold: () => 1 }, hardOn);
    assert.equal(holdFor(false), 1000);
    assert.equal(holdFor(true), 750);
});

test('Phase 6: syncR3Engine hands the R3 bank the hard-light flag and bindR3Context trims bloom by 0.82', () => {
    assert.match(player, /engine\.hardLight = isHardLightActive;/);
    const r3 = readWeb('js/r3-factories.js');
    const read = r3.indexOf("glowMult: (0.9 + videoPalette.energy * 0.25) * (engine.hardLight ? 0.82 : 1)");
    assert.ok(read > r3.indexOf('END VERBATIM'), 'the engine-side read lives in the host adapter, not the pinned source');
});

/* ---------------- reduced motion ---------------- */

test('Phase 5: prefers-reduced-motion freezes phase/zoom and stands auto-advance down', () => {
    assert.match(renderSlice, /prefers-reduced-motion: reduce/);
    assert.match(renderSlice, /!still && !milk\.hold && now >= milk\.advanceAt/);
    assert.match(renderSlice, /const zoom = still \? 1 :/);
    assert.match(renderSlice, /const spin = still \? 0 :/);
    assert.match(renderSlice, /const t = still \? 0 :/);
});

/* ---------------- render budget ---------------- */

test('Phase 5: bass === 0 from a live EAR calms the mandala instead of jumping to drive', () => {
    assert.ok(!/\(es && es\.bass\) \|\| drive/.test(renderSlice), 'the || drive coercion is gone');
    const earExpr = renderSlice.match(/const earLive = (.+);/)[1];
    const bassExpr = renderSlice.match(/const bass = clamp01\(([\s\S]+?)\);\s*\n\s*const mid/)[1];
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const bassOf = new Function('es', 'drive', 'mb', 'vb', 'clamp01',
        'const earLive = ' + earExpr + '; return clamp01(' + bassExpr + ');');
    const mb = { ear: 1 }, vb = { rhythm: 0 };
    assert.equal(bassOf({ active: true, bass: 0 }, 0.9, mb, vb, clamp01), 0,
        'a quiet live EAR yields a calm 0 bass');
    assert.ok(bassOf(null, 0.9, mb, vb, clamp01) > 0.7, 'no EAR falls back to drive');
    assert.ok(bassOf({ active: false, bass: 1 }, 0.1, mb, vb, clamp01) < 0.15,
        'an inactive EAR falls back to drive, not its stale bass');
});

test('Phase 5: the petal loop carries no filter blur — soft gradient stops instead', () => {
    const petals = sliceBetween('/* soft liquid blooms', 'fb.save(');
    assert.ok(!/blur\(/.test(petals), 'no blur anywhere in the petal loop');
    assert.ok(!/\.filter = '(?!none)/.test(petals), "only filter = 'none' resets allowed");
    assert.match(petals, /addColorStop\(0\.8,/, 'an extra soft alpha stop replaces the blur falloff');
});

test('Phase 5: milk buffers scale with the quality tier and budget the feedback blur', () => {
    assert.match(renderSlice, /const MILK_TIER_SCALE = \[0\.5, 0\.38, 0\.28\];/);
    assert.match(renderSlice, /MILK_TIER_SCALE\[qualityTier\]/);
    assert.match(renderSlice, /qualityTier >= 2 \? 'none'/);
    assert.match(renderSlice, /qualityTier === 0 \? ' blur\(/);
});

test('Phase 5: no synchronous localStorage.setItem inside the render/draw path', () => {
    assert.ok(!/localStorage\.setItem/.test(renderSlice), 'renderMilkdrop never touches storage');
    assert.ok(!/localStorage\.setItem/.test(drawSlice), 'draw() never touches storage');
    assert.ok(!/saveVoiceFxControls\(\)/.test(renderSlice), 'renderMilkdrop defers persistence');
    assert.match(renderSlice, /scheduleVoiceFxSave\(\);/);
    assert.match(player, /function scheduleVoiceFxSave\(\) \{\s*if \(voiceFxSaveTimer\) return;\s*voiceFxSaveTimer = setTimeout\(/);
    assert.match(player, /\}, 500\);\s*\n\s*\}/, 'persistence debounces at ~500 ms');
});

/* ---------------- seeded deck + UI + anti-washout ---------------- */

test('Phase 5: orderMilkDeck accepts an rng and shuffles deterministically', () => {
    const deckSlice = sliceBetween('function orderMilkDeck', 'function setMilkActive');
    const order = new Function(deckSlice + ';return orderMilkDeck;')();
    const bank = Array.from({ length: 80 }, (_, i) =>
        ({ id: i + 1, family: 'F' + Math.floor(i / 10), hueOffset: (i * 47) % 360 }));
    const mulberry32 = (a) => function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const a = order(bank, mulberry32(1234)).map((p) => p.id);
    const b = order(bank, mulberry32(1234)).map((p) => p.id);
    const c = order(bank, mulberry32(4321)).map((p) => p.id);
    assert.deepEqual(a, b, 'the same seed yields the same deck');
    assert.notDeepEqual(a, c, 'a different seed yields a different deck');
    assert.equal(new Set(a).size, 80, 'all 80 presets survive the seeded shuffle');
    assert.equal(new Set(order(bank).map((p) => p.id)).size, 80, 'rng stays optional');
});

test('Phase 5: setMilkActive seeds the deck and the dock gains prev/next/hold controls', () => {
    assert.match(player, /orderMilkDeck\(MILK_PRESETS, milkDeckRng\(\)\)/);
    assert.match(player, /function milkDeckRng\(\)[\s\S]{0,400}mulberry32\(/);
    assert.match(player, /milkBtn\.id = 'aiwMilkBtn';/);
    assert.match(player, /milkPrev\.id = 'aiwMilkPrev';/);
    assert.match(player, /milkNext\.id = 'aiwMilkNext';/);
    assert.match(player, /milkHold\.id = 'aiwMilkHold';/);
    assert.match(player, /milkSlider\.id = 'aiwMilkOpacity';/);
    const step = sliceBetween('function milkStep(delta)', 'function renderMilkdrop');
    assert.match(step, /if \(!voiceFxLocks\.milkOpacity\) milk\.target = milk\.preset\.opacity;/,
        'manual stepping respects the milk opacity lock');
});

test('Phase 5: antiWashoutStep pulls a sustained MilkDrop + chroma-wash stack down', () => {
    const wash = sliceBetween('function antiWashoutStep', 'AESTHETIC BURST SYSTEM');
    assert.match(wash, /__milkWash/);
    assert.match(wash, /milk\.active && !voiceFxLocks\.milkOpacity/);
    assert.match(wash, /effectAlphas\['HSL Rainbow'\]/);
    assert.match(wash, /effectAlphas\['Neon Grad'\]/);
});
