import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * REG-3 in a React Native execution context — a KNOWN GAP, pinned so it can
 * neither close nor regress silently. CONFORMANCE.md rows it `not implemented`.
 *
 * The core installs its teardown flush on `document` `visibilitychange` and
 * `window` `pagehide`, and only when both globals exist. React Native defines
 * `window` and not `document`, so nothing flushes a queued registration when
 * the app backgrounds and is killed. Every flush-named member of the core is
 * `private`, so this binding has nothing public to wire `AppState` to. Closing
 * it needs a core seam (requested on the mesh topic `rn-teardown-flush-seam`).
 *
 * When the seam lands and this binding wires it, extend the rn probe to fire the
 * AppState transition: the `it.fails` row then goes red, which is the signal to
 * flip it to `it` and re-grade REG-3, REG-4 and REG-5 together.
 *
 * Each shape runs in its own process (CONF-3): the core is a module singleton.
 */

interface ProbeResult {
    mode: 'browser' | 'rn';
    threw: string | null;
    teardownInstalled: boolean;
    coreListenedFor: string[];
    queuedAtTeardown: string[];
    sentOnTeardown: Array<{ phrases: string[]; keepalive: boolean }>;
}

const script = fileURLToPath(new URL('../_dev_/rn-teardown-probe.mjs', import.meta.url));

function runProbe(mode: 'browser' | 'rn'): ProbeResult {
    const out = execFileSync(process.execPath, [script, mode], { encoding: 'utf8' }).trim().split('\n');
    return JSON.parse(out[out.length - 1] ?? '{}') as ProbeResult;
}

describe('REG-3 — flush before the execution context ends', () => {
    const browser = runProbe('browser');
    const rn = runProbe('rn');

    it('firing control: in a browser-shaped context the harness observes the teardown flush', () => {
        expect(browser.teardownInstalled).toBe(true);
        expect(browser.queuedAtTeardown).toEqual(['Unseen phrase']);
        expect(browser.sentOnTeardown).toEqual([{ phrases: ['Unseen phrase'], keepalive: true }]);
    });

    it('precondition: the React Native context queued the same miss, and the miss did not throw', () => {
        // Without this, an empty send below could mean the miss was never
        // queued — a different finding from "queued and never flushed".
        expect(rn.threw).toBeNull();
        expect(rn.queuedAtTeardown).toEqual(['Unseen phrase']);
    });

    it.fails('React Native flushes the queue before its execution context ends', () => {
        expect(rn.sentOnTeardown).toEqual([{ phrases: ['Unseen phrase'], keepalive: true }]);
    });
});
