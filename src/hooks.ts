import { useState, useSyncExternalStore } from 'react';
import { createSignal, currentlyLoadedLocale, sTranslations, tSignal } from 'langsys-js-typescript';
import type { Signal, TFunction, iCategories } from 'langsys-js-typescript';

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
