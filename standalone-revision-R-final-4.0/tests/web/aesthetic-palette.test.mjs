import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, readWeb } from './harness.mjs';

const player = readWeb('js/glitch-player.js');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'webui', 'data', 'effects.manifest.json'), 'utf8'));
const voiceIds = new Set(manifest.voices.map((v) => v.id));

function readGroups() {
    const start = player.indexOf('          const AESTHETIC_GROUPS = {');
    assert.ok(start > 0, 'AESTHETIC_GROUPS block');
    const end = player.indexOf('\n          };', start);
    assert.ok(end > start, 'AESTHETIC_GROUPS end');
    const context = vm.createContext({});
    vm.runInContext(player.slice(start, end) + '\n          };\n          globalThis.groups = AESTHETIC_GROUPS;', context);
    return context.groups;
}

const groups = readGroups();
const NEW_GROUPS = ['prismDrift', 'moonlightVeil', 'glyphRainfall', 'crtDaydream'];
const PHASE4_GROUPS = ['r3Aurora', 'r3CyberGrid', 'r3TapeBroadcast', 'r3PrismMatrix', 'temporalRift', 'orbitalSignal'];

test('the beautiful effects palette holds 22 curated groups including the R4.1.1 four and the Phase 4 six', () => {
    assert.equal(Object.keys(groups).length, 22);
    for (const key of NEW_GROUPS) assert.ok(groups[key], key);
    for (const key of PHASE4_GROUPS) assert.ok(groups[key], key);
});

test('every palette group names only real voices and keeps its ranges ordered inside 0..1', () => {
    for (const [key, g] of Object.entries(groups)) {
        assert.ok(Array.isArray(g.effects) && g.effects.length >= 2, key + ' has at least two voices');
        for (const name of g.effects) assert.ok(voiceIds.has(name), key + ' names a real voice: ' + name);
        for (const name of g.suppress || []) assert.ok(voiceIds.has(name), key + ' suppresses a real voice: ' + name);
        for (const range of [g.peakRange, g.dipRange]) {
            assert.ok(range[0] >= 0 && range[1] <= 1 && range[0] <= range[1], key + ' range inside 0..1');
        }
        for (const span of [g.holdMs, g.dipMs, g.restMs]) {
            assert.ok(span[0] > 0 && span[1] >= span[0], key + ' timing span ordered');
        }
        assert.ok(g.dipRange[1] < g.peakRange[1], key + ' dips below its peak');
    }
});

test('the four R4.1.1 groups are light-free and rest long enough to breathe', () => {
    for (const key of NEW_GROUPS) {
        const g = groups[key];
        for (const name of g.effects) {
            const base = name.replace(/^R3 /, '');
            assert.ok(base !== 'Flash' && base !== 'Strobe', key + ' stays light-free');
        }
        assert.ok(g.restMs[0] >= 5000, key + ' rests at least five seconds');
        assert.ok(g.holdMs[0] >= 2000, key + ' holds its scene calmly');
        assert.ok(g.peakRange[1] <= 0.9, key + ' peaks below full blast');
    }
});

test('the Phase 4 six are light-free, calm, and never peak at full blast', () => {
    for (const key of PHASE4_GROUPS) {
        const g = groups[key];
        for (const name of g.effects) {
            const base = name.replace(/^R3 /, '');
            assert.ok(base !== 'Flash' && base !== 'Strobe', key + ' stays light-free');
        }
        assert.ok(g.restMs[0] >= 5000, key + ' rests at least five seconds');
        assert.ok(g.holdMs[0] >= 2000, key + ' holds its scene calmly');
        assert.ok(g.peakRange[1] <= 0.9, key + ' peaks below full blast');
    }
});

test('every R3 voice and every AI-Warp voice sings in at least one curated group', () => {
    const covered = new Set();
    for (const g of Object.values(groups)) for (const name of g.effects) covered.add(name);
    const r3Voices = [...voiceIds].filter((id) => id.startsWith('R3 '));
    assert.equal(r3Voices.length, 17, 'seventeen R3 voices in the manifest');
    for (const name of r3Voices) assert.ok(covered.has(name), 'R3 coverage: ' + name);
    const warpVoices = ['Chromatic Echo', 'Temporal Slices', 'Signal Tear', 'Cyber Rain',
        'Prism Rift', 'Orbit HUD', 'Rolling Scan', 'Tape Grain', 'Tracking Tear'];
    for (const name of warpVoices) assert.ok(covered.has(name), 'AI-Warp coverage: ' + name);
});
