/**
 * langsys-js-react-native — React Native binding over `langsys-js-typescript`.
 * EXPERIMENTAL (hooks-first).
 *
 * What works today: the entire `t()` pipeline — catalog fetch (global
 * `fetch`), locale switching, ICU interpolation via Hermes `Intl`, token
 * discovery with write keys — plus the same hooks as the web React binding
 * (`useSyncExternalStore` is core React, not DOM).
 *
 * What's deliberately absent: `<Translate>` (the web version walks an HTML
 * tree that doesn't exist in RN) and `<Phrase>` (portable in principle via the
 * base SDK's markup-token scheme, but it needs an RN-native encoder — on the
 * roadmap). `<DontTranslate>` ships as an API-parity `<Text>` pass-through.
 *
 * Storage: RN has no `localStorage`, so out of the box the catalog cache is
 * in-memory (cold starts refetch). Inject a synchronous adapter at startup —
 * MMKV fits perfectly — via `setPersistStorage`:
 *
 *   import { MMKV } from 'react-native-mmkv';
 *   import { setPersistStorage } from 'langsys-js-react-native';
 *
 *   const storage = new MMKV({ id: 'langsys' });
 *   setPersistStorage({
 *       getItem: (key) => storage.getString(key) ?? null,
 *       setItem: (key, value) => storage.set(key, value),
 *   });
 *   // then LangsysApp.init(...) as usual
 */

import {
    LangsysApp as _LangsysApp,
    type ExtractParamKeys,
    type ParamPrimitive,
    type ParamsFor,
    type PersistStorage,
    type Signal,
    type TArgs,
    type TFunction,
    type TranslationParams,
    type iCategories,
    type iLangsysInitConfig as iVanillaInitConfig,
    type iLangsysResponse,
    type iLocaleData,
    type iLocaleFlat,
    type iTranslations,
} from 'langsys-js-typescript';

// Reactive primitives (raw signals) — re-exported for advanced/direct
// subscription. `tSignal` is exposed under the friendlier name `t`.
export { currentlyLoadedLocale, createSignal, sTranslations, tSignal as t } from 'langsys-js-typescript';

// Storage injection (see module docs above) + locale canonicalization + API client.
export { canonicalizeLocale, LangsysAppAPI, setPersistStorage } from 'langsys-js-typescript';

// Hooks — the React-idiomatic reactive layer (same surface as langsys-js-react).
export { createLocaleStore, useCurrentLocale, useLocaleStore, useSignal, useT, useTranslations } from './hooks.js';

// Components
export { DontTranslate, type DontTranslateProps } from './components/DontTranslate.js';

// Type re-exports.
export type {
    ExtractParamKeys,
    ParamPrimitive,
    ParamsFor,
    PersistStorage,
    Signal,
    TArgs,
    TFunction,
    TranslationParams,
    iCategories,
    iLangsysResponse,
    iLocaleData,
    iLocaleFlat,
    iTranslations,
};

/**
 * RN-flavored init config. Identical to the base SDK's config except
 * `UserLocaleStore` is typed as a `Signal<string>` — create one with
 * `createLocaleStore()` or get one from `useLocaleStore`.
 */
export interface iLangsysInitConfig extends Omit<iVanillaInitConfig, 'UserLocaleStore'> {
    UserLocaleStore: Signal<string>;
}

/**
 * RN SDK entry point. Delegates everything to the underlying
 * `langsys-js-typescript` singleton — same delegating surface as the other
 * bindings.
 */
class LangsysAppReactNative {
    /** Initialize Langsys. Pass a `Signal<string>` (from `createLocaleStore`) as `UserLocaleStore`. */
    public init(config: iLangsysInitConfig): Promise<iLangsysResponse> {
        return _LangsysApp.init(config);
    }

    public get Translations() {
        return _LangsysApp.Translations;
    }

    public get translationsLoadingPromise() {
        return _LangsysApp.translationsLoadingPromise;
    }

    /** Current translation function. Reads fresh state on every call (not reactive on its own — use `useT()` in components). */
    public get t(): TFunction {
        return _LangsysApp.t;
    }

    public get debug() {
        return _LangsysApp.debug;
    }

    public refresh() {
        return _LangsysApp.refresh();
    }

    public getCountries(inLocale?: string) {
        return _LangsysApp.getCountries(inLocale);
    }
    public getCountryName(forCountryCode: string, inLocale?: string) {
        return _LangsysApp.getCountryName(forCountryCode, inLocale);
    }
    public getCurrencies(inLocale?: string) {
        return _LangsysApp.getCurrencies(inLocale);
    }
    public getCurrencyName(forCurrencyCode: string, inLocale?: string) {
        return _LangsysApp.getCurrencyName(forCurrencyCode, inLocale);
    }
    public getDialCodes(inLocale?: string) {
        return _LangsysApp.getDialCodes(inLocale);
    }

    public getLocales(inLocale?: string) {
        return _LangsysApp.getLocales(inLocale);
    }
    public getLocalesFlat(inLocale?: string) {
        return _LangsysApp.getLocalesFlat(inLocale);
    }
    public getLocalesData(inLocale?: string, forceRefresh?: boolean) {
        return _LangsysApp.getLocalesData(inLocale, forceRefresh);
    }
    public getLocalesFormat(format: '' | 'flat' | 'data' = '', inLocale?: string) {
        return _LangsysApp.getLocalesFormat(format, inLocale);
    }
    public getLocaleName(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLocaleName(forLocale, shortName, inLocale);
    }
    public getLocaleNameWithLookup(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLocaleNameWithLookup(forLocale, shortName, inLocale);
    }

    /** @deprecated use `getLocaleNameWithLookup` or `getLocaleName` */
    public getLanguageName(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLanguageName(forLocale, shortName, inLocale);
    }

    public detectPreferredLocale(acceptLanguageHeader?: string | null, supportedLocales?: string[]) {
        return _LangsysApp.detectPreferredLocale(acceptLanguageHeader, supportedLocales);
    }
}

export const LangsysApp = new LangsysAppReactNative();
