import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, readWeb } from './harness.mjs';

const ENGINE = 'Engine realms (Revision 3)';
const ALL = 'All scripts';
const VOICES = ['ASCII', 'R3 ASCII', 'Matrix ASCII', 'R3 Matrix ASCII', 'Matrix Chord', 'R3 Matrix Chord',
    'Cyber Rain', 'Data Bomb', 'R3 Data Bomb', 'Ink Glyphs', 'R3 Ink Glyphs', 'Font Burn', 'R3 Font Burn'];
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const visible = (ch) => !/^\s+$/u.test(ch);

function seeded(seed = 12345) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

function assertCodePoint(ch, label) {
    assert.equal(typeof ch, 'string', label);
    assert.equal([...ch].length, 1, `${label}: ${JSON.stringify(ch)} is not one code point`);
    assert.ok(!LONE_SURROGATE.test(ch), `${label}: lone surrogate`);
}

/* Loads the real engine, then the real glyph library over it, in one context
   with the glyph select and info line stubbed. */
function glyphSandbox() {
    const elements = {
        'glyph-bank': {
            value: '', options: [],
            appendChild(option) { this.options.push(option); },
            addEventListener(type, fn) { if (type === 'change') this.change = fn; },
        },
        'glyph-info': { textContent: '', title: '' },
    };
    const sandbox = { console, document: { getElementById: (id) => elements[id] || null, createElement: () => ({}) } };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(readWeb('js/glitch-engine.js'), sandbox, { filename: 'js/glitch-engine.js' });
    const original = { pickGlyph: sandbox.GlitchEngine.pickGlyph, glyphBank: sandbox.GlitchEngine.glyphBank };
    vm.runInContext(readWeb('js/glyph-tables.js'), sandbox, { filename: 'js/glyph-tables.js' });
    vm.runInContext(readWeb('js/glyph-library.js'), sandbox, { filename: 'js/glyph-library.js' });
    return { sandbox, G: sandbox.SignalGlyphs, E: sandbox.GlitchEngine, original, elements };
}

test('Revision 3 engine typesets hand out whole Unicode code points, including astral glyphs', () => {
    const { original } = glyphSandbox();
    let astral = 0;
    for (const realm of ['reality', 'virtual', 'mix']) {
        const bank = original.glyphBank(realm);
        assert.ok(bank.length > 0, realm);
        bank.forEach((ch) => assertCodePoint(ch, 'glyphBank ' + realm));
        astral += bank.filter((ch) => ch.codePointAt(0) > 0xffff).length;
        const rng = seeded();
        for (let i = 0; i < 4000; i++) assertCodePoint(original.pickGlyph(realm, rng, i % 3), 'pickGlyph ' + realm);
    }
    assert.ok(astral > 0, 'the typesets include astral glyphs, so UTF-16 indexing would split them');
});

test('the selected table drives main ASCII and every sub-voice takes its own table rotated forward from it', () => {
    const { G } = glyphSandbox();
    assert.equal(G.names.length, 125);
    assert.deepEqual([...G.voices], VOICES);
    assert.equal(G.current, ENGINE, 'Revision 3 engine glyphs stay the default');
    G.set(G.names[10]);
    VOICES.forEach((voice, i) => assert.equal(G.tableFor(voice), G.names[10 + i], voice));
    assert.equal(new Set(VOICES.map((voice) => G.tableFor(voice))).size, VOICES.length, 'no two voices share a table');
    G.set(G.names[124]);
    assert.equal(G.tableFor('ASCII'), G.names[124]);
    assert.equal(G.tableFor('R3 ASCII'), G.names[0], 'the rotation wraps around');
    assert.equal(G.tableFor('R3 Data Bomb'), G.names[7]);
    assert.equal(G.tableFor('R3 Font Burn'), G.names[11]);
    assert.equal(G.tableFor('Some other voice'), G.names[124], 'unknown voices follow the main table');
    assert.deepEqual([...G.rotation()].map((r) => r.table), VOICES.map((voice) => G.tableFor(voice)));
    for (const mode of [ALL, ENGINE]) {
        G.set(mode);
        VOICES.forEach((voice) => assert.equal(G.tableFor(voice), mode, mode + ' ' + voice));
    }
    const before = G.version;
    G.set('no such table');
    assert.equal(G.current, ENGINE);
    assert.equal(G.version, before, 'an unknown name falls back without a change');
});

