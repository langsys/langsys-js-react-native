import * as core from 'langsys-js-typescript';
import { describe, expect, it } from 'vitest';

/**
 * Guards the bench, not the binding.
 *
 * This package resolves `langsys-js-typescript` through a gitignored symlink to
 * the sibling working copy. `package.json` says `^0.6.5`, and the published
 * 0.6.5 carries none of the 838 names below — measured against the registry
 * tarball, with `canonicalizeLocale` and `getCountries` as the controls. On a
 * fresh clone the entry point therefore fails to typecheck (TS2305 on
 * `setPersistStorage` / `PersistStorage`) and this suite fails here, loudly,
 * rather than as a scatter of import errors that read like binding defects.
 *
 * Release-wave item: the dependency range must name the core version that
 * actually ships the 838 surface. See CONFORMANCE.md.
 */
describe('upstream precondition — the core build under test', () => {
    it('positive control: the package resolves and its pre-838 baseline is present', () => {
        // Present in every published build. If this fails, nothing below is
        // evidence about 838 — the module is not loading at all.
        expect(typeof core.canonicalizeLocale).toBe('function');
        expect(typeof core.LangsysApp.getCountries).toBe('function');
    });

    it('carries every 838 name this binding imports or forwards', () => {
        expect(typeof core.setPersistStorage).toBe('function');
        expect(typeof core.setWriteGrant).toBe('function');
        expect(typeof core.LangsysApp.seedCatalog).toBe('function');
        expect(typeof core.setTeardownSignal).toBe('function');
        expect(typeof core.renderServerMessage).toBe('function');
        expect(typeof core.resolveServerMessages).toBe('function');
        for (const signal of [core.writeEnabled, core.autoDiscovery]) {
            expect(typeof signal.subscribe).toBe('function');
            expect(typeof signal.get).toBe('function');
        }
    });
});
