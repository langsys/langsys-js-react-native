import * as core from 'langsys-js-typescript';
import type { iCategories } from 'langsys-js-typescript';
import { createElement, useMemo } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createLocaleStore, useCurrentLocale, useLocaleStore, useSignal, useT, useWriteEnabled } from './index.js';

/**
 * BIND-1, BIND-2 and BIND-5 — the hooks adapt shape and timing, never meaning.
 *
 * Each rule is proven by comparing what a hook renders with what the core itself
 * answers at that moment, and each carries a FIRING CONTROL: a deliberately wrong
 * hook, written the way the defect would be written, which the same assertion
 * tells apart. Without one, an assertion comparing a value with its own source
 * passes against anything.
 *
 * In-process with no server involved, so the evidence tier is `n/a (pure)`.
 */

beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const mounted: ReactTestRenderer[] = [];

afterEach(() => {
    act(() => {
        for (const renderer of mounted.splice(0)) renderer.unmount();
    });
    act(() => {
        core.writeEnabled.set(undefined);
    });
});

/** Render a hook in a real React tree, keeping the value from every render. */
function renderHook<T>(hook: () => T): { renders: T[]; latest: () => T } {
    const renders: T[] = [];
    function Probe(): null {
        renders.push(hook());
        return null;
    }
    act(() => {
        mounted.push(create(createElement(Probe)));
    });
    return { renders, latest: () => renders[renders.length - 1] as T };
}

function seed(catalog: Record<string, Record<string, string | null>>, locale: string): void {
    act(() => {
        core.LangsysApp.seedCatalog(catalog as unknown as iCategories, locale);
    });
}

describe('BIND-1 — hooks adapt shape and timing, never meaning', () => {
    it("useT returns the core's translation function itself, and follows it across a catalog change", () => {
        seed({ Marketing: { Pricing: 'Precios' } }, 'es-es');
        const hook = renderHook(() => useT());
        expect(hook.latest()).toBe(core.tSignal.get());
        // Control that the seed took effect: otherwise both sides read source text.
        expect(hook.latest()('Pricing', 'Marketing')).toBe('Precios');

        seed({ Marketing: { Pricing: 'Tarifs' } }, 'fr-fr');
        expect(hook.renders.length).toBeGreaterThan(1);
        expect(hook.latest()).toBe(core.tSignal.get());
        expect(hook.latest()('Pricing', 'Marketing')).toBe('Tarifs');
    });

    it('firing control: a hook that re-wraps the function is told apart', () => {
        const hook = renderHook(() => core.tSignal.get().bind(null));
        expect(hook.latest()).not.toBe(core.tSignal.get());
    });

    it('useCurrentLocale returns the loaded locale exactly as the core published it', () => {
        seed({ Marketing: { Pricing: 'Precios' } }, 'ES-es');
        const hook = renderHook(() => useCurrentLocale());
        expect(hook.latest()).toBe(core.currentlyLoadedLocale.get());
        expect(hook.latest()).toBe('es-es');
    });

    it('the locale store passes input through verbatim — normalizing is the core’s decision (WIRE-3)', () => {
        expect(createLocaleStore('en-US').get()).toBe('en-US');

        const hook = renderHook(() => useLocaleStore('pt-BR'));
        expect(hook.latest()[0]).toBe('pt-BR');
        act(() => {
            hook.latest()[1]('es-CR');
        });
        expect(hook.latest()[0]).toBe('es-CR');
        expect(hook.latest()[2].get()).toBe('es-CR');
    });

    it('firing control: the vector changes under normalization, so a normalizing store would fail above', () => {
        expect(core.canonicalizeLocale('en-US')).not.toBe('en-US');
        expect(core.canonicalizeLocale('es-CR')).not.toBe('es-CR');
    });

    it('the locale store keeps one identity across re-renders, so it is safe to hand to init()', () => {
        const hook = renderHook(() => useLocaleStore('en-US'));
        const first = hook.latest()[2];
        act(() => {
            hook.latest()[1]('fr-FR');
        });
        expect(hook.renders.length).toBeGreaterThan(1);
        expect(hook.latest()[2]).toBe(first);
    });
});

describe('BIND-2 — useWriteEnabled surfaces the server decision unchanged', () => {
    it('returns undefined, false and true exactly as the core holds them', () => {
        const hook = renderHook(() => useWriteEnabled());
        expect(hook.latest()).toBeUndefined();

        act(() => {
            core.writeEnabled.set(false);
        });
        expect(hook.latest()).toBe(false);

        act(() => {
            core.writeEnabled.set(true);
        });
        expect(hook.latest()).toBe(true);
    });

    it('firing control: a hook that defaults undefined to false is told apart', () => {
        // The defect as it would actually be written.
        const hook = renderHook((): boolean => useSignal(core.writeEnabled) ?? false);
        expect(hook.latest()).toBe(false);
    });
});

describe('BIND-5 — no cached lookups; key presence survives', () => {
    it('a present-with-null phrase renders what the core renders, and a later translation replaces it', () => {
        seed({ UI: { Pending: null } }, 'es-es');
        const hook = renderHook(() => useT()('Pending', 'UI'));
        expect(hook.latest()).toBe(core.LangsysApp.t('Pending', 'UI'));

        seed({ UI: { Pending: 'Pendiente' } }, 'es-es');
        expect(hook.latest()).toBe('Pendiente');
        expect(hook.latest()).toBe(core.LangsysApp.t('Pending', 'UI'));
    });

    it('firing control: a memoized lookup keeps the stale value the assertion above rejects', () => {
        seed({ UI: { Pending: null } }, 'es-es');
        const hook = renderHook(() => {
            const t = useT();
            return useMemo(() => t('Pending', 'UI'), []);
        });
        seed({ UI: { Pending: 'Pendiente' } }, 'es-es');
        expect(hook.latest()).not.toBe('Pendiente');
    });
});
