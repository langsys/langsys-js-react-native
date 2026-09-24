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

// Wires React Native's AppState to the core's teardown flush (see ./teardown.ts).
import './teardown.js';

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
    type WriteGrant,
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

// Server-computed session state, by reference and unadapted. The web React
// binding withholds the raw `writeEnabled` because a server render would read
// it before hydration; React Native has no server render and no hydration pass,
// so there is nothing to adapt and BIND-6 says re-export. Surface these, never
// branch on them (BIND-2). Pinned by `src/surface.test.ts`.
export { autoDiscovery, writeEnabled } from 'langsys-js-typescript';

// Write grant — supply a short-lived token after `init()` (e.g. once the user
// logs in). Standalone alias for `LangsysApp.setWriteGrant`; both re-authorize.
export { setWriteGrant } from 'langsys-js-typescript';

// Server messages (MSG): resolve entries from any response body and render
// them — the template through `t()` when the catalog holds it, the entry's own
// `message` otherwise. In components, `useServerMessage` keeps one current.
export {
    DEFAULT_SERVER_MESSAGE_CATEGORY,
    SERVER_MESSAGE_CODES,
    fillTemplate,
    renderServerMessage,
    resolveServerMessages,
    templateMarkers,
    toServerMessage,
    type ResolveServerMessagesOptions,
    type ServerMessage,
} from 'langsys-js-typescript';

// Storage injection (see module docs above) + locale canonicalization + API client.
export { canonicalizeLocale, LangsysAppAPI, setPersistStorage } from 'langsys-js-typescript';

// Hooks — the React-idiomatic reactive layer (same surface as langsys-js-react).
export {
    createLocaleStore,
    useCurrentLocale,
    useLocaleStore,
    useSignal,
    useServerMessage,
    useT,
    useTranslations,
    useWriteEnabled,
} from './hooks.js';

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
    WriteGrant,
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
 * RN SDK entry point — the core singleton itself, re-exported **by reference**,
 * with `init` narrowed to the RN-flavoured config.
 *
 * Deliberately not a wrapper class. The previous one listed each core method
 * and delegated it, and a list like that goes stale silently: `seedCatalog` and
 * `setWriteGrant` were never added to it, so neither was reachable here. A
 * by-reference export cannot fall behind — a public member added to the core
 * is reachable the moment it exists — and it preserves identity, so `this`
 * binds and destructuring works. Sound only because the class overrode no
 * behaviour: every member was a straight delegation.
 *
 * `Omit<typeof _LangsysApp, 'init'>` is keyof-mapped, so it does not widen the
 * core's `private` members. Pinned by `src/surface.test.ts`.
 */
export const LangsysApp: Omit<typeof _LangsysApp, 'init'> & {
    /** Initialize Langsys. Pass a `Signal<string>` (from `createLocaleStore`) as `UserLocaleStore`. */
    init(config: iLangsysInitConfig): Promise<iLangsysResponse>;
} = _LangsysApp;
