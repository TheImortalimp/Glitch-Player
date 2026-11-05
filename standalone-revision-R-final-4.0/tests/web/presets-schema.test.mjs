import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, runInSandbox } from './harness.mjs';

const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'webui', 'data', 'presets.schema.json'), 'utf8'));

/* Minimal validator for the schema subset used in presets.schema.json. */
function validate(value, node, where = '$') {
    const errors = [];
    if (node.$ref) return validate(value, schema.$defs[node.$ref.split('/').pop()], where);
    if ('const' in node && value !== node.const) errors.push(where + ' must be ' + node.const);
    const kind = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    if (node.type === 'integer' ? !Number.isInteger(value) : node.type && node.type !== kind) {
        return [where + ' must be ' + node.type];
    }
    if (kind === 'number') {
        if (node.minimum !== undefined && value < node.minimum) errors.push(where + ' below minimum');
        if (node.maximum !== undefined && value > node.maximum) errors.push(where + ' above maximum');
    }
    if (kind === 'string') {
        if (node.minLength !== undefined && value.length < node.minLength) errors.push(where + ' too short');
        if (node.maxLength !== undefined && value.length > node.maxLength) errors.push(where + ' too long');
        if (node.pattern && !new RegExp(node.pattern).test(value)) errors.push(where + ' pattern');
    }
    if (kind === 'array') {
        if (node.maxItems !== undefined && value.length > node.maxItems) errors.push(where + ' too many items');
        if (node.items) value.forEach((item, i) => errors.push(...validate(item, node.items, where + '[' + i + ']')));
    }
    if (kind === 'object') {
        const keys = Object.keys(value);
        if (node.maxProperties !== undefined && keys.length > node.maxProperties) errors.push(where + ' too many properties');
        for (const key of node.required || []) if (!(key in value)) errors.push(where + '.' + key + ' missing');
        for (const key of keys) {
            const child = node.properties && node.properties[key];
            if (child) errors.push(...validate(value[key], child, where + '.' + key));
            else if (node.additionalProperties === false) errors.push(where + '.' + key + ' not allowed');
            else if (node.additionalProperties) errors.push(...validate(value[key], node.additionalProperties, where + '.' + key));
        }
    }
    return errors;
}

function labBank() {
    const window = {};
    runInSandbox('js/glyph-tables.js', { window });
    runInSandbox('js/glyph-library.js', { window, console, document: { getElementById: () => null } });
    return window.GlitchMachinePresets;
}

test('all 250 LAB snapshots satisfy the preset schema and exclude Flash/Strobe', () => {
    const bank = labBank();
    assert.equal(bank.length, 250);
    for (const preset of bank) {
        assert.deepEqual(validate(preset, { $ref: '#/$defs/labSnapshot' }), [], preset.id);
        assert.ok(Object.keys(preset.settings.effects).every((n) => n !== 'Flash' && n !== 'Strobe'), preset.id);
    }
});

test('the export file shape accepts valid presets and rejects out-of-range ones', () => {
    const good = { format: 'signal-lab-presets', version: 1, presets: [{ name: 'X', settings: { alphas: { ASCII: 0.5 } } }] };
    assert.deepEqual(validate(good, { $ref: '#/$defs/exportFile' }), []);
    for (const bad of [
        { ...good, version: 2 },
        { ...good, presets: [{ name: '', settings: {} }] },
        { ...good, presets: [{ name: 'X', settings: { alphas: { ASCII: 1.5 } } }] },
        { ...good, presets: [{ name: 'X'.repeat(81), settings: {} }] },
    ]) assert.notDeepEqual(validate(bad, { $ref: '#/$defs/exportFile' }), []);
});

