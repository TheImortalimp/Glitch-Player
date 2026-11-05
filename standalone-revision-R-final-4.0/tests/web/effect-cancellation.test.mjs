import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readWeb } from './harness.mjs';

const player = readWeb('js/glitch-player.js');

/* Runs the R4.1.3 EFFECT CANCELLATION block with stubbed lights. */
function cancelSandbox() {
    const start = player.indexOf('          const userCancelled = {};');
    const end = player.indexOf('          function randRange(');
    assert.ok(start > 0 && end > start, 'cancellation block');
    const context = vm.createContext({});
    vm.runInContext(`
        const lights = new Set(['Flash', 'Strobe']);
        function isManualLight(name) { return lights.has(name); }
        ${player.slice(start, end)}
        globalThis.sb = {
            cancel(name) { setEffectCancelled(name, true); },
            wake(name) { setEffectCancelled(name, false); },
            is(name) { return isEffectCancelled(name); }
        };
    `, context);
    return context.sb;
}

test('a cancelled effect stays cancelled until it is woken, and waking clears it', () => {
    const sb = cancelSandbox();
    sb.cancel('ASCII');
    assert.equal(sb.is('ASCII'), true);
    sb.wake('ASCII');
    assert.equal(sb.is('ASCII'), false);
});

test('the lights are never latched by the cancellation system', () => {
    const sb = cancelSandbox();
    sb.cancel('Flash');
    sb.cancel('Strobe');
    assert.equal(sb.is('Flash'), false);
    assert.equal(sb.is('Strobe'), false);
});

test('ZERO ALL cancels every effect so nothing can automatically start afterwards', () => {
    const zero = player.slice(player.indexOf('function zeroAllEffects()'), player.indexOf("if ($('zeroAllBtn'))"));
    assert.ok(zero.includes('setEffectCancelled(name, true)'), 'ZERO ALL latches the cancellation');
});