test('per-voice glyph sets are stable arrays refilled in place, without whitespace, when the table changes', () => {
    const { G, original } = glyphSandbox();
    G.set(G.names[0]);
    const fallback = ['x'];
    const ascii = G.setFor('ASCII', fallback);
    const rain = G.setFor('Cyber Rain');
    assert.deepEqual([...ascii], [...G.banks[G.names[0]]].filter(visible));
    assert.deepEqual([...rain], [...G.banks[G.names[6]]].filter(visible));
    const stamp = ascii.glyphVersion;
    assert.equal(G.setFor('ASCII', fallback), ascii, 'same array while nothing changed');
    assert.equal(ascii.glyphVersion, stamp, 'no refill while nothing changed');
    const version = G.version;
    G.set(G.names[0]);
    assert.equal(G.version, version, 'reselecting the same table is not a change');
    G.set(G.names[3]);
    assert.equal(G.setFor('ASCII', fallback), ascii, 'a voice that captured its array keeps following the selection');
    assert.ok(ascii.glyphVersion > stamp);
    assert.deepEqual([...ascii], [...G.banks[G.names[3]]].filter(visible));
    assert.deepEqual([...G.setFor('Cyber Rain')], [...G.banks[G.names[9]]].filter(visible));

    G.set(ENGINE);
    assert.deepEqual([...G.setFor('ASCII', ['A', ' ', 'B'])], ['A', 'B'], 'Engine realms keeps the voice glyphs');
    const engineSet = G.setFor('Matrix ASCII');
    assert.deepEqual([...engineSet], [...original.glyphBank()].filter(visible));

    G.set(ALL);
    const mixed = G.setFor('Cyber Rain');
    assert.ok(mixed.length > 0 && mixed.length <= G.names.length * 8);
    const everything = new Set(G.names.flatMap((name) => G.banks[name]));
    mixed.forEach((ch) => assert.ok(everything.has(ch), ch));

    for (const name of G.names) {
        G.set(name);
        for (const voice of VOICES) {
            const set = G.setFor(voice);
            assert.ok(set.length > 0, name + ' ' + voice);
            set.forEach((ch) => assertCodePoint(ch, name + ' ' + voice));
            assert.ok(set.every(visible), name + ' ' + voice + ' has whitespace');
        }
    }
});

test('Revision 3 voices pick from the rotated table of the voice painting at the time', () => {
    const { G, E, original } = glyphSandbox();
    G.set(G.names[20]);
    const tableOf = (voice) => new Set([...G.banks[G.tableFor(voice)], '\u00b7']);
    const rng = seeded();
    for (const voice of ['R3 Matrix ASCII', 'R3 Matrix Chord']) {
        G.withVoice(voice, () => {
            assert.equal(G.voice, voice);
            for (let i = 0; i < 300; i++) assert.ok(tableOf(voice).has(E.pickGlyph('virtual', rng, i % 3)), voice);
            assert.deepEqual([...E.glyphBank('mix')], [...G.banks[G.tableFor(voice)]]);
        });
    }
    assert.equal(G.voice, null);
    assert.throws(() => G.withVoice('R3 ASCII', () => { throw new Error('paint failed'); }), /paint failed/);
    assert.equal(G.voice, null, 'the voice context is restored after a throw');
    for (let i = 0; i < 100; i++) assert.ok(tableOf('ASCII').has(E.pickGlyph('mix', rng, 0)), 'outside a voice, main ASCII');

    G.set(ENGINE);
    const a = seeded(99), b = seeded(99);
    for (let i = 0; i < 500; i++) {
        const realm = ['reality', 'virtual', 'mix'][i % 3];
        assert.equal(G.withVoice('R3 Matrix ASCII', () => E.pickGlyph(realm, a, i % 3)), original.pickGlyph(realm, b, i % 3));
    }
    assert.deepEqual([...E.glyphBank('virtual')], [...original.glyphBank('virtual')]);
});

test('the glyph select and info line show the selection and the sub-voice rotation', () => {
    const { G, elements } = glyphSandbox();
    const select = elements['glyph-bank'];
    const info = elements['glyph-info'];
    assert.equal(select.options.length, 2 + G.names.length);
    assert.equal(info.textContent, 'Using Revision 3 engine glyphs');
    select.value = G.names[0];
    select.change();
    assert.equal(G.current, G.names[0]);
    assert.match(info.textContent, /^[\d,.\s]+ code points \u00b7 main ASCII \u00b7 sub-voices rotate$/);
    const lines = info.title.split('\n');
    assert.equal(lines.length, VOICES.length + 1);
    assert.equal(lines[0], 'Main ASCII: ' + G.names[0]);
    assert.equal(lines[1], 'R3 ASCII: ' + G.names[1]);
    assert.equal(lines[8], 'R3 Data Bomb: ' + G.names[8]);
    assert.equal(lines[12], 'R3 Font Burn: ' + G.names[12]);
    assert.match(lines[13], /^Unicode 15\.1\.0 tables: verified \(125 tables, 127\D?648 code points\)$/);
    G.set(ALL);
    assert.equal(select.value, ALL);
    assert.match(info.textContent, /every voice mixes 125 tables$/);
});

