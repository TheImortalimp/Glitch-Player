import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readWeb } from './harness.mjs';

const player = readWeb('js/glitch-player.js');
const html = readWeb('index.html');
const css = readWeb('css/glitch-player.css');
const r4css = readWeb('css/r4.css');

test('the ear listens fully on both sources: the canvas ear is never starved and YouTube gets its boost (4.2.4)', () => {
    const step = player.slice(player.indexOf('function softStep('), player.indexOf('let softHudEl'));
    assert.ok(step.includes("nowPlaying && nowPlaying.kind === 'youtube'"), 'the YouTube picture speaks for its audio');
    assert.ok(step.includes('videoPalette.energy * (yt ? 1.25 : 1)'), 'the full-listen boost rides YouTube energy');
    assert.ok(step.includes('videoPalette.motion * (yt ? 1.3 : 1)'), 'and its motion');
    assert.ok(step.includes("SOFT.ctx.state === 'suspended' && el && !el.paused"), 'a suspended context keeps being resumed');
    assert.ok(player.includes("el.addEventListener('play', () => {"), 'the tap re-arms on every local play');
});

test('the audio and canvas levels monitor hides and shows with its own buttons and remembers the choice (4.2.4)', () => {
    assert.ok(/<button id="earHudHide" class="ear-hud-hide" type="button" title="[^"]+">/.test(html), 'the hide button sits in the monitor head');
    assert.ok(/<button id="earHudShow" type="button" hidden title="[^"]+">/.test(html), 'the show tab exists and starts hidden');
    assert.ok(player.includes("localStorage.setItem('glitch-ear-hud-open'"), 'the visibility is persisted');
    assert.ok(player.includes("localStorage.getItem('glitch-ear-hud-open') !== '0'"), 'the monitor restores its last state');
    assert.ok(css.includes('.ear-hud-hide {'), 'the hide button is styled');
    assert.ok(css.includes('pointer-events: auto'), 'the controls are clickable over the display-only monitor');
    assert.ok(css.includes('body.playback-on #earHudShow'), 'the show tab appears during playback');
    assert.ok(r4css.includes('body:not(.playback-on) #earHudShow'), 'the show tab is gated until playback like the monitor');
});

test('the EAR mode and the auto SOFT-EYE setting survive restarts (4.2.4)', () => {
    assert.ok(player.includes("localStorage.getItem('glitch-ear-mode')"), 'the ear mode is restored');
    assert.ok(player.includes("localStorage.setItem('glitch-ear-mode', SOFT.earMode)"), 'and saved on every change');
    assert.ok(player.includes("localStorage.getItem('glitch-soft-eye-on') === '0'"), 'SOFT-EYE restores an OFF choice');
    assert.ok(player.includes("localStorage.setItem('glitch-soft-eye-on', SOFT.enabled ? '1' : '0')"), 'and saves every toggle');
});