test('every automation path respects the cancellation latch', () => {
    assert.ok(/const parked = profileNames\.filter\(\(n\) =>\s*!automationHeld\(n\) && !isEffectCancelled\(n\)/.test(player),
        "Auto Glitch's unpark skips cancelled effects");
    assert.ok(player.includes("if (isEffectCancelled(name)) { randomTargets[name] = 0; continue; }"),
        'the continual randomizer skips cancelled effects');
    assert.equal((player.match(/if \(isEffectCancelled\(name\)\) return;/g) || []).length >= 3, true,
        'aesthetic bursts skip cancelled effects in peak, suppress and dip phases');
    assert.ok(player.includes('!isEffectCancelled(n) &&'),
        'burst group availability ignores cancelled voices');
});

test('a slider dragged to zero cancels its effect; presets and Randomize All re-determine them', () => {
    assert.ok(player.includes('setEffectCancelled(def.name, v < PARKED_EFFECT_EPSILON)'),
        'the slider mirrors park intent into cancellation');
    assert.equal((player.match(/setEffectCancelled\(name, v < PARKED_EFFECT_EPSILON\)/g) || []).length, 2,
        'preset apply and Randomize All determine the cancelled set');
    assert.ok(player.includes('setEffectCancelled(name, false); /* R4.1.3: a tuned pick is user intent'),
        'a tuned voice pick wakes its pair');
});

test('voices are untied: a master wakes only its own core voice, never the R3 twin (R4.2.4)', () => {
    assert.ok(player.includes('[[core, 0.35]].forEach'), 'the tuned wake touches one voice');
    assert.ok(!player.includes("[[core, 0.35], ['R3 ' + core, 0.20]]"), 'the R3 twin is no longer co-triggered');
});

test('B&W never starts automatically after ZERO ALL: sweep and rail hops respect cancellation (R4.2.4)', () => {
    const sweep = player.slice(player.indexOf('function stepBwSweep('), player.indexOf('function autoGlitchUnpark('));
    assert.ok(sweep.includes("isEffectCancelled('B&W Invert')"), 'the B&W sweep stands down while cancelled');
    const drive = player.slice(player.indexOf('function autoGlitchBwDrive('), player.indexOf('function autoGlitchStep('));
    assert.ok(drive.includes("isEffectCancelled('B&W Invert')"), "Auto Glitch's B&W rail hop skips a cancelled B&W");
});

test('voices separate: each carries join odds and glides travel longer than cuts', () => {
    assert.ok(player.includes('join: 0.6 + Math.random() * 0.3'), 'per-voice separation odds');
    assert.ok(player.includes('if (trait && Math.random() > trait.join) continue;'), 'the retarget loop staggers voices');
    assert.ok(player.includes("(kind === 'glide' ? 0.62 : kind === 'cut' ? 1.35 : 1)"), 'glides travel slower (longer transitions)');
});

test('MACHINE decks are determined by one reproducible seed', () => {
    assert.ok(player.includes('function buildMachinePresets(seedOverride)'), 'the builder accepts a seed');
    assert.ok(player.includes('buildMachinePresets.lastSeed = seed;'), 'the deck seed is recorded');
});

/* ------------------------- Phase 4 exit criteria ------------------------- */

test('Phase 4: Auto Glitch sparks and wakes respect cancellation, locks and a zeroed Global Opacity', () => {
    const step = player.slice(player.indexOf('function autoGlitchStep('), player.indexOf('function randomizeBoard('));
    assert.ok(step.includes('!isEffectCancelled(def.name) && !automationHeld(def.name) &&'),
        'spark creation skips cancelled and locked voices');
    assert.ok(step.includes('!continuousEffectCache[def.name] && !autoGlitchSparks[def.name]'),
        'a running voice is never doubled by a spark');
    assert.ok(step.includes('if (masterOpacity <= 0.001) {'), 'a zeroed board sparks nothing');
    assert.ok(step.includes('if (isEffectCancelled(sparkName) || automationHeld(sparkName)) return 0;'),
        'a live spark falls silent the moment its voice is cancelled or locked');
    const unpark = player.slice(player.indexOf('function autoGlitchUnpark('), player.indexOf('function autoGlitchPulse('));
    assert.ok(unpark.includes('if (masterOpacity <= 0.001) return;'),
        'unpark never wakes a board at Global Opacity 0');
});

test('Phase 4: an R3 factory steps once per frame — the parallel Auto Glitch instance bank is retired', () => {
    const step = player.slice(player.indexOf('function autoGlitchStep('), player.indexOf('function randomizeBoard('));
    assert.ok(!step.includes('autoGlitchInstances.push'), 'autoGlitchStep never creates parallel instances');
    assert.ok(step.includes('if (continuousEffectCache[def.name] && at > -1) activeEffects.splice(at, 1);'),
        'a spark stands down when its voice gains a continuous runner');
    assert.ok(player.includes('autoGlitchLevel || 0) * (0.82 + 0.18 * autoGlitchPulse(performance.now()))'),
        "Auto Glitch's rhythmic boost is folded into the one smoothed strength (glitchBoost)");
});

test("Phase 4: the burst release ('dip' exit) skips cancelled and parked voices too", () => {
    const at = player.indexOf("} else { // 'dip'");
    assert.ok(at > 0, 'dip exit found');
    const release = player.slice(at, player.indexOf('aestheticBurstLocked = new Set();', at));
    assert.ok(release.includes('if (isManualLight(name)) return;'), 'lights stay with the wander');
    assert.ok(release.includes('if (isEffectCancelled(name)) return;'), 'cancelled voices are never re-targeted');
    assert.ok(release.includes('if (!isAutoGlitching && crParked[name] &&'), 'parked voices stay parked');
});

test('Phase 4: ZERO ALL halts preset auto, AI warp, ghost, v-sync, milk, hard light, lights, sparks and the SOFT engine', () => {
    const zero = player.slice(player.indexOf('function zeroAllEffects()'), player.indexOf("if ($('zeroAllBtn'))"));
    for (const needle of [
        'togglePresetAuto();',
        "setLightLevelNow('Flash', 0);",
        "setLightLevelNow('Strobe', 0);",
        'setMilkActive(false);',
        'setHardLight(false);',
        'isAiWarpActive = false;',
        'ghostModeIndex = 0;',
        'vsyncModeIndex = 0;',
        'SOFT.cresc.calmNow();',
        'SOFT.gate.reset();',
        'activeEffects.length = 0;',
        'delete autoGlitchSparks[k];',
        'delete timedActiveMap[k];'
    ]) assert.ok(zero.includes(needle), 'ZERO ALL does: ' + needle);
});

test('Phase 4: Global Opacity 0 silences even a live Trigger pulse on the very next read', () => {
    const start = player.indexOf('          function effectLiveStrength(name) {');
    assert.ok(start > 0, 'effectLiveStrength found');
    const end = player.indexOf('\n          }', start) + '\n          }'.length;
    const context = vm.createContext({
        masterOpacity: 1,
        masterControls: { effectIntensity: 1 },
        effectAlphas: {},
        smoothedStrength: {},
        timedPulseLevel: () => 0.4,
        lightCap: () => Infinity,
        isManualLight: () => false,
        clamp01: (v) => Math.min(1, Math.max(0, v))
    });
    vm.runInContext(player.slice(start, end) + '\nglobalThis.live = effectLiveStrength;', context);
    assert.ok(context.live('ASCII') > 0, 'a pulse paints while opacity is up');
    context.masterOpacity = 0;
    assert.equal(context.live('ASCII'), 0, 'opacity 0 is an immediate clean frame');
    context.masterOpacity = 0.001;
    assert.equal(context.live('ASCII'), 0, 'the <= 0.001 guard holds');
    context.masterOpacity = 1;
    context.smoothedStrength.ASCII = 0.5;
    context.masterOpacity = 0;
    assert.equal(context.live('ASCII'), 0, 'a settling smoothed copy cannot leak past opacity 0');
});