test('host and Revision 3 glyph voices are routed through the per-voice tables', () => {
    const player = readWeb('js/glitch-player.js');
    const r3 = readWeb('js/r3-factories.js');
    assert.match(player, /const chars = Array\.from\(latin \+ /, 'the host atlas is built from code points');
    assert.match(player, /const chSet = voiceGlyphSet\('ASCII', /);
    assert.match(player, /voiceGlyph\('Cyber Rain'\)/);
    assert.match(player, /ch: voiceGlyph\('Matrix ASCII', realm, k % 3\)/);
    assert.match(player, /ch: voiceGlyph\('Matrix Chord', realm, tone\)/);
    assert.match(player, /const glyphAtlas = voiceGlyphAtlas\('Data Bomb'\);/);
    assert.match(player, /G\.setFor\('Ink Glyphs', INK_BANK\)/, 'Ink Glyphs reads its rotated table');
    assert.match(player, /G\.setFor\('Font Burn', null\)/, 'Font Burn reads its rotated table');
    assert.match(player, /const routed = routedBurnSet\(\);\s*if \(routed && routed\.length\) return glyphBurnWord\(routed\);/,
        'Font Burn words become glyph runs when a table is selected');
    assert.match(player, /G\.current === 'Engine realms \(Revision 3\)'\) return null;[\s\S]*?return G\.setFor\('Ink Glyphs', INK_BANK\);/,
        'Engine realms keeps the classic ink typesets');
    assert.match(r3, /glyphs\.withVoice\('R3 ' \+ baseName, render\)/);
    assert.match(r3, /G\.setFor\('R3 ' \+ glyphVoice, R3_ATLAS_CHARS\)/);
    assert.match(r3, /G\.setFor\('R3 Data Bomb', R3_ATLAS_CHARS\)/);
    assert.match(r3, /const GLYPH_TEXT_VOICES = \{ 'Ink Glyphs': true, 'Font Burn': true \};/,
        'the R3 twins of the banked text voices are glyph-routed');
    assert.match(r3, /const set = G\.setFor\('R3 ' \+ voice, R3_ATLAS_CHARS\);/,
        'R3 Ink Glyphs / Font Burn remap their text through the rotated table');
    assert.match(r3, /if \(GLYPH_TEXT_VOICES\[baseName\]\) gctx = routedGlyphContext\(context\);/);
    const verbatim = r3.slice(r3.indexOf('/* ===== BEGIN VERBATIM GLITCH REVISION 3 FACTORY SOURCE ===== */'));
    assert.doesNotMatch(verbatim.slice(0, verbatim.indexOf('END VERBATIM')), /SignalGlyphs|setFor|withVoice|glyphVoice/,
        'the verbatim Revision 3 source is untouched');

    const factory = player.slice(player.indexOf('function glitchASCIIArtOverlayFactory('));
    const capture = factory.indexOf("const chSet = voiceGlyphSet('ASCII', asciiFallback);");
    const renderStart = factory.indexOf('const renderFn = (progress) => {');
    const refresh = factory.indexOf("voiceGlyphSet('ASCII', asciiFallback);", renderStart);
    assert.ok(capture > 0 && renderStart > capture, 'the main ASCII voice captures its set once');
    assert.ok(refresh > renderStart && refresh < factory.indexOf('paintScatterField(', renderStart),
        'the main ASCII voice refreshes its captured set on every painted frame, before drawing');
});

test('Revision 3 ASCII follows table changes made after the R3 engine was created', () => {
    const { sandbox, G } = glyphSandbox();
    sandbox.performance = { now: () => 1000 };
    sandbox.addEventListener = () => {};
    vm.runInContext(readWeb('js/r3-factories.js'), sandbox, { filename: 'js/r3-factories.js' });
    const captured = new Map();
    const setFor = G.setFor;
    G.setFor = function (voice, fallback) {
        const set = setFor.call(this, voice, fallback);
        if (!captured.has(voice)) captured.set(voice, set);
        return set;
    };
    const alphas = Object.create(null);
    // A canvas under 8 px makes every R3 render return before drawing.
    const engine = { canvas: { width: 4, height: 4 }, effectAlphas: alphas, liveAlpha: (name) => alphas[name] || 0,
        sizeFor: () => 1, depthFor: () => 1 };
    const runners = sandbox.GC3FactoryBank.createRunners(engine);
    const context = new Proxy({}, { get: (target, key) => (key in target ? target[key] : () => {}) });
    const paintAll = () => runners.forEach((run) => run(context, 2000));

    assert.deepEqual([...captured.keys()], ['R3 ASCII'], 'only R3 ASCII captures a glyph array when created');
    const chSet = captured.get('R3 ASCII');
    const engineGlyphs = [...chSet];
    assert.equal(engineGlyphs.slice(0, 4).join(''), 'ABCD', 'Engine realms keeps the Revision 3 atlas glyphs');

    alphas['ASCII GC#(3)'] = 1;
    G.set(G.names[10]);
    paintAll();
    assert.equal(G.tableFor('R3 ASCII'), G.names[11]);
    assert.deepEqual([...chSet], [...G.banks[G.names[11]]].filter(visible), 'the captured set takes the rotated table');

    G.set(G.names[40]);
    paintAll();
    assert.deepEqual([...chSet], [...G.banks[G.names[41]]].filter(visible));

    G.set(ENGINE);
    paintAll();
    assert.deepEqual([...chSet], engineGlyphs, 'switching back restores the Revision 3 glyphs');
});

test('the effects manifest pins exactly the 13 SignalGlyphs voices', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'webui', 'data', 'effects.manifest.json'), 'utf8'));
    const flagged = manifest.voices.filter((v) => v.glyphVoice).map((v) => v.id).sort();
    assert.deepEqual(flagged, [...VOICES].sort());
    const { G } = glyphSandbox();
    assert.deepEqual([...G.voices], VOICES);
});

