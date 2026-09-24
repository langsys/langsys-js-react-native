/**
 * Dev-time-only ambient shim so this package typechecks without installing
 * react-native (a very heavy devDependency for the two APIs it uses). NOT
 * shipped: it isn't imported by any entry, so tsup's dts bundle never includes
 * it — consumers use their app's real react-native types.
 */
declare module 'react-native' {
    import type { ComponentType, ReactNode } from 'react';
    export const Text: ComponentType<{ children?: ReactNode }>;

    export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';
    export interface NativeEventSubscription {
        remove(): void;
    }
    export const AppState: {
        currentState: AppStateStatus;
        addEventListener(type: 'change', listener: (state: AppStateStatus) => void): NativeEventSubscription;
    };
}
