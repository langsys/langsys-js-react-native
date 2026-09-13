/**
 * Test-only runtime stand-in for `react-native`, aliased in `vitest.config.ts`.
 *
 * This package never installs React Native (see `types-shim/react-native.d.ts`),
 * so without this any test importing the entry point fails to resolve
 * `<DontTranslate>`'s `Text` import. It renders a host element named `Text`,
 * which is the whole of the component surface this binding touches. Not
 * published: `files` ships `dist` only.
 */
import { createElement, type ReactElement, type ReactNode } from 'react';

export function Text(props: { children?: ReactNode }): ReactElement {
    return createElement('Text', null, props.children);
}
