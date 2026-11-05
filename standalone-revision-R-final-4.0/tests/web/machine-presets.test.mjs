import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { readWeb } from './harness.mjs';

/* All 43 manifest voices the Phase 2 generator draws from. */
const ALL_43_VOICES = [
    'Neon Grad', 'Scanlines', 'Data Bands', 'HSL Rainbow', 'ASCII',
    'Font Burn', 'Gemini Bomb', 'Tech Artist', 'VHS Glitch',
    'Data Bomb', 'Ink Glyphs', 'Matrix ASCII', 'Matrix Chord',
    'B&W Invert', 'Hue/Color Cycle',
    'Flash', 'Strobe',
    'Chromatic Echo', 'Temporal Slices', 'Signal Tear', 'Cyber Rain',
    'Prism Rift', 'Orbit HUD', 'Rolling Scan', 'Tape Grain', 'Tracking Tear',
    'R3 Neon Grad', 'R3 Scanlines', 'R3 VHS Glitch', 'R3 Data Bands',
    'R3 B&W Invert', 'R3 Hue/Color Cycle', 'R3 HSL Rainbow',
    'R3 ASCII', 'R3 Font Burn', 'R3 Tech Artist', 'R3 Data Bomb',
    'R3 Ink Glyphs', 'R3 Gemini Bomb', 'R3 Matrix ASCII',
    'R3 Matrix Chord', 'R3 Ghost Spectrum', 'R3 V-Sync'
];

function loadEngine() {
    const context = vm.createContext({});
    vm.runInContext(readWeb('js/glitch-engine.js'), context, { filename: 'js/glitch-engine.js' });
    return context.GlitchEngine;
}

/* The player wrapper lives inside its closure, so its source slice runs with
   stubbed globals and the real GlitchEngine generator. */
function loadGenerator() {
    const player = readWeb('js/glitch-player.js');
    const slice = player.slice(player.indexOf('function freshMachineSeed'), player.indexOf('const LAB_EFFECT_ALIASES'));
    const factory = new Function('window', 'GlitchEngine', 'LIGHT_CEILING', 'profileNames', 'document',
        slice + ';return buildMachinePresets;');
    return factory({ crypto: webcrypto, GlitchEngine: loadEngine() }, undefined, { Flash: 0.2, Strobe: 0.35 }, [], {});
}

test('MACHINE presets are built from a fresh seed each time (start and Refresh)', () => {
    const build = loadGenerator();
    const first = build();
    const second = build();
    assert.equal(Object.keys(first).length, 80);
    assert.notEqual(first['Deepseek-2'].seed, second['Deepseek-2'].seed);
    assert.notDeepEqual(first['Deepseek-5'].alphas, second['Deepseek-5'].alphas);
});

test('a seed override rebuilds the exact same MACHINE deck (R4.1.3 determination)', () => {
    const build = loadGenerator();
    const a = build(123456789);
    const b = build(123456789);
    assert.deepEqual(a, b);
    assert.equal(build.lastSeed, 123456789);
    assert.equal(a['Deepseek-2'].seed, 123456789, 'presets carry the replayable 32-bit deck seed');
    const c = build(987654321);
    assert.notDeepEqual(a['Deepseek-5'].alphas, c['Deepseek-5'].alphas);
});

test('generated MACHINE lights stay within the Flash/Strobe caps and never peak together', () => {
    const build = loadGenerator();
    for (let run = 0; run < 5; run++) {
        const bank = build();
        for (const [name, preset] of Object.entries(bank).slice(1)) {
            assert.ok(preset.alphas.Flash <= 0.2, name + ' Flash');
            assert.ok(preset.alphas.Strobe <= 0.35, name + ' Strobe');
            assert.ok(!(preset.alphas.Flash > 0.1 && preset.alphas.Strobe > 0.175), name + ' both lights high');
        }
    }
});

test('Deepseek-1 (OLD SOUL) obeys the light caps in memory, not only on apply', () => {
    const build = loadGenerator();
    for (const seed of [0, 123456789, 987654321]) {
        const old = build(seed || undefined)['Deepseek-1'];
        assert.equal(old.tag, 'OLD SOUL');
        assert.ok(old.alphas.Flash <= 0.2, 'Flash cap');
        assert.ok(old.alphas.Strobe <= 0.35, 'Strobe cap');
    }
});

test('all 43 manifest voices appear across a generated 80-preset MACHINE deck', () => {
    const build = loadGenerator();
    for (const seed of [123456789, 987654321, 42]) {
        const bank = build(seed);
        const active = new Set();
        for (const preset of Object.values(bank)) {
            for (const [voice, alpha] of Object.entries(preset.alphas)) {
                assert.ok(ALL_43_VOICES.includes(voice), 'unknown voice ' + voice);
                if (alpha > 0) active.add(voice);
            }
            for (const voice of ALL_43_VOICES) {
                assert.ok(voice in preset.alphas, preset.tag + ' missing ' + voice);
            }
        }
        assert.equal(active.size, 43, 'seed ' + seed + ' active voices: ' + active.size);
    }
});