test('headless stubs without a 2D canvas treat every table as renderable', () => {
    const { G } = glyphSandbox();
    assert.deepEqual([...G.renderableNames], [...G.names]);
    assert.deepEqual([...G.unfontedNames], []);
    assert.ok(Object.isFrozen(G.renderableNames) && Object.isFrozen(G.unfontedNames));
});

test("the 'All scripts' sampler is seeded: identical seeds redraw identical mixes, new seeds reshuffle", () => {
    const first = glyphSandbox().G;
    first.set(ALL);
    first.reseed(42);
    const ascii42 = [...first.setFor('ASCII')];
    const rain42 = [...first.setFor('Cyber Rain')];
    assert.ok(ascii42.length > 0 && rain42.length > 0);
    assert.notDeepEqual(ascii42, rain42, 'every voice draws its own mix');
    first.reseed(42);
    assert.deepEqual([...first.setFor('ASCII')], ascii42, 'the same seed redraws the same mix');
    assert.deepEqual([...first.setFor('Cyber Rain')], rain42);
    first.reseed(43);
    assert.notDeepEqual([...first.setFor('ASCII')], ascii42, 'a new seed reshuffles');
    const beforeVersion = first.version;
    first.reshuffleAllScripts(42);
    assert.ok(first.version > beforeVersion, 'a reshuffle bumps the version so captured sets refill');
    assert.deepEqual([...first.setFor('ASCII')], ascii42);
    const tick = first.version;
    first.reshuffleAllScripts();
    assert.ok(first.version > tick, 'an unseeded reshuffle advances to a fresh mix');
    const second = glyphSandbox().G;
    second.set(ALL);
    second.reshuffleAllScripts(42);
    assert.deepEqual([...second.setFor('ASCII')], ascii42, 'no Math.random leak — a second context redraws identically');
});

/* Loads the real glyph library over a stub canvas whose 2D context renders a
   recognizable .notdef signature for the given code points, exercising the
   font-coverage probe exactly as a WebView2 host with a missing font would. */
function probeSandbox(unsupported) {
    const elements = {
        'glyph-bank': {
            value: '', options: [],
            appendChild(option) { this.options.push(option); },
            addEventListener() {},
        },
        'glyph-info': { textContent: '', title: '' },
    };
    let lastCp = -1;
    const ctx = {
        clearRect() { lastCp = -1; },
        fillText(ch) { lastCp = ch.codePointAt(0); },
        getImageData(x, y, w, h) {
            const data = new Uint8ClampedArray(w * h * 4);
            const tofu = lastCp === 0xffff || lastCp === 0xfffd || unsupported(lastCp);
            for (let i = 0; i < data.length; i += 4) { data[i] = tofu ? 0xab : 1; data[i + 3] = 255; }
            return { data };
        },
    };
    const canvas = { width: 0, height: 0, getContext: (kind) => (kind === '2d' ? ctx : null) };
    const sandbox = {
        console,
        document: {
            getElementById: (id) => elements[id] || null,
            createElement: (tag) => (tag === 'canvas' ? canvas : {}),
        },
    };
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(readWeb('js/glyph-tables.js'), sandbox, { filename: 'js/glyph-tables.js' });
    vm.runInContext(readWeb('js/glyph-library.js'), sandbox, { filename: 'js/glyph-library.js' });
    return { G: sandbox.SignalGlyphs, elements };
}

