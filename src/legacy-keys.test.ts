import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sleep, startContractFixture, type ContractFixture } from '../test-stubs/contract-fixture.js';

/**
 * The legacy-key mode (MIG) reaches the core through this binding's `init`
 * untouched. The React Native shape is a source-language JSON file bundled
 * with the app and passed as `legacyKeys`.
 *
 * Proven against the contract fixture (tier `contract`): the catalog holds the
 * Spanish translation of "Place order" and knows nothing of the key
 * `checkout.submit`, so rendering the key as the translation is possible only if
 * the file arrived. A new key registers its source value under the key's
 * namespace, and the key string itself — which the double would accept from
 * this write key — is never registered.
 */

// React Native's globals, in place before the core loads.
(globalThis as Record<string, unknown>).window = globalThis;

const { LangsysApp, createLocaleStore, useT } = await import('./index.js');

// What `import en from './locales/en.json'` gives an app.
const EN_JSON = { checkout: { submit: 'Place order', cancel: 'Cancel order' } };

const SEED = {
    projects: [
        {
            id: 'p1',
            base_locale: 'en-us',
            target_locales: ['es-es'],
            phrases: [{ category: 'checkout', phrase: 'Place order', translations: { 'es-es': 'Realizar pedido' } }],
        },
    ],
    keys: [{ key: 'k-write', project: 'p1', type: 'write' }],
};

let fx: ContractFixture;
const mounted: ReactTestRenderer[] = [];

beforeAll(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    fx = await startContractFixture();
    await fx.seed(SEED);
    const res = await LangsysApp.init({
        projectid: 'p1',
        key: 'k-write',
        UserLocaleStore: createLocaleStore('es-es'),
        baseLocale: 'en-us',
        apiUrl: fx.baseUrl,
        legacyKeys: [{ name: 'en.json', data: EN_JSON }],
    });
    expect(res.status, 'init against the fixture').toBe(true);
    await LangsysApp.translationsLoadingPromise;
}, 15_000);

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

describe('MIG — a bundled key file passes through init untouched', () => {
    it('precondition: the catalog knows the source value, not the key', async () => {
        const phrases = await fx.registered('p1');
        expect(phrases.map((p) => p.phrase)).toEqual(['Place order']);
    });

    it('a key renders the translation of its source value, through useT()', () => {
        const latest = renderHook(() => useT()('checkout.submit'));
        expect(latest()).toBe('Realizar pedido');
    });

    it("a new key registers its value under the key's namespace, never the key", async () => {
        LangsysApp.t('checkout.cancel');
        const deadline = Date.now() + 3000;
        let phrases = await fx.registered('p1');
        while (!phrases.some((p) => p.phrase === 'Cancel order') && Date.now() < deadline) {
            await sleep(50);
            phrases = await fx.registered('p1');
        }
        expect(phrases).toContainEqual({ category: 'checkout', phrase: 'Cancel order', translations: {} });
        expect(phrases.map((p) => p.phrase)).not.toContain('checkout.cancel');
    }, 10_000);
});