test('every MACHINE preset defines glyphBank, voiceFx, hardLight and milk (no stale LAB state)', () => {
    const build = loadGenerator();
    const bank = build(123456789);
    for (const [name, preset] of Object.entries(bank)) {
        assert.equal(typeof preset.glyphBank, 'string', name + ' glyphBank');
        assert.ok(preset.glyphBank.length > 0, name + ' glyphBank empty');
        assert.ok(preset.voiceFx && typeof preset.voiceFx === 'object', name + ' voiceFx');
        assert.ok(preset.voiceFx.bwInvert >= 0 && preset.voiceFx.bwInvert <= 1, name + ' voiceFx.bwInvert');
        assert.ok(preset.voiceFx.hueOffset >= 0 && preset.voiceFx.hueOffset < 360, name + ' voiceFx.hueOffset');
        assert.equal(typeof preset.hardLight, 'boolean', name + ' hardLight');
        assert.ok(preset.milk && typeof preset.milk.active === 'boolean', name + ' milk.active');
        assert.ok(Number.isInteger(preset.milk.presetId) && preset.milk.presetId >= 1 && preset.milk.presetId <= 80,
            name + ' milk.presetId');
        assert.ok(preset.milk.opacity >= 0.35 && preset.milk.opacity <= 0.85, name + ' milk.opacity');
    }
});

test('the MACHINE glyph pick is weighted across Engine realms, All scripts and specific scripts', () => {
    const build = loadGenerator();
    const counts = { engine: 0, all: 0, specific: 0 };
    for (const seed of [11, 22, 33, 44, 55]) {
        for (const preset of Object.values(build(seed))) {
            if (preset.glyphBank === 'Engine realms (Revision 3)') counts.engine++;
            else if (preset.glyphBank === 'All scripts') counts.all++;
            else counts.specific++;
        }
    }
    assert.ok(counts.engine > 0 && counts.all > 0, 'both special banks appear');
    assert.ok(counts.specific > counts.engine + counts.all, 'specific scripts dominate (~70%)');
});

test('the engine exposes exactly one canonical buildMachinePresets and the player delegates to it', () => {
    const engine = readWeb('js/glitch-engine.js');
    assert.equal(engine.match(/function buildMachinePresets\(/g).length, 1, 'a single engine generator');
    const player = readWeb('js/glitch-player.js');
    assert.equal(player.match(/function buildMachinePresets\(/g).length, 1, 'a single thin player wrapper');
    const wrapper = player.slice(player.indexOf('function buildMachinePresets(seedOverride)'),
        player.indexOf('const LAB_EFFECT_ALIASES'));
    assert.match(wrapper, /eng\.buildMachinePresets\(seed\)/);
    assert.match(player, /function rebuildMachineBank\(customSeed\)/);
    assert.match(player, /localStorage\.getItem\(MACHINE_SEED_KEY\)/);
});

test('the MACHINE bank is not frozen', () => {
    const player = readWeb('js/glitch-player.js');
    assert.ok(!/Object\.freeze\(machinePresets\)/.test(player));
});

test('DROP THE MILK? deck keeps all 80 presets and never repeats a family back to back', () => {
    const player = readWeb('js/glitch-player.js');
    const start = player.indexOf('function orderMilkDeck');
    const slice = player.slice(start, player.indexOf('function setMilkActive'));
    const order = new Function(slice + ';return orderMilkDeck;')();
    const bank = Array.from({ length: 80 }, (_, i) => ({ id: i + 1, family: 'F' + Math.floor(i / 10), hueOffset: (i * 47) % 360 }));
    for (let run = 0; run < 20; run++) {
        const deck = order(bank);
        assert.equal(new Set(deck.map((p) => p.id)).size, 80);
        let repeats = 0;
        for (let i = 1; i < deck.length; i++) if (deck[i].family === deck[i - 1].family) repeats++;
        assert.ok(repeats <= 8, 'family repeats: ' + repeats);
    }
});

test('automatic light retargeting keeps the caps and skips a peak while the other light is high', () => {
    const player = readWeb('js/glitch-player.js');
    const start = player.indexOf('function stepLightWander');
    const body = player.slice(start, player.indexOf('function stepLightArm'));
    assert.match(body, /Math\.pow\(Math\.random\(\), lt\.pow\) \* lightCap\(name\)/);
    const traits = player.slice(player.indexOf('function rollLightTrait'), start);
    assert.match(traits, /pow: 1\.3 \+ Math\.random\(\) \* 1\.0/);
    assert.match(traits, /rate: 0\.7 \+ Math\.random\(\) \* 0\.5/);
    assert.match(body, /lightWanderAt\[name\] = now \+ 1200 \+/);
    assert.match(body, /> 0\.5 \* lightCap\(other\)\) t \*= 0\.4/);
    assert.match(body, /clampLight\(name, lightWanderTarget\[name\]/);
});
