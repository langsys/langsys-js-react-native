import { setTeardownSignal } from 'langsys-js-typescript';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppState, appStateListenerCount, emitAppState, type AppStateStatus } from '../test-stubs/react-native.js';
import { subscribeToAppDeparture } from './teardown.js';

/**
 * The departure signal the binding hands the core: fire once each time the app
 * leaves `active`. In-process, no server involved — tier `n/a (pure)`. What the
 * core does when it fires is proven against the contract fixture in
 * `rn-teardown.test.ts`.
 */

// From `active`: out (fire), on to background, back, out (fire), back, out (fire), back.
const JOURNEY: AppStateStatus[] = ['inactive', 'background', 'active', 'background', 'active', 'inactive', 'active'];

function count(subscribe: (fire: () => void) => () => void, journey: AppStateStatus[]): number {
    let fired = 0;
    const release = subscribe(() => {
        fired++;
    });
    for (const state of journey) emitAppState(state);
    release();
    return fired;
}

/** The defect as it would be written: fire on every change that is not `active`. */
function levelTriggered(fire: () => void): () => void {
    const subscription = AppState.addEventListener('change', (next) => {
        if (next !== 'active') fire();
    });
    return () => subscription.remove();
}

beforeEach(() => {
    emitAppState('active');
});

describe('the app-departure signal', () => {
    it('fires once per departure from active, however many states the exit passes through', () => {
        expect(count(subscribeToAppDeparture, JOURNEY)).toBe(3);
    });

    it('firing control: a level-triggered signal fires more often on the same journey', () => {
        expect(count(levelTriggered, JOURNEY)).toBe(4);
    });

    it('fires for a kill from the iOS app switcher, which never reaches background', () => {
        expect(count(subscribeToAppDeparture, ['inactive'])).toBe(1);
    });

    it('does not fire for an app that has not been active', () => {
        emitAppState('background');
        expect(count(subscribeToAppDeparture, ['inactive', 'background'])).toBe(0);
    });

    it('its release removes the listener it added', () => {
        const before = appStateListenerCount();
        const release = subscribeToAppDeparture(() => undefined);
        expect(appStateListenerCount()).toBe(before + 1);
        release();
        expect(appStateListenerCount()).toBe(before);
    });
});

describe('installation', () => {
    it('loading the package installs exactly one listener', () => {
        // `./teardown.js` installed itself when this file imported it.
        expect(appStateListenerCount()).toBe(1);
    });

    it('re-installing, as Fast Refresh does, leaves exactly one listener live', () => {
        setTeardownSignal(subscribeToAppDeparture);
        setTeardownSignal(subscribeToAppDeparture);
        expect(appStateListenerCount()).toBe(1);
    });
});
