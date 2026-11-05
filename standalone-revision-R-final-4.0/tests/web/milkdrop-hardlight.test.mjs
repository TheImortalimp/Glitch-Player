/* Phase 5 (FS-06): MilkDrop 30-mode confluence, render budget and deck UI.
   The hardlight half of this file covers the Phase 5 damp (body class driven);
   Phase 6 extends it with the first-class isHardLightActive state, persistence
   and the #moon-veil integration. Keep the section markers below so Phase 6
   tests can slot in next to their Phase 5 counterparts. */
import test from 'node:test';
import assert from 'node:assert/strict';
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

/* ---------------- hardlight damp (Phase 6 extends this section) ---------------- */

test('Phase 5: hard light damps petal lightness/alpha and the final alpha by 0.78', () => {
    assert.match(renderSlice, /document\.body\.classList\.contains\('hard-light'\)/);
    assert.match(renderSlice, /const petalDamp = hardLightOn \? 0\.78 : 1;/);
    assert.match(renderSlice, /if \(hardLightOn\) finalAlpha \*= 0\.78;/);
    /* Phase 6: replace the body-class read with first-class isHardLightActive
       and extend the assertions here (persistence, locks, ZERO ALL). */
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
