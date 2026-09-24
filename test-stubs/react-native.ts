/**
 * Test-only runtime stand-in for `react-native`, aliased in `vitest.config.mts`.
 *
 * This package never installs React Native (see `types-shim/react-native.d.ts`),
 * so this supplies the two APIs the binding uses: `Text`, rendered as a host
 * element named `Text`, and `AppState`, driven by `emitAppState`. Like React
 * Native, `AppState` notifies listeners only when the state actually changes.
 * Not published: `files` ships `dist` only.
 */
import { createElement, type ReactElement, type ReactNode } from 'react';

export function Text(props: { children?: ReactNode }): ReactElement {
    return createElement('Text', null, props.children);
}

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
type Listener = (state: AppStateStatus) => void;

const listeners = new Set<Listener>();

export const AppState = {
    currentState: 'active' as AppStateStatus,
    addEventListener(_type: 'change', listener: Listener): { remove(): void } {
        listeners.add(listener);
        return { remove: () => void listeners.delete(listener) };
    },
};

/** Move the app to `next`, notifying listeners as React Native does. */
export function emitAppState(next: AppStateStatus): void {
    if (AppState.currentState === next) return;
    AppState.currentState = next;
    for (const listener of [...listeners]) listener(next);
}

/** How many `AppState` change listeners are live. */
export function appStateListenerCount(): number {
    return listeners.size;
}