function hudHarness({ hidden = false, playback = true, pageHidden = false, capture = false, localHeld = false, playerState = 1 } = {}) {
    const operations = [], lookups = [], controlPaints = [];
    let clock = 0;
    const record = (id, kind, value) => operations.push({ id, kind, value, at: clock });
    const node = (id, classes = []) => {
        let text = '';
        const tokens = new Set(classes);
        const properties = (kind) => new Proxy({}, {
            get(target, key) {
                if (key === 'setProperty') return (name, value) => record(id, kind, { name, value });
                record(id, `${kind}-read`, key);
                return target[key] || '';
            },
            set(target, key, value) {
                record(id, kind, { name: key, value });
                // CSSOM removes trailing zeroes when serializing transform numbers.
                target[key] = kind === 'style' && key === 'transform' ?
                    value.replace(/scaleX\(([\d.]+)\)/, (_, scale) => `scaleX(${Number(scale)})`) : value;
                return true;
            }
        });
        return {
            hidden: id === 'earHud' && hidden,
            style: properties('style'),
            dataset: properties('dataset'),
            classList: {
                contains: name => tokens.has(name),
                toggle(name, force) {
                    record(id, 'class', name);
                    if (force) tokens.add(name); else tokens.delete(name);
                    return !!force;
                }
            },
            get textContent() { record(id, 'text-read'); return text; },
            set textContent(value) { record(id, 'text', value); text = value; }
        };
    };
    const ids = ['earHud', 'earHudMode', 'earHudPhase', 'earHudSrc',
        'earMeterLevel', 'earMeterBass', 'earMeterMid', 'earMeterTreb', 'earMeterBuild', 'softEyeBtn'];
    const nodes = Object.fromEntries(ids.map(id => [id, node(id)]));
    const counts = { visual: 0, crescendo: 0, gate: 0 };
    const state = { source: 'canvas', level: 0, bass: 0, mid: 0, treb: 0, build: 0, beat: 0 };
    const SOFT = {
        ok: true, enabled: true, earMode: 'auto', audioMix: 0, audioSource: 'canvas',
        ctx: null, analyser: null, tapped: null, earAud: null, ear: { state: { ...state } },
        earVis: {
            state: { ...state },
            feedVisual(energy, motion) {
                counts.visual++;
                this.state.level = energy;
                this.state.beat = motion;
            }
        },
        cresc: { phase: () => 'calm', step() { counts.crescendo++; return .2; } },
        gate: { state: { count: 0 }, kind: () => null, step() { counts.gate++; return 0; } },
        k: 0, burst: 0, burstSeen: 0, hueSpin: 0,
        k01() { return this.k; },
        paintEar() { controlPaints.push({ mode: this.earMode, mix: this.audioMix }); }
    };
    const context = vm.createContext({
        SOFT,
        document: {
            hidden: pageHidden,
            body: node('body', playback ? ['playback-on'] : []),
            documentElement: node('root', capture ? ['freeze-frame-capture'] : []),
            getElementById(id) { lookups.push(id); return nodes[id] || null; }
        },
        player: { getPlayerState: () => playerState },
        YT: { PlayerState: { PLAYING: 1 } },
        nowPlaying: { kind: 'youtube' },
        localMediaHeld: () => localHeld,
        localAudio: {},
        videoPalette: { energy: .3, motion: .1 },
        softCloneEar: value => ({ ...value }),
        hueMasterLevel: () => 0
    });
    const start = player.indexOf('function softStep(');
    const end = player.indexOf('/* B&W INVERT MAP', start);
    assert.ok(start >= 0 && end > start, 'the real EAR step/presentation section exists');
    vm.runInContext(player.slice(start, end), context);
    operations.length = 0;
    lookups.length = 0;
    return {
        context, SOFT, nodes, counts, operations, lookups, controlPaints,
        tick(now) { clock = now; context.softUpdateHud(now); },
        step(now, dt) { clock = now; context.softStep(now, dt); },
        monitorOperations() { return operations.filter(operation => operation.id.startsWith('ear')); }
    };
}

test('hidden and inactive EAR meters do no presentation work', () => {
    for (const settings of [
        { hidden: true }, { playback: false }, { pageHidden: true }, { capture: true },
        { localHeld: true }, { playerState: 2 }, { playerState: 3 }, { playerState: 0 }
    ]) {
        const harness = hudHarness(settings);
        for (let frame = 0; frame < 60; frame++) {
            harness.SOFT.ear.state.level = frame / 60;
            harness.tick(frame * 1000 / 60);
        }
        assert.equal(harness.monitorOperations().length, 0, JSON.stringify(settings));
        assert.equal(harness.lookups.filter(id => id.startsWith('ear')).length, 0, 'HUD references are cached');
    }
});

test('EAR presentation is capped at 12 Hz at different display rates and uses the shared frame timestamp', () => {
    for (const hz of [24, 60, 144]) {
        const harness = hudHarness();
        for (let frame = 0; frame < hz * 2; frame++) {
            harness.SOFT.ear.state.level = frame / (hz * 2);
            harness.tick(frame * 1000 / hz);
        }
        const paints = harness.operations.filter(op => op.id === 'earHud' && op.kind === 'class' && op.value === 'is-beat');
        assert.ok(paints.length > 0 && paints.length <= 24, `${hz} Hz display: ${paints.length} UI refreshes`);
        for (let index = 1; index < paints.length; index++) {
            assert.ok(paints[index].at - paints[index - 1].at >= 1000 / 12 - 1e-9, 'no burst or catch-up refresh');
        }
        assert.equal(harness.lookups.filter(id => id.startsWith('ear')).length, 0);
    }
});

