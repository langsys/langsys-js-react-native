import { useState, useSyncExternalStore } from 'react';
import { createSignal, currentlyLoadedLocale, sTranslations, tSignal, writeEnabled } from 'langsys-js-typescript';
import { renderServerMessage } from 'langsys-js-typescript';
import type { ServerMessage, Signal, TFunction, iCategories } from 'langsys-js-typescript';

/**
 * Subscribe the component to a base-SDK `Signal<T>`. Identical implementation
 * to the web React binding — React Native ships the same React, and
 * `useSyncExternalStore` is core React, not DOM. The signal's methods are
 * detachable closures, so passing them straight through is safe.
 */
export function useSignal<T>(signal: Signal<T>): T {
    return useSyncExternalStore(signal.subscribe, signal.get, signal.get);
}

/**
 * The current translation function, re-rendering the component whenever the
 * locale or catalog changes.
 *
 *   const t = useT();
 *   <Text>{t('Hello, {name}!', 'Greetings', { name })}</Text>
 *
 * The phrase is both the lookup key and the base-language default; ICU
 * plurals/number/date formatting ride on Hermes's `Intl`.
 */
export function useT(): TFunction {
    return useSignal(tSignal);
}

/**
 * The locale whose translations are currently loaded. Lags the user-selected
 * locale until the fetch for the new locale settles — the right value to gate
 * "translations are ready" UI on.
 */
export function useCurrentLocale(): string {
    return useSignal(currentlyLoadedLocale);
}

/** The raw translation catalog. Rarely needed — prefer `useT()`. */
export function useTranslations(): iCategories {
    return useSignal(sTranslations);
}

/**
 * Create a reactive `Signal<string>` to hold the user's selected locale.
 * Pass it as `UserLocaleStore` to `LangsysApp.init` and switch locale with
 * `store.set('fr-FR')`.
 */
export function createLocaleStore(initial = 'en-US'): Signal<string> {
    return createSignal<string>(initial);
}

/**
 * All-in-one convenience: `[locale, setLocale, store]`. The store is created
 * once per component instance (stable across re-renders), so it's safe to
 * hand to `LangsysApp.init`.
 */
export function useLocaleStore(initial = 'en-US'): [string, (locale: string) => void, Signal<string>] {
    const [store] = useState(() => createLocaleStore(initial));
    const locale = useSignal(store);
    return [locale, store.set, store];
}

/**
 * Whether this session may register content, exactly as the server decided it.
 *
 * Tri-state, and the states are distinct: `undefined` (authorization has not
 * landed), `false` (read-only) and `true`. Returned undefaulted — collapsing
 * `undefined` to `false` would be this binding deciding something only the
 * server is entitled to (BIND-2).
 *
 * Plain `useSignal`, unlike the web React binding, which pins the server
 * snapshot to `undefined` so a hydration render cannot disagree with server
 * HTML. React Native never renders on a server, so there is no snapshot to pin.
 */
export function useWriteEnabled(): boolean | undefined {
    return useSignal(writeEnabled);
}

/**
 * A server message entry (MSG-5), rendered and kept current: its template
 * through `t()` when the catalog holds a translation for it, the entry's own
 * `message` otherwise. The choice is the core's `renderServerMessage`; this
 * hook only subscribes the component, so it re-renders when the catalog or the
 * locale changes.
 *
 *   const [entry] = resolveServerMessages(await response.json());
 *   const text = useServerMessage(entry);
 *
 * `category` defaults to the one configured with `messagesCategory` in `init`
 * (`Errors` unless set).
 */
export function useServerMessage(entry: ServerMessage, category?: string): string {
    useT();
    return renderServerMessage(entry, category);
}