test('the font probe partitions unfonted tables out of every random pool and maps presets onto renderable ones', () => {
    const { G, elements } = probeSandbox((cp) => cp >= 0x0780 && cp <= 0x07bf); // no Thaana font on this host
    assert.ok(G.names.includes('Thaana'));
    assert.deepEqual([...G.unfontedNames], ['Thaana']);
    assert.equal(G.renderableNames.length, G.names.length - 1);
    assert.ok(!G.renderableNames.includes('Thaana'));
    const option = elements['glyph-bank'].options.find((o) => o.value === 'Thaana');
    assert.match(option.textContent, /\[no system font\]$/);
    G.set(G.renderableNames[0]);
    for (const voice of VOICES) {
        assert.notEqual(G.tableFor(voice), 'Thaana', voice + ' rotates over renderable tables only');
    }
    const rng = seeded();
    G.set('All scripts');
    const thaana = new Set(G.banks['Thaana']);
    for (let i = 0; i < 400; i++) {
        assert.ok(!thaana.has(G.pickFor('ASCII', rng)), "the 'All scripts' pool skips unfonted tables");
    }
    for (const ch of G.setFor('Matrix ASCII')) assert.ok(!thaana.has(ch));
    G.set('Thaana');
    assert.equal(G.current, 'Thaana', 'a hand pick may still select an unfonted table');
    G.set('Thaana', { fallbackRenderable: true });
    const mapped = G.current;
    assert.notEqual(mapped, 'Thaana');
    assert.ok(G.renderableNames.includes(mapped), 'preset fallback lands on a renderable table');
    G.set('Thaana', { fallbackRenderable: true });
    assert.equal(G.current, mapped, 'the fallback mapping is deterministic');
});

test('glyph roll, auto-cycle and the glyph hard lock are wired into the board, the seed, presets and the frame loop', () => {
    const player = readWeb('js/glitch-player.js');
    const html = readWeb('index.html');
    assert.match(html, /<button id="glyphRandBtn" type="button"[^>]*>Glyph Roll<\/button>/);
    assert.match(html, /<button id="glyphAutoBtn" type="button"[^>]*>Glyph Auto: OFF<\/button>/);
    assert.match(html, /<button id="glyphLockBtn" type="button" class="lock-button"[^>]*>&lt;LOCK!&gt;<\/button>/);
    assert.match(player, /const sliderLocks = \{ global: false, glyphBank: false \};/,
        'the glyph lock key is seeded so saved locks survive preset normalization');
    assert.match(player, /if \(r < 0\.10 \|\| !pool\.length\) return 'Engine realms \(Revision 3\)';\s*if \(r < 0\.20\) return 'All scripts';/,
        'Glyph Roll keeps the 10% / 10% / 80% odds');
    const board = player.slice(player.indexOf('function randomizeBoard('), player.indexOf('function applyRandomSeed('));
    assert.match(board, /if \(!sliderLocks\.glyphBank\) rollGlyphBank\(rngFn\);/, 'Randomize All rolls the bank unless locked');
    assert.match(player, /if \(!sliderLocks\.glyphBank && window\.SignalGlyphs\) \{\s*const bank = pickRenderableGlyphBank\(rng\);/,
        'Random Seed picks the bank deterministically from its rng unless locked');
    assert.match(player, /function glyphAutoStep\(now\) \{\s*if \(!glyphAutoActive \|\| sliderLocks\.glyphBank\) return;/,
        'Glyph Auto respects the hard lock');
    assert.match(player, /const pace = softWild\(\) \? \[5000, 9000\] : \[12000, 24000\];/,
        'Glyph Auto cadence: 12-24s calm, 5-9s in a crescendo');
    assert.match(player, /^\s*glyphAutoStep\(now\);/m, 'the frame loop (playback on) steps Glyph Auto');
    assert.match(player, /if \(s\.glyphBank && window\.SignalGlyphs && !glyphBankHeld\) \{\s*window\.SignalGlyphs\.set\(s\.glyphBank, \{ fallbackRenderable: true \}\);/,
        'presets seat their glyph bank through the renderable fallback unless hard-locked');
    assert.match(player, /glyphLockBtn\.addEventListener\('click', \(\) => \{\s*toggleUserLock\('glyphBank'\);/,
        'the lock button is a user hard lock');
});