test('EAR bars clamp values and use transforms, not layout-affecting widths', () => {
    const harness = hudHarness();
    Object.assign(harness.SOFT.ear.state, { level: 2, bass: -.5, mid: .25, treb: NaN, build: .5 });
    harness.tick(1000);
    const values = harness.operations.filter(op => op.kind === 'style' && op.id.startsWith('earMeter'));
    assert.deepEqual(values.map(op => [op.id, op.value.name, op.value.value]), [
        ['earMeterLevel', 'transform', 'scaleX(1)'],
        ['earMeterBass', 'transform', 'scaleX(0)'],
        ['earMeterMid', 'transform', 'scaleX(0.25)'],
        ['earMeterTreb', 'transform', 'scaleX(0)'],
        ['earMeterBuild', 'transform', 'scaleX(0.5)']
    ]);
    harness.operations.length = 0;
    harness.tick(1100);
    assert.equal(harness.operations.filter(op => op.kind === 'style' && op.id.startsWith('earMeter')).length, 0,
        'unchanged bar values are not rewritten');
    const rule = css.match(/\.ear-meter i \{([^}]+)\}/)?.[1] || '';
    assert.match(rule, /width:\s*100%/);
    assert.match(rule, /transform:\s*scaleX\(0\)/);
    assert.match(rule, /transform-origin:\s*(?:left|0)/);
    assert.doesNotMatch(rule, /transition:\s*width/);
    assert.match(r4css, /prefers-reduced-motion:\s*reduce[\s\S]*?transition:\s*none !important/);
});

test('hiding and reopening the meter does not consume its deadline or trigger catch-up work', () => {
    const harness = hudHarness();
    harness.tick(1000);
    harness.nodes.earHud.hidden = true;
    harness.operations.length = 0;
    harness.tick(1040);
    harness.tick(2000);
    assert.equal(harness.monitorOperations().length, 0);
    harness.nodes.earHud.hidden = false;
    harness.tick(2001);
    harness.tick(2002);
    assert.equal(harness.operations.filter(op => op.id === 'earHud' && op.kind === 'class' && op.value === 'is-beat').length, 1);
});

test('the separate EAR control remains accurate while the monitor is hidden', () => {
    const harness = hudHarness({ hidden: true });
    harness.tick(300);
    harness.SOFT.earMode = 'audio';
    harness.SOFT.audioMix = .8;
    harness.tick(600);
    assert.deepEqual(harness.controlPaints.at(-1), { mode: 'audio', mix: .8 });
    assert.equal(harness.monitorOperations().length, 0);
});

test('HUD throttling does not throttle EAR input, crescendo, or automation state progression', () => {
    const visible = hudHarness(), hidden = hudHarness({ hidden: true });
    for (const harness of [visible, hidden]) {
        for (let frame = 0; frame < 120; frame++) {
            harness.context.videoPalette.energy = .2 + frame / 300;
            harness.step(frame * 1000 / 60, 1 / 60);
        }
        assert.deepEqual(harness.counts, { visual: 120, crescendo: 120, gate: 120 });
    }
    assert.deepEqual(JSON.parse(JSON.stringify(visible.SOFT.ear.state)), JSON.parse(JSON.stringify(hidden.SOFT.ear.state)));
    assert.equal(visible.SOFT.k, hidden.SOFT.k);
    assert.equal(hidden.monitorOperations().length, 0);
    const hud = player.slice(player.indexOf('let softHudEl'), player.indexOf('/* B&W INVERT MAP'));
    assert.doesNotMatch(hud, /\b(?:requestAnimationFrame|setTimeout|setInterval)\s*\(/);
});
