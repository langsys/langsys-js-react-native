import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as core from 'langsys-js-typescript';
import { describe, expect, it } from 'vitest';
import * as rn from './index.js';

/**
 * BIND-6 — the entry point is the core singleton by reference, and core values
 * that need no adapting are re-exported by reference.
 *
 * The expected member list is derived from the core at test time, never typed
 * here: a hand-written list reproduces in the verifier the defect it exists to
 * catch. That defect was real in this repo — the previous wrapper class listed
 * each method, and `seedCatalog` and `setWriteGrant` were simply never added.
 *
 * PUBLIC is decided by the core's `.d.ts`, scoped to the singleton's class.
 * TypeScript's `private` is erased at runtime, so a runtime walk alone reports
 * implementation detail as API.
 */

const require = createRequire(import.meta.url);

/** Every member reachable on an object's chain — methods, getters and data. */
function surfaceOf(target: object): string[] {
    const out = new Set<string>();
    let o: object | null = target;
    while (o && o !== Object.prototype) {
        for (const k of Object.getOwnPropertyNames(o)) {
            if (k !== 'constructor' && !k.startsWith('_')) out.add(k);
        }
        o = Object.getPrototypeOf(o) as object | null;
    }
    return [...out].sort();
}

/** Names declared `private` inside one class block of a `.d.ts`. */
function privateNamesIn(dts: string, className: string): Set<string> {
    const start = dts.search(new RegExp(`^declare class ${className}\\b[^{]*\\{`, 'm'));
    if (start === -1) return new Set();
    const open = dts.indexOf('{', start);
    let depth = 0;
    let end = open;
    for (let i = open; i < dts.length; i++) {
        if (dts[i] === '{') depth++;
        else if (dts[i] === '}' && --depth === 0) {
            end = i;
            break;
        }
    }
    const body = dts.slice(open, end);
    return new Set([...body.matchAll(/^\s*private\s+([A-Za-z_]\w*)\s*;/gm)].map((m) => m[1] ?? ''));
}

function missingFrom(binding: object, publicMembers: string[]): string[] {
    return publicMembers.filter((m) => (binding as Record<string, unknown>)[m] === undefined);
}

const dtsPath = realpathSync(require.resolve('langsys-js-typescript')).replace(/\.js$/, '.d.ts');
const privates = privateNamesIn(readFileSync(dtsPath, 'utf8'), 'LangsysAppClass');
const publicSurface = surfaceOf(core.LangsysApp).filter((m) => !privates.has(m));

describe('BIND-6 — LangsysApp is the core singleton, by reference', () => {
    it('positive control: the .d.ts classification reads the class and excludes something', () => {
        // If nothing is classified private, the rows below are just a runtime
        // walk and prove less than they appear to.
        expect(privates.has('resolveLocale')).toBe(true);
        expect(privates.has('getCountries')).toBe(false);
        expect(publicSurface).toEqual(expect.arrayContaining(['init', 't', 'refresh', 'seedCatalog', 'setWriteGrant']));
        expect(publicSurface.length).toBeGreaterThan(15);
    });

    it('is the core singleton itself', () => {
        expect(rn.LangsysApp).toBe(core.LangsysApp);
    });

    it('reaches every public core member, including the two the old wrapper never listed', () => {
        expect(missingFrom(rn.LangsysApp, publicSurface)).toEqual([]);
        expect(rn.LangsysApp.seedCatalog).toBe(core.LangsysApp.seedCatalog);
        expect(rn.LangsysApp.setWriteGrant).toBe(core.LangsysApp.setWriteGrant);
    });

    it('firing control: the reachability check detects a hidden member', () => {
        const hiding = new Proxy(core.LangsysApp, {
            get: (target, prop, receiver) => (prop === 'seedCatalog' ? undefined : Reflect.get(target, prop, receiver)),
        });
        expect(missingFrom(hiding, publicSurface)).toEqual(['seedCatalog']);
    });

    it('survives destructuring — nothing is re-bound', () => {
        const { detectPreferredLocale, seedCatalog } = rn.LangsysApp;
        expect(detectPreferredLocale).toBe(core.LangsysApp.detectPreferredLocale);
        expect(seedCatalog).toBe(core.LangsysApp.seedCatalog);
    });
});

describe('BIND-6 — core values re-exported by reference', () => {
    const byReference: Array<[string, unknown]> = [
        ['t', core.tSignal],
        ['currentlyLoadedLocale', core.currentlyLoadedLocale],
        ['sTranslations', core.sTranslations],
        ['createSignal', core.createSignal],
        ['writeEnabled', core.writeEnabled],
        ['autoDiscovery', core.autoDiscovery],
        ['setWriteGrant', core.setWriteGrant],
        ['setPersistStorage', core.setPersistStorage],
        ['canonicalizeLocale', core.canonicalizeLocale],
        ['LangsysAppAPI', core.LangsysAppAPI],
        ['renderServerMessage', core.renderServerMessage],
        ['resolveServerMessages', core.resolveServerMessages],
        ['toServerMessage', core.toServerMessage],
        ['fillTemplate', core.fillTemplate],
        ['templateMarkers', core.templateMarkers],
        ['SERVER_MESSAGE_CODES', core.SERVER_MESSAGE_CODES],
        ['DEFAULT_SERVER_MESSAGE_CATEGORY', core.DEFAULT_SERVER_MESSAGE_CATEGORY],
    ];

    for (const [name, value] of byReference) {
        it(`${name} is the core export itself`, () => {
            // The core half first: an undefined on both sides would compare equal.
            expect(value).toBeDefined();
            expect((rn as unknown as Record<string, unknown>)[name]).toBe(value);
        });
    }
});

describe('BIND-6 — setTeardownSignal is deliberately not re-exported', () => {
    // It is the one core value this binding adapts: the binding installs its own
    // AppState signal at load (`./teardown.ts`). Re-exporting the injector beside
    // that would offer a supported-looking way to replace or null it.
    it('positive control: the core exports it', () => {
        expect(typeof core.setTeardownSignal).toBe('function');
    });

    it('this package does not', () => {
        expect(rn).not.toHaveProperty('setTeardownSignal');
    });
});
