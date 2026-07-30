/**
 * Dev-time-only ambient shim so this package typechecks without installing
 * react-native (a very heavy devDependency for one component). NOT shipped:
 * it isn't imported by any entry, so tsup's dts bundle never includes it —
 * consumers use their app's real react-native types.
 */
declare module 'react-native' {
    import type { ComponentType, ReactNode } from 'react';
    export const Text: ComponentType<{ children?: ReactNode }>;
}
