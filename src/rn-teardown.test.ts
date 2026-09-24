import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * REG-3 on React Native, against the contract fixture (tier `contract`).
 *
 * React Native defines `window` and no `document`, so the core's browser
 * teardown listeners do not exist; the binding supplies the signal instead,
 * from `AppState`. The scenario that separates "flushed on departure" from
 * "sent eventually": the first send is refused, so REG-8 backoff holds the
 * phrase for three seconds. Leaving the foreground inside that window must land
 * it in the double's accepted state. The control is the same world without the
 * departure: the double would accept the phrase (write key, fault consumed), and
 * inside the window it has not arrived.
 *
 * Every assertion reads what the double accepted, never what the SDK sent.
 */

// React Native's globals, in place before the core loads.
(globalThis as Record<string, unknown>).window = globalThis;

const { emitAppState } = await import('../test-stubs/react-native.js');
const { LangsysApp, createLocaleStore, writeEnabled } = await import('./index.js');

const SETTLE_MS = 1200; // past the ~400ms debounce, well short of the 3s backoff
const WINDOW_MS = 2800; // from the miss: still inside the backoff that follows the refused send

const SEED = {
    projects: [{ id: 'p1', base_locale: 'en-us', phrases: [{ category: 'UI', phrase: 'Known', translations: {} }] }],
    keys: [{ key: 'k-write', project: 'p1', type: 'write' }],
};
const REFUSE_FIRST_SEND = { ...SEED, faults: [{ method: 'POST', path: '/translatable-items', times: 1, status: 500 }] };

interface Fixture {
    baseUrl: string;
    fixtureUrl: string;
    proc: ChildProcess;
}
let fx: Fixture;

async function startFixture(): Promise<Fixture> {
    const server = fileURLToPath(new URL('../contract-fixture/server.mjs', import.meta.url));
    const proc = spawn(process.execPath, [server], { stdio: ['ignore', 'pipe', 'inherit'] });
    const line = await new Promise<string>((resolve, reject) => {
        createInterface({ input: proc.stdout! }).once('line', resolve);
        proc.once('exit', (code) => reject(new Error(`contract fixture exited with ${code}`)));
    });
    const ready = JSON.parse(line) as { base_url: string; fixture_url: string };
    return { baseUrl: ready.base_url, fixtureUrl: ready.fixture_url, proc };
}

async function seed(doc: object): Promise<void> {
    const res = await fetch(`${fx.fixtureUrl}/seed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(doc),
    });
    if (!res.ok) throw new Error(`seed refused: ${res.status}`);
}

async function registered(): Promise<string[]> {
    const state = (await (await fetch(`${fx.fixtureUrl}/state`)).json()) as {
        projects: Record<string, { phrases: Array<{ phrase: string }> }>;
    };
    return (state.projects.p1?.phrases ?? []).map((p) => p.phrase);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
    fx = await startFixture();
    await seed(SEED);
    const res = await LangsysApp.init({
        projectid: 'p1',
        key: 'k-write',
        UserLocaleStore: createLocaleStore('en-us'),
        baseLocale: 'en-us',
        apiUrl: fx.baseUrl,
    });
    expect(res.status, 'init against the fixture').toBe(true);
    await LangsysApp.translationsLoadingPromise;
    expect(writeEnabled.get(), 'the double computed a write-enabled session').toBe(true);
}, 15_000);

afterAll(() => {
    fx?.proc.kill();
    delete (globalThis as Record<string, unknown>).window;
});

beforeEach(async () => {
    emitAppState('active');
    await seed(REFUSE_FIRST_SEND);
});

describe('REG-3 — what is queued when the app leaves the foreground is sent', () => {
    it('a phrase held by backoff lands when the app leaves the foreground', async () => {
        const missAt = Date.now();
        LangsysApp.t('Queued at departure', 'UI');
        await sleep(SETTLE_MS);
        expect(await registered(), 'the first send was refused, so the phrase is held').not.toContain(
            'Queued at departure'
        );

        emitAppState('background');
        while (!(await registered()).includes('Queued at departure') && Date.now() - missAt < WINDOW_MS) {
            await sleep(50);
        }
        expect(await registered()).toContain('Queued at departure');
        expect(Date.now() - missAt, 'it landed inside the backoff window, so the departure sent it').toBeLessThan(
            WINDOW_MS
        );
    }, 10_000);

    it('control: without a departure the same held phrase has not landed inside the window', async () => {
        const missAt = Date.now();
        LangsysApp.t('Held without departure', 'UI');
        await sleep(WINDOW_MS - (Date.now() - missAt));
        expect(await registered()).not.toContain('Held without departure');
    }, 10_000);
});