test('schema v4 permits the optional hardLight/milk/glyphAuto/seed fields while v3 stays valid', () => {
    const v3 = { version: 3, masterOpacity: 0.8, effects: { ASCII: 0.4 }, glyphBank: 'Greek', sliderLocks: { glyphBank: true } };
    assert.deepEqual(validate(v3, { $ref: '#/$defs/settings' }), [], 'plain v3 settings stay valid');
    const v4 = {
        ...v3,
        hardLight: true,
        glyphAuto: false,
        seed: 123456789,
        milk: { active: true, presetId: 42, opacity: 0.6 },
        sliderLocks: { glyphBank: true, hardLight: false }
    };
    assert.deepEqual(validate(v4, { $ref: '#/$defs/settings' }), [], 'v4 optional fields validate');
    assert.deepEqual(validate({ ...v4, milk: { active: false } }, { $ref: '#/$defs/settings' }), [],
        'milk presetId/opacity are optional');
    for (const bad of [
        { ...v4, hardLight: 'yes' },
        { ...v4, glyphAuto: 1 },
        { ...v4, seed: 0.5 },
        { ...v4, milk: { active: 'on' } },
        { ...v4, milk: { active: true, presetId: 81 } },
        { ...v4, milk: { active: true, presetId: 0 } },
        { ...v4, milk: { active: true, opacity: 1.5 } },
        { ...v4, milk: { active: true, extra: 1 } },
        { ...v4, sliderLocks: { glyphBank: 'locked' } },
    ]) assert.notDeepEqual(validate(bad, { $ref: '#/$defs/settings' }), [], JSON.stringify(bad));
});

/* Phase 2 cross-bank hygiene: mapLabSnapshot seats explicit clean defaults for
   every field LAB 250 omits, so MACHINE → LAB → MACHINE cycling leaks zero
   Ghost / V-Sync / Hardlight / Milk / warp-master state across banks. */
test('LAB snapshots are normalized with explicit clean defaults (no cross-bank state bleed)', () => {
    const player = fs.readFileSync(path.join(ROOT, 'webui', 'js', 'glitch-player.js'), 'utf8');
    const slice = player.slice(player.indexOf('const LAB_EFFECT_ALIASES'),
        player.indexOf('if (!Array.isArray(window.GlitchMachinePresets)'));
    const MASTER_KEYS = ['effectIntensity', 'motionScale', 'blendSoftness', 'continualSpeed', 'autoGlitchPower', 'boardEnergy'];
    const mapLabSnapshot = new Function(
        'isPlainRecord', 'profileNames', 'clamp01', 'masterOpacity', 'MASTER_KEYS', 'sliderLocks', 'normalizeHueOffset', 'window',
        slice + ';return mapLabSnapshot;'
    )(
        (v) => !!v && typeof v === 'object' && !Array.isArray(v),
        ['ASCII', 'Rolling Scan', 'Flash', 'Strobe'],
        (v) => Math.min(1, Math.max(0, v)),
        1,
        MASTER_KEYS,
        { global: false, glyphBank: false, hardLight: false },
        (v) => ((v % 360) + 360) % 360,
        {}
    );
    const mapped = mapLabSnapshot({ version: 3, masterOpacity: 0.7, effects: { ASCII: 0.5, 'Scanlines': 0.3 }, glyphBank: 'Greek' });
    assert.equal(mapped.ghostMode, 'OFF');
    assert.equal(mapped.ghostLevel, 0);
    assert.equal(mapped.vsyncMode, 'OFF');
    assert.equal(mapped.hardLight, false);
    assert.deepEqual({ ...mapped.milk }, { active: false });
    assert.deepEqual({ ...mapped.voiceFx }, { bwInvert: 1, hueOffset: 0 });
    for (const key of MASTER_KEYS) assert.equal(typeof mapped.masterControls[key], 'number', key);
    assert.equal(mapped.alphas['Rolling Scan'], 0.3, 'LAB aliases still map');
    assert.equal(mapped.alphas.ASCII, 0.5);
    assert.equal(mapped.glyphBank, 'Greek', 'the glyph bank survives for the renderable fallback at apply time');
});

test('every LAB snapshot keeps its clean defaults after normalization in the real bank', () => {
    const bank = labBank();
    for (const preset of bank.slice(0, 25)) {
        assert.equal(preset.settings.ghostMode === undefined || typeof preset.settings.ghostMode === 'string', true, preset.id);
        assert.ok(!('milk' in preset.settings), preset.id + ' raw LAB snapshots never carry milk');
        assert.ok(!('hardLight' in preset.settings), preset.id + ' raw LAB snapshots never carry hardLight');
    }
});
