import { setTeardownSignal } from 'langsys-js-typescript';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * React Native's teardown signal for the core's queued registrations (REG-3).
 *
 * The core sends whatever is still queued when the host says the app is going
 * away; in a browser that signal is `pagehide`. Here it is `AppState` leaving
 * `active`: past that point the OS may suspend or kill the JS thread without
 * further notice. The core owns the send — this adapts only the lifecycle event
 * (BIND-1).
 *
 * Fires once per departure. The edge out of `active` is the one transition
 * every exit path crosses exactly once: iOS passes active → inactive →
 * background within milliseconds, a kill from the app switcher stops at
 * `inactive`, and Android goes straight to `background`.
 */
export function subscribeToAppDeparture(fire: () => void): () => void {
    let previous: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
        if (previous === 'active' && next !== 'active') fire();
        previous = next;
    });
    return () => subscription.remove();
}

// Installed when the package loads, for the life of the app. Fast Refresh
// re-evaluates this module; the core releases the previous subscription before
// taking the new one, so exactly one listener is ever live.
setTeardownSignal(subscribeToAppDeparture);
