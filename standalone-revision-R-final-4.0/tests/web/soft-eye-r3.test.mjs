import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readWeb } from './harness.mjs';

const player = readWeb('js/glitch-player.js');
const r3 = readWeb('js/r3-factories.js');
const ghost = readWeb('js/r3-ghost-vsync.js');

/* ------------------------------------------------------------------------- *
 *  Engine sandbox with a controllable clock                                  *
 * ------------------------------------------------------------------------- */
function engineSandbox() {
    const clock = { now: 0 };
    const sandbox = { performance: { now: () => clock.now } };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(readWeb('js/glitch-engine.js'), sandbox, { filename: 'js/glitch-engine.js' });
    assert.ok(sandbox.GlitchEngine, 'glitch-engine.js defines GlitchEngine');
    return { E: sandbox.GlitchEngine, clock };
}

/* ------------------------------------------------------------------------- *
 *  1. R3 softEyeK zero-coercion fix                                          *
 * ------------------------------------------------------------------------- */
test('r3-factories honors engine.softEyeK = 0: the calm phase is never coerced to 1', () => {
    assert.ok(r3.includes('Number.isFinite(engine.softEyeK) ? engine.softEyeK : 1'),
        'the Number.isFinite coercion guard exists');
    assert.doesNotMatch(r3, /softEyeK\s*\|\|\s*1\b/, 'no softEyeK || 1 zero-coercion remains in r3-factories');
    assert.doesNotMatch(ghost, /softEyeK\s*\|\|\s*1\b/, 'no softEyeK || 1 zero-coercion remains in r3-ghost-vsync');
    const stmt = r3.match(/SOFT\.k = clamp01\(\(engine\.softEyeK[\s\S]*?\);/)?.[0];
    assert.ok(stmt, 'the bindR3Context SOFT.k statement exists');
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const evalK = (softEyeK) => new Function('engine', 'clamp01', 'blend',
        'const SOFT = {}; ' + stmt + ' return SOFT.k;')({ softEyeK }, clamp01, { softEye: 1 });
    assert.equal(evalK(0), 0, 'softEyeK = 0 stays 0 (the calm phase is real)');
    assert.equal(evalK(0.4), 0.4);
    assert.equal(evalK(1), 1);
    assert.equal(evalK(undefined), 1, 'a missing softEyeK still defaults to 1');
    assert.equal(evalK(NaN), 1, 'NaN falls back to 1 instead of poisoning the blend');
});

/* ------------------------------------------------------------------------- *
 *  2. 43-voice SOFT_EYE tables + CHROMA_VOICES + softGroupAllowed            *
 * ------------------------------------------------------------------------- */
test('SOFT_EYE calmCaps and paintCalm cover all 43 voices', () => {
    const { E } = engineSandbox();
    const voices = Object.keys(E.VOICES);
    assert.equal(voices.length, 43, 'the engine knows all 43 voices');
    for (const name of voices) {
        const cap = E.SOFT_EYE.calmCaps[name];
        assert.ok(typeof cap === 'number' && cap > 0 && cap < 1, `calmCaps[${name}] is a real calm ceiling`);
        const paint = E.SOFT_EYE.paintCalm[name];
        assert.ok(typeof paint === 'number' && paint > 0 && paint <= 1, `paintCalm[${name}] is a real calm multiplier`);
        assert.ok(E.softCap(name, 1, 0) <= cap + 1e-9, `softCap honors the ${name} calm ceiling`);
    }
    /* calm Flash/Strobe stay far inside the photosensitivity hard ceilings */
    assert.ok(E.SOFT_EYE.calmCaps['Flash'] <= 0.20 && E.SOFT_EYE.calmCaps['Strobe'] <= 0.35);
});

test('busyVoices carries the busy R3 and AI-Warp voices', () => {
    const { E } = engineSandbox();
    for (const name of ['R3 Gemini Bomb', 'R3 Data Bomb', 'R3 Tech Artist', 'R3 VHS Glitch',
        'Cyber Rain', 'Signal Tear', 'Temporal Slices', 'Tracking Tear']) {
        assert.ok(E.SOFT_EYE.busyVoices.includes(name), `${name} is a busy voice`);
    }
});

test('CHROMA_VOICES includes the R3 twins and colour-led AI-Warp projectors', () => {
    const { E } = engineSandbox();
    for (const name of ['R3 HSL Rainbow', 'R3 Neon Grad', 'R3 Hue/Color Cycle', 'Chromatic Echo', 'Prism Rift']) {
        assert.ok(E.CHROMA_VOICES.includes(name), `${name} is chroma`);
        assert.ok(E.isChromaVoice(name), `isChromaVoice(${name})`);
    }
});

test('softGroupAllowed gates high-flash combinations until softK > 0.35', () => {
    const { E } = engineSandbox();
    /* single lights stay on the stricter 0.45 crescendo gate */
    assert.equal(E.softGroupAllowed(['Flash', 'ASCII'], 0.2), false);
    assert.equal(E.softGroupAllowed(['Flash', 'ASCII'], 0.5), true);
    /* stacked high-flash pairs wait for softK > 0.35 */
    assert.equal(E.softGroupAllowed(['B&W Invert', 'R3 B&W Invert'], 0.2), false);
    assert.equal(E.softGroupAllowed(['B&W Invert', 'R3 B&W Invert'], 0.35), false);
    assert.equal(E.softGroupAllowed(['B&W Invert', 'R3 B&W Invert'], 0.4), true);
    assert.equal(E.softGroupAllowed(['Flash', 'Strobe'], 0.4), false, 'both lights still wait for 0.45');
    assert.equal(E.softGroupAllowed(['B&W Invert', 'Scanlines'], 0.0), true, 'a lone dia voice passes calm');
});

/* ------------------------------------------------------------------------- *
 *  3 + 4. feedVisual drives the crescendo/burst gate; ear.reset clears state *
 * ------------------------------------------------------------------------- */
function feedFrames(ear, clock, frames, energy, motion, opts) {
    const dt = 1 / 30;
    for (let i = 0; i < frames; i++) {
        clock.now += dt * 1000;
        ear.feedVisual(energy, motion, dt, opts);
    }
}

test('feedVisual activates the ear and derives distinct bass/mid/treb bands', () => {
    const { E, clock } = engineSandbox();
    const ear = E.createEar();
    feedFrames(ear, clock, 150, 0.6, 0.2, { source: 'canvas' });
    const st = ear.state;
    assert.equal(st.active, true, 'nonzero visual frames arm the ear');
    assert.equal(st.source, 'canvas', 'the badge stays honest');
    assert.equal(st.ready, true, 'the AGC warms past 3.5 s');
    assert.ok(st.bass > 0.3, 'bass follows low-passed luminance');
    assert.ok(st.bass - st.mid > 0.05, 'bass and mid are distinct bands');
    assert.ok(st.mid - st.treb > 0.03, 'mid and treb are distinct bands');
    /* a motion spike lifts treb through the frame-to-frame delta */
    const trebBefore = st.treb;
    feedFrames(ear, clock, 10, 0.6, 0.95, { source: 'canvas' });
    assert.ok(st.treb > trebBefore + 0.1, 'high-frequency motion drives treb');
});

test('feedVisual held frames silence the ear honestly (paused media)', () => {
    const { E, clock } = engineSandbox();
    const ear = E.createEar();
    feedFrames(ear, clock, 60, 0.7, 0.4, { source: 'yt-vis' });
    assert.equal(ear.state.active, true);
    assert.equal(ear.state.source, 'yt-vis');
    feedFrames(ear, clock, 30, 0.7, 0.4, { source: 'yt-vis', held: true });
    assert.equal(ear.state.active, false, 'held playback stands the ear down');
    assert.ok(ear.state.level < 0.1, 'the level decays to silence while held');
});

test('a visual drop opens the crescendo and the burst gate fires from the visual ear', () => {
    const { E, clock } = engineSandbox();
    const ear = E.createEar();
    /* quiet warm-up, then a hard visual drop */
    feedFrames(ear, clock, 150, 0.08, 0.02, { source: 'canvas' });
    feedFrames(ear, clock, 15, 0.95, 0.85, { source: 'canvas' });
    assert.ok(ear.state.drop > 0.48, `the drop detector hears the flash (drop=${ear.state.drop.toFixed(2)})`);
    const cresc = E.createCrescendo({ rng: () => 0 });
    cresc.step(clock.now, 1 / 30, ear.state);
    cresc.step(clock.now + 33, 1 / 30, ear.state);
    assert.equal(cresc.phase(), 'swell', 'the visual drop calls a crescendo');
    const gate = E.createBurstGate({ rng: () => 0 });
    gate.step(clock.now, 1 / 30, 0.8, ear.state);   /* the visual onset pulls the burst forward */
    let env = 0;
    for (let i = 1; i <= 20 && !(env > 0); i++) env = gate.step(clock.now + i * 33, 1 / 30, 0.8, ear.state);
    assert.ok(gate.state.count >= 1, 'the wild gate fires with an active visual ear');
    assert.ok(env > 0, 'the burst envelope opens');
});

test('ear.reset clears peakHold, the hist ring and every band', () => {
    const { E, clock } = engineSandbox();
    const ear = E.createEar();
    feedFrames(ear, clock, 200, 0.9, 0.7, { source: 'canvas' });
    assert.ok(ear.state.peakHold > 0.4, 'a loud source raises the peak hold');
    assert.ok(ear.state.level > 0.3);
    ear.reset();
    const st = ear.state;
    assert.equal(st.peakHold, 0.2, 'peakHold returns to its seed');
    assert.equal(st.level, 0); assert.equal(st.bass, 0);
    assert.equal(st.mid, 0); assert.equal(st.treb, 0);
    assert.equal(st.build, 0); assert.equal(st.drop, 0);
    assert.equal(st.buildCredit, 0); assert.equal(st.beat, 0);
    assert.equal(st.warm, 0); assert.equal(st.ready, false);
    assert.equal(st.active, false); assert.equal(st.source, 'none');
    /* one loud frame after reset cannot fake a drop: the hist ring is empty */
    clock.now += 33;
    ear.feedVisual(0.95, 0.9, 1 / 30, { source: 'canvas' });
    assert.equal(st.drop, 0, 'no stale history survives a reset');
});

test('resetEarForSource is wired into every source-switch entry point', () => {
    assert.ok(player.includes('function resetEarForSource(kind)'), 'the unified hook exists');
    const hook = player.slice(player.indexOf('function resetEarForSource(kind)'), player.indexOf('}', player.indexOf('SOFT.audioSource = kind')) + 1);
    assert.ok(hook.includes('SOFT.earAud') && hook.includes('SOFT.earVis'), 'both ears are reset');
    const start = player.slice(player.indexOf('function startPlayback('), player.indexOf('let activeLoopVideoId'));
    assert.ok(start.includes("resetEarForSource('youtube')"), 'startPlayback resets the ears');
    const localAt = player.indexOf('async function playLocalFile(');
    const localResetAt = player.indexOf("resetEarForSource(isAudio ? 'local-audio' : 'local-video')");
    assert.ok(localAt >= 0 && localResetAt > localAt, 'playLocalFile resets the ears');
    const canvasBind = player.slice(player.indexOf('(function bindTestCanvas()'), player.indexOf('*  19. Presets'));
    assert.ok(canvasBind.includes("resetEarForSource('canvas')"), 'the test canvas resets the ears');
});

/* ------------------------------------------------------------------------- *
 *  5. softStep dia burst: cancellation, locks, automation gate, restore      *
 * ------------------------------------------------------------------------- */
function diaHarness(overrides = {}) {
    const start = player.indexOf('function softStep(');
    const end = player.indexOf('/* B&W INVERT MAP', start);
    assert.ok(start >= 0 && end > start, 'the softStep section exists');
    const gate = {
        state: { count: 0 },
        envValue: 0,
        kindValue: 'dia',
        kind() { return this.kindValue; },
        step() { return this.envValue; },
        diaValue(cur, env) { return cur + (0.75 - cur) * env; }
    };
    const SOFT = {
        ok: true, enabled: true, earMode: 'canvas', audioMix: 0, audioSource: 'canvas',
        ctx: null, analyser: null, tapped: null, earAud: null,
        ear: { state: { source: 'canvas', level: 0, bass: 0, mid: 0, treb: 0, build: 0, beat: 0 } },
        earVis: { state: { source: 'canvas', level: 0, beat: 0 }, feedVisual() {} },
        cresc: { phase: () => 'wild', step: () => 0.8 },
        gate,
        k: 0.8, burst: 0, burstKind: null, burstSeen: 0, burstBwFrom: 0, burstBwRiding: false,
        beat: 0, hueSpin: 0,
        k01() { return this.k; },
        paintEar() {}
    };
    const classList = { contains: () => false, toggle: () => false };
    const context = vm.createContext({
        SOFT,
        document: {
            hidden: false,
            body: { classList },
            documentElement: { classList },
            activeElement: null,
            getElementById: () => null
        },
        player: { getPlayerState: () => 1 },
        YT: { PlayerState: { PLAYING: 1 } },
        nowPlaying: { kind: 'youtube' },
        localMediaHeld: () => false,
        localAudio: {},
        videoPalette: { energy: 0.3, motion: 0.1 },
        softCloneEar: (v) => ({ ...v }),
        hueMasterLevel: () => 0,
        clamp01: (v) => (v < 0 ? 0 : v > 1 ? 1 : v),
        effectAlphas: { 'B&W Invert': 0.2 },
        randomTargets: {},
        sliderWritten: {},
        sliderElements: {},
        sliderLocks: {},
        bwSweepActive: false,
        voiceFxLocks: { bwInvert: false },
        automationHeld: () => false,
        isEffectCancelled: () => false,
        isContinuallyRandomizing: true,
        isAutoGlitching: false,
        ...overrides
    });
    vm.runInContext(player.slice(start, end), context);
    let clock = 0;
    return {
        context, SOFT, gate,
        step() { clock += 1000 / 60; context.softStep(clock, 1 / 60); }
    };
}

test('the dia burst rides only under a live automation and restores the pre-burst target', () => {
    const h = diaHarness();
    h.gate.state.count = 1;
    h.gate.envValue = 0.6;
    h.step();
    assert.ok(h.context.effectAlphas['B&W Invert'] > 0.4, 'the allowed ride lifts B&W Invert toward 0.75');
    assert.equal(h.SOFT.burstBwRiding, true);
    h.gate.envValue = 0;
    h.step();
    assert.equal(h.context.effectAlphas['B&W Invert'], 0.2, 'the gate end restores the pre-burst target');
    assert.equal(h.context.randomTargets['B&W Invert'], 0.2);
    assert.equal(h.SOFT.burstBwRiding, false);
});

test('the dia burst never rides a locked, cancelled, or automation-idle B&W Invert', () => {
    for (const overrides of [
        { voiceFxLocks: { bwInvert: true } },
        { sliderLocks: { 'B&W Invert': true } },
        { isEffectCancelled: () => true },
        { automationHeld: () => true },
        { isContinuallyRandomizing: false, isAutoGlitching: false }
    ]) {
        const h = diaHarness(overrides);
        h.gate.state.count = 1;
        h.gate.envValue = 0.6;
        for (let i = 0; i < 5; i++) h.step();
        assert.equal(h.context.effectAlphas['B&W Invert'], 0.2, JSON.stringify(Object.keys(overrides)));
        assert.equal(h.SOFT.burstBwRiding, false);
    }
});

test('a guard rising mid-burst restores immediately; a cancelled voice lands at 0', () => {
    const h = diaHarness();
    h.gate.state.count = 1;
    h.gate.envValue = 0.6;
    h.step();
    assert.equal(h.SOFT.burstBwRiding, true);
    /* the user locks the voice mid-burst */
    h.context.voiceFxLocks.bwInvert = true;
    h.step();
    assert.equal(h.context.effectAlphas['B&W Invert'], 0.2, 'the lock pulls the ride back to the pre-burst target');
    assert.equal(h.SOFT.burstBwRiding, false);
});

test('ZERO ALL abandons a live dia ride: nothing restores B&W Invert upward', () => {
    const zero = player.slice(player.indexOf('function zeroAllEffects()'), player.indexOf("if ($('zeroAllBtn'))"));
    assert.ok(zero.includes('SOFT.burstBwRiding = false;'), 'zeroAllEffects clears the ride latch');
    assert.ok(zero.includes('SOFT.burstBwFrom = 0;'), 'zeroAllEffects clears the pre-burst snapshot');
    /* simulate the post-ZERO ALL frame: ride latch cleared, board at 0 */
    const h = diaHarness();
    h.gate.state.count = 1;
    h.gate.envValue = 0.6;
    h.step();
    assert.equal(h.SOFT.burstBwRiding, true);
    /* ZERO ALL: gate reset, latch cleared, board zeroed, automations off */
    h.gate.envValue = 0;
    h.SOFT.burstBwRiding = false;
    h.SOFT.burstBwFrom = 0;
    h.context.effectAlphas['B&W Invert'] = 0;
    h.context.isContinuallyRandomizing = false;
    for (let i = 0; i < 10; i++) h.step();
    assert.equal(h.context.effectAlphas['B&W Invert'], 0, 'the zeroed board stays at 0');
});

/* ------------------------------------------------------------------------- *
 *  6. YouTube legal visual/cadence proxy — zero audio capture                *
 * ------------------------------------------------------------------------- */
function paletteHarness({ playerState = 1, time = 42, duration = 300, rate = 1 } = {}) {
    const slice = player.slice(player.indexOf('function samplePaletteNow()'), player.indexOf('let tintAtlas'));
    /* an energetic 32x18 frame: saturated warm pixels with spatial variance */
    const data = new Uint8ClampedArray(32 * 18 * 4);
    for (let p = 0; p < 32 * 18; p++) {
        data[p * 4] = 150 + (p % 7) * 15;
        data[p * 4 + 1] = 40 + (p % 5) * 20;
        data[p * 4 + 2] = 60 + (p % 3) * 30;
        data[p * 4 + 3] = 255;
    }
    const videoPalette = {
        hue: 205, sat: 78, light: 60, energy: 0.45, contrast: 0.4, motion: 0.2,
        darkness: 0.4, held: false, colors: [], target: null, lastSampleAt: 0, valid: false
    };
    const context = vm.createContext({
        localArtEl: null,
        video: null,
        nowPlaying: { kind: 'youtube', videoId: 'gopYmb38DgM', duration },
        player: {
            getPlayerState: () => playerState,
            getCurrentTime: () => time,
            getDuration: () => duration,
            getPlaybackRate: () => rate
        },
        window: { YT: { PlayerState: { PLAYING: 1 } } },
        YT: { PlayerState: { PLAYING: 1 } },
        mainCanvas: { width: 640, height: 360 },
        paletteCtx: {
            clearRect() {}, drawImage() {},
            getImageData: () => ({ data })
        },
        palPrevL: null,
        clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
        trackTimingForVideo: () => ({ pace: 1, breath: 1, cut: 0.5 }),
        videoPalette,
        Float32Array, Math
    });
    vm.runInContext(slice, context);
    return { context, videoPalette, sample() { context.samplePaletteNow(); } };
}

test('the YouTube proxy evolves energy/motion/hue from legal player timing while playing', () => {
    const a = paletteHarness({ time: 42 });
    a.sample();
    assert.equal(a.videoPalette.held, false);
    assert.equal(a.videoPalette.valid, true);
    assert.ok(a.videoPalette.target.energy > 0.05, 'a playing track carries energy');
    const b = paletteHarness({ time: 42.21 });
    b.sample();
    assert.notEqual(a.videoPalette.target.energy, b.videoPalette.target.energy, 'the cadence breathes over time');
    assert.notEqual(a.videoPalette.target.hue, b.videoPalette.target.hue, 'the hue drifts with the track clock');
});

test('the YouTube proxy holds cleanly on pause/buffer/end: energy and motion drop to 0', () => {
    for (const playerState of [2, 3, 0, -1]) {
        const h = paletteHarness({ playerState });
        h.sample();
        assert.equal(h.videoPalette.held, true, `state ${playerState} holds`);
        assert.equal(h.videoPalette.target.energy, 0);
        assert.equal(h.videoPalette.target.motion, 0);
        assert.equal(h.videoPalette.valid, true);
    }
});

test('the proxy and the EAR path never touch an audio capture surface', () => {
    const slice = player.slice(player.indexOf('function samplePaletteNow()'), player.indexOf('let tintAtlas'));
    assert.doesNotMatch(slice, /getUserMedia|getDisplayMedia|captureStream|createMediaElementSource|AudioContext/,
        'the YouTube proxy is purely visual/cadence');
    const step = player.slice(player.indexOf('function softStep('), player.indexOf('let softHudEl'));
    assert.ok(step.includes("source: yt ? 'yt-vis' : 'canvas'"), 'the visual ear badge stays honest');
    assert.ok(step.includes('held: yt ? !!videoPalette.held : localMediaHeld()'), 'paused playback holds the visual ear');
});
