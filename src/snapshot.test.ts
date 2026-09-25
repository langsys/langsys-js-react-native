import * as core from 'langsys-js-typescript';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startContractFixture, type ContractFixture } from '../test-stubs/contract-fixture.js';

/**
 * SNAP-2 and SNAP-3 through this binding, in the React Native shape: a
 * snapshot bundled with the app and loaded before the first render.
 *
 * In-process first (tier `n/a (pure)`): the snapshot renders through `useT()`
 * with nothing awaited and no `init()`, so no request is possible; an edited
 * snapshot is refused with the core's own error class. Then against the
 * contract fixture (tier `contract`): once `init()` runs, a phrase the snapshot
 * lacks renders the catalog's translation — the snapshot is a cache.
 */

// React Native's globals, in place before the core loads.
(globalThis as Record<string, unknown>).window = globalThis;

const { LangsysApp, SnapshotError, createLocaleStore, useT } = await import('./index.js');

// What `require('./langsys-snapshot.json')` gives an app: the parsed document.
const BUNDLED = JSON.parse(
    JSON.stringify(
        core.buildSnapshot({
            projectId: 'p1',
            baseLocale: 'en-us',
            catalogs: { 'es-es': { Marketing: { Pricing: 'Precios' } } },
            categories: ['Marketing'],
            generatedAt: new Date('2026-09-24T12:00:00Z'),
        })
    )
) as core.CatalogSnapshot;

const mounted: ReactTestRenderer[] = [];
let fx: ContractFixture | undefined;

beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
    act(() => {
        for (const renderer of mounted.splice(0)) renderer.unmount();
    });
    fx?.stop();
    delete (globalThis as Record<string, unknown>).window;
});

function renderHook<T>(hook: () => T): () => T {
    const renders: T[] = [];
    function Probe(): null {
        renders.push(hook());
        return null;
    }
    act(() => {
        mounted.push(create(createElement(Probe)));
    });
    return () => renders[renders.length - 1] as T;
}

describe('SNAP-2 — a bundled snapshot is the first render’s catalog', () => {
    it('renders through useT() as soon as it loads, before init, with nothing awaited', () => {
        const subscribed = renderHook(() => useT()('Pricing', 'Marketing'));
        // Firing control: a render that does not subscribe keeps the source text.
        const unsubscribed = renderHook(() => LangsysApp.t('Pricing', 'Marketing'));
        expect(subscribed()).toBe('Pricing');

        let loaded = false;
        act(() => {
            loaded = LangsysApp.loadSnapshot(BUNDLED, 'es-es');
        });
        expect(loaded).toBe(true);
        expect(subscribed()).toBe('Precios');
        expect(unsubscribed()).toBe('Pricing');
    });

    it('a phrase the snapshot lacks shows its source text until the catalog arrives', () => {
        expect(LangsysApp.t('Checkout', 'Marketing')).toBe('Checkout');
    });

    it('returns false for a locale the snapshot does not hold', () => {
        expect(LangsysApp.loadSnapshot(BUNDLED, 'fr-fr')).toBe(false);
    });
});

describe('SNAP-3 — an edited snapshot is refused, not served', () => {
    it('throws the core’s SnapshotError with reason checksum, and the catalog is untouched', () => {
        const edited = JSON.parse(JSON.stringify(BUNDLED)) as core.CatalogSnapshot;
        (edited.catalog['es-es'] as Record<string, Record<string, string>>).Marketing!.Pricing = 'Editado';

        let error: unknown;
        try {
            LangsysApp.loadSnapshot(edited, 'es-es');
        } catch (e) {
            error = e;
        }
        expect(error).toBeInstanceOf(SnapshotError);
        expect(SnapshotError).toBe(core.SnapshotError);
        expect((error as core.SnapshotError).reason).toBe('checksum');
        expect(LangsysApp.t('Pricing', 'Marketing')).toBe('Precios');
    });
});

describe('SNAP-2 and SNAP-3 — once init() runs, the catalog is the source', () => {
    beforeAll(async () => {
        fx = await startContractFixture();
        await fx.seed({
            projects: [
                {
                    id: 'p1',
                    base_locale: 'en-us',
                    target_locales: ['es-es'],
                    phrases: [
                        { category: 'Marketing', phrase: 'Pricing', translations: { 'es-es': 'Precios' } },
                        { category: 'Marketing', phrase: 'Checkout', translations: { 'es-es': 'Pagar' } },
                    ],
                },
            ],
            keys: [{ key: 'k-read', project: 'p1', type: 'read' }],
        });
        const res = await LangsysApp.init({
            projectid: 'p1',
            key: 'k-read',
            UserLocaleStore: createLocaleStore('es-es'),
            baseLocale: 'en-us',
            apiUrl: fx.baseUrl,
        });
        expect(res.status, 'init against the fixture').toBe(true);
        await LangsysApp.translationsLoadingPromise;
    }, 15_000);

    it('a phrase the snapshot lacks renders the fetched translation', () => {
        expect(LangsysApp.t('Checkout', 'Marketing')).toBe('Pagar');
        expect(LangsysApp.t('Pricing', 'Marketing')).toBe('Precios');
    });
});
