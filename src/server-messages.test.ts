import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as core from 'langsys-js-typescript';
import type { ServerMessage } from 'langsys-js-typescript';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { resolveServerMessages, useServerMessage } from './index.js';

/**
 * Server messages through this binding.
 *
 * MSG-1: entries resolve from a framework's own error body through
 * configuration — the key the server attached them under — and the body is left
 * as it was. `resolveServerMessages` is the core's, re-exported by reference.
 *
 * MSG-5, the binding's half: `useServerMessage` renders an entry exactly as the
 * core's `renderServerMessage` decides, and keeps it current as the catalog and
 * locale change. The decision — template through `t()` when the catalog holds a
 * translation, the entry's `message` otherwise — is the core's.
 *
 * Every resolve and render vector in the shared file runs through the binding's
 * exports, the render ones in a real React tree. The file is vendored
 * byte-exact and its git blob is pinned below. In-process, no server involved:
 * tier `n/a (pure)`.
 */

const VECTORS_BLOB = '7333e3919dac43af81c6c20bfdba974efd79725b';
const raw = readFileSync(new URL('../vectors/server-message-vectors.json', import.meta.url));
const doc = JSON.parse(raw.toString('utf8')) as {
    canonical_entries: ServerMessage[];
    resolve: Array<{
        id: string;
        body: unknown;
        options: core.ResolveServerMessagesOptions;
        expected: ServerMessage[];
        body_unchanged?: boolean;
    }>;
    render: Array<{
        id: string;
        locale: string;
        category: string;
        catalog: Record<string, Record<string, string>> | null;
        entry: ServerMessage;
        expected: string;
    }>;
};

beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

const mounted: ReactTestRenderer[] = [];
afterEach(() => {
    act(() => {
        for (const renderer of mounted.splice(0)) renderer.unmount();
    });
});

/** Publish a vector's catalog the way the core's own vector harness does; `null` is no catalog at all. */
function publish(catalog: Record<string, Record<string, string>> | null, locale: string): void {
    const categories: Record<string, Record<string, string>> = {
        __uncategorized__: { __category__: '__uncategorized__', __symbol__: '__uncategorized__' },
    };
    for (const [category, entries] of Object.entries(catalog ?? {})) {
        categories[category] = { __category__: category, __symbol__: category, ...entries };
    }
    act(() => {
        core.sTranslations.set(categories as never);
        core.currentlyLoadedLocale.set(locale);
    });
}

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

describe('the vendored vector file', () => {
    it('is byte-exact: its git blob is the one the core authored', () => {
        const blob = createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
        expect(blob).toBe(VECTORS_BLOB);
        expect(doc.resolve).toHaveLength(10);
        expect(doc.render).toHaveLength(12);
        expect(doc.canonical_entries).toHaveLength(12);
    });
});

describe('MSG-1 — entries resolve through configuration, and the body stays the framework’s', () => {
    for (const row of doc.resolve) {
        it(row.id, () => {
            const before = structuredClone(row.body);
            expect(resolveServerMessages(row.body, row.options)).toEqual(row.expected);
            expect(row.body).toEqual(before);
        });
    }

    it('the same entries render identically beside two frameworks’ native bodies', () => {
        const entries = doc.canonical_entries.map(({ field, code, template, params, message }) => ({
            field,
            code,
            template,
            params,
            message,
        }));
        const laravel = {
            message: 'The given data was invalid.',
            errors: { password: ['The password field is required.'] },
            langsys_errors: entries,
        };
        const fastapi = {
            detail: [{ type: 'missing', loc: ['body', 'password'], msg: 'Field required' }],
            langsys_errors: entries,
        };
        const first = entries[0]!;
        publish({ Errors: { [first.template!]: 'El campo contraseña es obligatorio.' } }, 'es');

        const render = (body: unknown) => {
            const resolved = resolveServerMessages(body, { key: 'langsys_errors' });
            return renderHook(() => resolved.map((entry) => useServerMessage(entry)))();
        };
        const fromLaravel = render(laravel);
        const fromFastapi = render(fastapi);
        expect(fromLaravel).toHaveLength(entries.length);
        expect(fromLaravel[0]).toBe('El campo contraseña es obligatorio.');
        expect(fromFastapi).toEqual(fromLaravel);
        // The framework's own error body is untouched.
        expect(laravel.errors).toEqual({ password: ['The password field is required.'] });
    });
});

describe('MSG-5 — useServerMessage renders every vector as the core does', () => {
    for (const row of doc.render) {
        it(row.id, () => {
            publish(row.catalog, row.locale);
            const latest = renderHook(() => useServerMessage(row.entry, row.category));
            expect(latest()).toBe(row.expected);
            expect(latest()).toBe(core.renderServerMessage(row.entry, row.category));
        });
    }
});

describe('MSG-5 — the rendered message stays current', () => {
    const entry = doc.render.find((r) => r.id === 'laravel-translation-with-param')!;

    it("follows the catalog: the entry's message, then the translation once it arrives", () => {
        publish({ Errors: {} }, 'es');
        const latest = renderHook(() => useServerMessage(entry.entry, 'Errors'));
        expect(latest()).toBe(entry.entry.message);

        publish(entry.catalog, 'es');
        expect(latest()).toBe(entry.expected);
    });

    it('firing control: a render that does not subscribe keeps the stale message', () => {
        publish({ Errors: {} }, 'es');
        const latest = renderHook(() => core.renderServerMessage(entry.entry, 'Errors'));
        publish(entry.catalog, 'es');
        expect(latest()).toBe(entry.entry.message);
    });
});
