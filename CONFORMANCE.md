# Conformance — `langsys-js-react-native`

| | |
|---|---|
| **Spec revision read** | langsys2 aac52142…, docs/sdk-spec.mdx blob 5f01ef7d761c35157e553ed0ea83b9a4539511c3 |
| **Profiles** | browser, binding, all — derived: binding over langsys-js-typescript |
| **specVersion** | 8.2.19. The blob is re-derived at this write with `git -C ~/Documents/dev/langsys2 ls-tree aac52142 docs/sdk-spec.mdx`, and the 114 rule ids below are enumerated from it |
| **SDK** | `langsys-js-react-native` 0.1.0 — React Native binding, hooks-first, experimental |
| **SDK revision** | `feature/838_write_key_gating` |
| **Core consumed** | `langsys-js-typescript` `fbbb6a93` (`feature/838_write_key_gating_reland`, pushed), built clean in a separate worktree (`npm ci && npm run build`, no local changes) and resolved through the gitignored `node_modules` symlink. Core rows cited below come from its `CONFORMANCE.md`, blob `fd65a04f722e6f0d63cdae59e82f1f03d3f31e79` at that commit, graded against 8.2.18 (blob `5d7e6890`) — see What surfaced |
| **Contract fixture** | `contract-fixture/`, vendored byte-exact from the core (unchanged through `fbbb6a93`): tree `542f57f5ffcb9038db1b7411152b7e31b96cb269` (`git write-tree --prefix=contract-fixture/` on the staged copy). Run with `node contract-fixture/server.mjs`, Node 18 or later |
| **Shared vectors** | `vectors/server-message-vectors.json`, vendored byte-exact from the core's `tests/fixtures/`: blob `7333e3919dac43af81c6c20bfdba974efd79725b`, which the suite recomputes and pins |
| **Suite** | 118 tests in 9 files, `npm test`, all passing. Counted from vitest's report at this tip |
| **Tally** | implemented 11 · delegated 59 · n/a (architecture) 34 · n/a (profile: server) 10 — 114 rows, each id graded once |

**What surfaced while writing this.**

1. **One delegated row resolves to a core row that is not green: REG-10**, `partial` in the core
   and waiting on an API decision there. This binding authors no registration behaviour (the REG
   probe reads 0 hits), so it turns green here when the core's row does.
2. **The core's file is graded against 8.2.18, this one against 8.2.19.** Between the two blobs
   only REG-10, SSR-3 and SRV-6 changed text, and SRV-7 is new. Of these, only REG-10 is a delegated
   row here, and its core row is `partial` on either text; SSR-3, SRV-6 and SRV-7 are
   `n/a (architecture: no server render)`. Every other delegated row resolves against a core row
   graded on identical rule text.
3. **Server messages resolve through configuration and render through one decision, the core's.**
   `resolveServerMessages` reads entries only at the key the app names (or through its resolver),
   and all ten shared resolve vectors, drawn from Laravel, FastAPI, DRF and Rails error bodies,
   come out as expected with the body unchanged. `useServerMessage` subscribes the component and
   returns the core's `renderServerMessage`, so all twelve render vectors come out identical
   through the hook and through the core. The one thing the hook adds is staying current: a render
   that does not subscribe keeps a stale message after the catalog arrives.
4. **A bundled key file reaches the core through `init` untouched.** The React Native shape of the
   legacy-key mode is a source-language JSON file shipped with the app and passed as `legacyKeys`.
   Against the contract fixture, a key renders the translation of its source value through
   `useT()`, and a new key registers its value under the key's namespace, never the key.
5. **A bundled snapshot is the first render's catalog, and stays a cache.** `LangsysApp.loadSnapshot`
   is the core method by reference, and `SnapshotError` the core's class. A snapshot shipped with
   the app renders through `useT()` the moment it loads, before `init()` and with nothing awaited;
   an edited one is refused as `checksum`; and once `init()` runs against the contract fixture, a
   phrase the snapshot lacks renders the catalog's translation.
6. **npm's `latest` is still 0.6.5, which carries none of the 838 surface.** `setTeardownSignal`,
   `setPersistStorage` and `writeEnabled` each appear in 0 `dist` files of the published tarball;
   the control `canonicalizeLocale` appears in 6. Against it, a fresh clone fails `tsc` (Gap 1).

## Scope

This is a **binding**. It inherits the browser core's profile and adds no behaviour of its own,
except two framework adaptations: it tells the core when the app leaves the foreground, and it
keeps a rendered server message current.

- **`implemented`** — the six binding rules, the three conformance meta-rules, REG-3, where the
  binding supplies React Native's teardown signal, and MSG-5, where it supplies the reactive
  wrapper. REG-3 is proven against the contract fixture, tier `contract`; the rest are in-process,
  tier `n/a (pure)`.
- **`delegated`** — families the core owns. Each row names the core's row, plus an absence probe
  showing this binding does not participate, plus that probe's firing control. Tier `-`.
- **`n/a (architecture: …)`** — rules the React Native execution model cannot reach: no DOM, so no
  HINT, TOK, MARK or GATE-10 (the spec's Profiles carve-out), and nothing here renders on a server,
  so no SSR, SRV or MSG-12. Each names what would make it live. Tier `-`.
- **`n/a (profile: server)`** — rules profiled for server SDKs only. Tier `-`.

## Status

| Rule | Status | Tier | Evidence |
|---|---|---|---|
| GATE-1 | delegated | - | core row GATE-1: implemented, contract · probe *GATE-1..9: no capability decisions* → 0 hits in the 4 pinned source files · firing control hits on `if (auth.key_type === 'write')` |
| GATE-2 | delegated | - | core row GATE-2: implemented, contract · probe *GATE-1..9* → 0 hits · firing control hits. Binding half: `useWriteEnabled` holds `undefined` rather than defaulting it (BIND-2) |
| GATE-3 | delegated | - | core row GATE-3: implemented, n/a (pure) · probe *GATE-1..9* → 0 hits · firing control hits. `setPersistStorage` is forwarded by reference, so what reaches injected storage is decided core-side |
| GATE-4 | delegated | - | core row GATE-4: implemented, n/a (pure) · probe *GATE-1..9* → 0 hits · firing control hits. No response is cached here (probe *CACHE-1..2* → 0) |
| GATE-5 | delegated | - | core row GATE-5: implemented, contract · probe *GATE-1..9* → 0 hits, and probe *REG-1..13* → 0 hits: no bookkeeping exists here · firing controls hit |
| GATE-6 | delegated | - | core row GATE-6: implemented, contract · probe *GATE-1..9* → 0 hits · firing control hits. The report lane is unreachable on React Native (HINT rows) |
| GATE-7 | delegated | - | core row GATE-7: implemented, contract · probe *GATE-1..9* → 0 hits · firing control hits. The only detecting path here is `t()`, and it is the core function by reference (BIND-6) |
| GATE-8 | delegated | - | core row GATE-8: implemented, contract · probe *GATE-1..9* → 0 hits · firing control hits |
| GATE-9 | delegated | - | core row GATE-9: implemented, contract · probe *GATE-1..9* → 0 hits, including `discovery_base_locale_only` in either spelling · firing control hits |
| GATE-10 | n/a (architecture: no DOM — the rule's readers are DOM hosts, and React Native has none) | - | The readers are `<Translate>`, content blocks, `<Phrase>` and the page walk, none of which exists here. A bare `t()` call, `useT()` in this binding, is outside the rule by construction and records its miss as usual; GATE-9 governs it (delegated above). Nothing here renders on a server, so no resolved values are handed off either. Live if this binding renders into a DOM, such as React Native for Web |
| CAT-1 | delegated | - | core row CAT-1: implemented, n/a (pure) · probe *CAT-1..3: no catalog reads or presence tests* → 0 hits · firing control hits on a `hasOwnProperty` presence test |
| CAT-2 | delegated | - | core row CAT-2: implemented, n/a (pure) · probe *CAT-1..3* → 0 hits · firing control hits. Binding half: a present-with-null phrase renders exactly what the core renders (BIND-5) |
| CAT-3 | delegated | - | core row CAT-3: implemented, n/a (pure) · probe *CAT-1..3* → 0 hits · firing control hits |
| REG-1 | delegated | - | core row REG-1: implemented, n/a (pure) · probe *REG-1..13: no registration: queueing, batching, sending or backoff* → 0 hits · firing control hits on `api.createTranslatableItems(batch, { keepalive: true })` |
| REG-2 | delegated | - | core row REG-2: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits. The debounce runs core-side on React Native, which defines `window` |
| REG-3 | implemented | contract | `src/rn-teardown.test.ts` against the contract fixture, with React Native's globals (`window` is the global, no `document`). The first send is refused, so REG-8 backoff holds the phrase; the app leaves the foreground and the phrase is in the double's accepted state inside the backoff window. Control: the same world without the departure, where the double would accept the phrase, and inside the window it has not landed. Binding half: `src/teardown.ts` passes `setTeardownSignal` a subscription that fires once per departure from `active` (`src/teardown.test.ts`, with a level-triggered firing control). Mutations M7 and M8 |
| REG-4 | delegated | - | core row REG-4: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits. On React Native the teardown flush reaches the core through `setTeardownSignal` (REG-3), and the core sends it with `keepalive` |
| REG-5 | delegated | - | core row REG-5: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits. The departure signal only invokes the core's ordinary teardown flush, and fires once per departure, so an app switch that returns to the foreground adds no second flush (`src/teardown.test.ts`) |
| REG-6 | delegated | - | core row REG-6: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits |
| REG-7 | delegated | - | core row REG-7: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits |
| REG-8 | delegated | - | core row REG-8: implemented, contract · probe *REG-1..13* → 0 hits · firing control hits. The REG-3 contract test also observes backoff holding a refused send |
| REG-9 | delegated | - | core row REG-9: implemented, contract · probe *REG-1..13* → 0 hits · firing control hits |
| REG-10 | delegated | - | core row REG-10: partial · probe *REG-1..13* → 0 hits · firing control hits. Resolves with the core row |
| REG-11 | delegated | - | core row REG-11: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits |
| REG-12 | delegated | - | core row REG-12: implemented, n/a (pure) · probe *REG-1..13* → 0 hits, and probe *CAT-1..3* → 0 hits · firing controls hit |
| REG-13 | delegated | - | core row REG-13: implemented, n/a (pure) · probe *REG-1..13* → 0 hits · firing control hits |
| HINT-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | Every HINT rule begins at `window.location.href`, which React Native does not have. Live if this binding runs where a page URL exists, such as React Native for Web |
| HINT-2 | n/a (profile: server) | - | Profiles line: server |
| HINT-3 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL exists to capture at miss time |
| HINT-4 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-5 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-6 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL to normalise |
| HINT-7 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-8 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-9 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1. `autoDiscovery` is surfaced by reference (BIND-6) and is inert here |
| HINT-10 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL can carry a credential |
| HINT-11 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-12 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-13 | n/a (architecture: no DOM — spec Profiles carve-out) | - | A navigation re-entry records misses at the current URL, and React Native has none, so wiring React Navigation to `notifyNavigation()` would record nothing reportable. No router hook is wired and none is documented. Live under the same condition as HINT-1 |
| ICU-1 | delegated | - | core row ICU-1: implemented, n/a (pure) · probe *ICU-1..6: no interpolation or ICU recovery* → 0 hits · firing control hits on `new IntlMessageFormat(template, locale)`. Core evidence runs on Node's ICU, not Hermes (Gap 3) |
| ICU-2 | delegated | - | core row ICU-2: implemented, n/a (pure) · probe *ICU-1..6* → 0 hits · firing control hits |
| ICU-3 | delegated | - | core row ICU-3: implemented, n/a (pure) · probe *ICU-1..6* → 0 hits · firing control hits |
| ICU-4 | delegated | - | core row ICU-4: implemented, n/a (pure) · probe *ICU-1..6* → 0 hits, and probe *OBS-1* → 0 hits: no diagnostic is emitted or swallowed here · firing controls hit |
| ICU-5 | delegated | - | core row ICU-5: implemented, n/a (pure) · probe *ICU-1..6* → 0 hits · firing control hits |
| ICU-6 | delegated | - | core row ICU-6: implemented, n/a (pure) · probe *ICU-1..6* → 0 hits, and probe *OBS-1* → 0 hits: the formatter-failure warning is the core's · firing controls hit |
| CID-1 | delegated | - | core row CID-1: implemented, n/a (pure) · probe *CID-1..4: no content-block identity derivation* → 0 hits · firing control hits on `md5(JSON.stringify([category, tokens]))`. Text only: there is no `<Phrase>` or `<Translate>` here, so no id is derived from rendered content |
| CID-2 | delegated | - | core row CID-2: implemented, n/a (pure) · probe *CID-1..4* → 0 hits · firing control hits |
| CID-3 | delegated | - | core row CID-3: implemented, n/a (pure) · probe *CID-1..4* → 0 hits · firing control hits |
| CID-4 | delegated | - | core row CID-4: implemented, n/a (pure) · probe *CID-1..4* → 0 hits · firing control hits |
| TOK-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | Nothing to walk: no element tree exists and no DOM-walking component ships here. The identity half binds where text is handed over directly, and that derivation is the core's (CID rows). Live if a DOM-walking component is added |
| TOK-2 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| TOK-3 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1: no attributes to harvest |
| TOK-4 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| TOK-5 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| TOK-6 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1: no walk produces units, so no unit shape is decided here |
| MARK-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | No host element exists to stamp. `<DontTranslate>` renders a plain `<Text>` and carries no identity. Live if a stamping component is added |
| MARK-2 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As MARK-1: no marker is ever read |
| MARK-3 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As MARK-1: no content-block marker is ever read |
| MARK-4 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As MARK-1: no walk exists to excise from |
| SSR-1 | n/a (architecture: no server render) | - | React Native renders on the device only, so no server-side module instance ever collects. Live if this binding runs under a server render, such as Expo Router's static or server rendering for web |
| SSR-2 | n/a (architecture: no server render) | - | As SSR-1 |
| SSR-3 | n/a (architecture: no server render) | - | As SSR-1 |
| SRV-1 | n/a (architecture: no server render) | - | No render happens inside a server request scope. Live under the same condition as SSR-1 |
| SRV-2 | n/a (architecture: no server render) | - | As SRV-1 |
| SRV-3 | n/a (architecture: no server render) | - | As SRV-1 |
| SRV-4 | n/a (architecture: no server render) | - | As SRV-1. The core's half, the synchronous seed, is forwarded by reference as `LangsysApp.seedCatalog` (BIND-6). The binding's half, calling it before hydration, exists only where hydration does |
| SRV-5 | n/a (architecture: no server render) | - | As SRV-1 |
| SRV-6 | n/a (architecture: no server render) | - | As SRV-1: no request exists whose locale to resolve. The app's locale is the `UserLocaleStore` it passes to `init` |
| SRV-7 | n/a (architecture: no server render) | - | As SRV-1. The rule's binding half is wiring a framework that renders on a server into the core's request scope; this binding never renders on a server, so there is no framework request to wire. The core's half, the scope itself, is the core's row. Live under the same condition as SSR-1 |
| BIND-1 | implemented | n/a (pure) | `src/hooks.test.ts`, BIND-1 block (6 tests). `useT` returns the core's function by identity and follows it across a catalog change. `useCurrentLocale` returns the locale exactly as the core published it. The locale store passes `en-US`, `pt-BR` and `es-CR` through verbatim, leaving casing to the core, and keeps one identity across re-renders. Firing controls: a re-wrapped function is told apart, and every vector changes under `canonicalizeLocale`. The one lifecycle adaptation, the departure signal, is timing only (`src/teardown.test.ts`). Mutation M3 |
| BIND-2 | implemented | n/a (pure) | `src/hooks.test.ts`: "returns undefined, false and true exactly as the core holds them". Firing control: a hook that defaults `undefined` to `false` is told apart. Probe *BIND-2: no branches on server-computed capability or policy* → 0 hits, and its firing control hits. Mutations M2 and M6 |
| BIND-3 | implemented | n/a (pure) | Probe *BIND-3: no network behaviour: requests, headers, timers or scheduling* → 0 hits over the 4 pinned source files, and its firing control hits. The departure signal sends nothing itself: it calls the `fire` the core hands it. Mutation M5 |
| BIND-4 | implemented | n/a (pure) | `src/conformance-probes.test.ts`, BIND-4 block. `iLangsysInitConfig` declares exactly one member, `UserLocaleStore`, which narrows the core's `LocaleSource` to `Signal<string>`. Every core option, `legacyKeys` and `messagesCategory` included, is inherited unchanged. A compile-time assertion makes any added key a `tsc` error. Firing control: the member reader sees an added `discovery` option. Mutation M4 |
| BIND-5 | implemented | n/a (pure) | `src/hooks.test.ts`, BIND-5 block: a present-with-null phrase renders what the core renders, then the later translation replaces it. Firing control: a memoized lookup keeps the stale value. Probe *BIND-5: no caching or memoizing lookups* → 0 hits, and its firing control hits. Mutation M3 |
| BIND-6 | implemented | n/a (pure) | `src/surface.test.ts` (24 tests). `LangsysApp` is the core singleton itself. Every public core member is reachable, `loadSnapshot` included, with public classified by the core's `.d.ts`, scoped to `LangsysAppClass`. Destructuring keeps identity. Seventeen values are the core exports by reference: `t`, `currentlyLoadedLocale`, `sTranslations`, `createSignal`, `writeEnabled`, `autoDiscovery`, `setWriteGrant`, `setPersistStorage`, `canonicalizeLocale`, `LangsysAppAPI`, and the server-message set `renderServerMessage`, `resolveServerMessages`, `toServerMessage`, `fillTemplate`, `templateMarkers`, `DEFAULT_SERVER_MESSAGE_CATEGORY`, and `SnapshotError`. `setTeardownSignal` is the one core value this binding adapts, so it is not re-exported, and that absence is pinned beside a control. Firing control: a Proxy hiding `seedCatalog` is detected. Omitted by design: `Translate` and `Phrase`, which walk a DOM. Mutation M1 |
| GRANT-1 | delegated | - | core row GRANT-1: implemented, n/a (pure) · probe *GRANT-1..4: no grant resolution or transmission* → 0 hits · firing control hits on an `X-Write-Grant` header assignment. `writeGrant` is inherited from the core's config type, not declared here (BIND-4) |
| GRANT-2 | delegated | - | core row GRANT-2: implemented, n/a (pure) · probe *GRANT-1..4* → 0 hits · firing control hits |
| GRANT-3 | delegated | - | core row GRANT-3: implemented, n/a (pure) · probe *GRANT-1..4* → 0 hits · firing control hits. `setWriteGrant` is the core function by reference (BIND-6) |
| GRANT-4 | delegated | - | core row GRANT-4: implemented, n/a (pure) · probe *GRANT-1..4* → 0 hits · firing control hits |
| CACHE-1 | delegated | - | core row CACHE-1: implemented, n/a (pure) · probe *CACHE-1..2: no cache keys or storage access* → 0 hits · firing control hits on a `langsys:`-prefixed `setItem` key. `setPersistStorage` is forwarded by reference, so every key is built core-side |
| CACHE-2 | delegated | - | core row CACHE-2: implemented, contract · probe *CACHE-1..2* → 0 hits, and probe *BIND-3* → 0 hits: no failure window or timer is kept here · firing controls hit |
| OBS-1 | delegated | - | core row OBS-1: implemented, contract · probe *OBS-1: no diagnostics emitted here* → 0 hits · firing control hits on a `console.warn` |
| WIRE-1 | delegated | - | core row WIRE-1: implemented, n/a (pure) · probe *WIRE-1..5: no wire handling: auth header, API base, status parsing or identifier casing* → 0 hits · firing control hits on a 204 status check |
| WIRE-2 | delegated | - | core row WIRE-2: implemented, contract · probe *WIRE-1..5* → 0 hits · firing control hits |
| WIRE-3 | delegated | - | core row WIRE-3: implemented, contract · probe *WIRE-1..5* → 0 hits · firing control hits. The locale store passes `en-US` through verbatim, so casing is the core's alone (BIND-1) |
| WIRE-4 | delegated | - | core row WIRE-4: implemented, contract · probe *WIRE-1..5* → 0 hits · firing control hits. The REG-3 contract test runs a miss under React Native's globals, a refused send included, without a throw |
| WIRE-5 | delegated | - | core row WIRE-5: implemented, n/a (pure) · probe *WIRE-1..5* → 0 hits · firing control hits. For this package's integrators the README section "Configuration: pointing at another API" documents `apiUrl` and its ordering, and `iLangsysInitConfig` inherits `apiUrl` from the core's type. The REG-3 contract test reaches the fixture through it |
| CONF-1 | implemented | n/a (pure) | `src/conformance-probes.test.ts`, CONF-1 block: no test asserts on spies, mock calls or outgoing requests, across the 8 pinned test files. Firing control hits. The contract test reads only the double's accepted state. Mutation M10 |
| CONF-2 | implemented | n/a (pure) | This file. Every row carries a tier: `contract` for REG-3, whose evidence is the double's accepted state; `n/a (pure)` for in-process, vector and meta rows; `-` for delegated and `n/a` rows. The one absence asserted against the double, REG-3's control, is one the double would have accepted: a write key, with the refused send's fault already consumed |
| CONF-3 | implemented | n/a (pure) | Mutation evidence, below: sixteen mutations run in a disposable git worktree, each reddening named assertions |
| MSG-1 | delegated | - | core row MSG-1: implemented, n/a (pure) · probe *MSG-1..6: no server-message resolution or rendering* → 0 hits · firing control hits on `t(entry.template, 'Errors', entry.params ?? {})`. `resolveServerMessages` is the core function by reference (BIND-6), and it reads entries only where the app configures: a `key`, or a `resolver`, with `pieces` for renamed fields. Through this binding (`src/server-messages.test.ts`): all ten resolve vectors resolve as expected and leave the framework's body unchanged; and the spec's own check, the same canonical entries attached beside a Laravel and a FastAPI native error body, resolved by key and rendered through `useServerMessage`, come out identical, with the framework's `errors` untouched. Mutation M12 |
| MSG-2 | delegated | - | core row MSG-2: implemented, n/a (pure) · probe *MSG-1..6* → 0 hits · firing control hits. An entry's `code` is the framework's own and passes through untouched; nothing here reads it, and the render vector `code-does-not-choose-text` shows it does not choose the text through the hook |
| MSG-3 | n/a (profile: server) | - | Profiles line: server |
| MSG-4 | n/a (profile: server) | - | Profiles line: server |
| MSG-5 | implemented | n/a (pure) | The decision is the core's (core row MSG-5: implemented, n/a (pure)): `renderServerMessage`, re-exported by reference, renders the template through `t()` when the catalog holds it and the entry's `message` otherwise. The binding's half is `useServerMessage`, which subscribes the component and returns that result. `src/server-messages.test.ts`: all twelve render vectors of the vendored file (blob pinned) render through the hook, including an entry with no template, which shows its `message`, in a real React tree, equal to the expected text and to the core's own answer; the hook follows the catalog from the entry's message to the translation once it arrives. Firing control: a render that does not subscribe keeps the stale message. Probe *MSG-1..6* → 0 hits, so no fallback is decided here. Mutations M11 and M12 |
| MSG-6 | delegated | - | core row MSG-6: implemented, n/a (pure) · probe *MSG-1..6* → 0 hits · firing control hits. `messagesCategory` is inherited from the core's config type, not declared here (BIND-4), and `useServerMessage` passes the category through untouched |
| MSG-7 | n/a (profile: server) | - | Profiles line: server |
| MSG-8 | n/a (profile: server) | - | Profiles line: server |
| MSG-9 | n/a (profile: server) | - | Profiles line: server |
| MSG-10 | n/a (profile: server) | - | Profiles line: server |
| MSG-11 | n/a (profile: server) | - | Profiles line: server |
| MSG-12 | n/a (architecture: no server render — no framework redirect hands entries to a page) | - | The binding clause covers a server framework's redirect after a failed form. Nothing here runs on a server; entries reach a React Native app in its own API responses |
| MIG-1 | delegated | - | core row MIG-1: implemented, n/a (pure) · probe *MIG-1..8: no legacy-key lookup or conversion* → 0 hits · firing control hits on a legacy-file key lookup. This binding's `init` passes `legacyKeys` through untouched: `src/legacy-keys.test.ts`, against the contract fixture, inits with a bundled `en.json` and renders `checkout.submit` as the translation of its value through `useT()`, which is possible only if the file arrived. Mutation M13 |
| MIG-2 | delegated | - | core row MIG-2: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. `t()` is the core function by reference, so the mode's lookup runs there. |
| MIG-3 | delegated | - | core row MIG-3: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. |
| MIG-4 | delegated | - | core row MIG-4: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. |
| MIG-5 | delegated | - | core row MIG-5: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. Through this binding, a new key's value is accepted by the double under the key's namespace, and the key string never is (`src/legacy-keys.test.ts`) |
| MIG-6 | delegated | - | core row MIG-6: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. |
| MIG-7 | delegated | - | core row MIG-7: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. |
| MIG-8 | delegated | - | core row MIG-8: implemented, n/a (pure) · probe *MIG-1..8* → 0 hits · firing control hits. |
| MIG-9 | n/a (profile: server) | - | Profiles line: server |
| SNAP-1 | n/a (profile: server) | - | Profiles line: server |
| SNAP-2 | delegated | - | core row SNAP-2: implemented, n/a (pure) · probe *SNAP-2..3: no snapshot parsing, verification or loading* → 0 hits · firing control hits on a `JSON.parse` of a bundle. The React Native case is a snapshot bundled with the app: `LangsysApp.loadSnapshot` is the core method by reference (BIND-6). `src/snapshot.test.ts`: loaded before `init()`, it renders through `useT()` with nothing awaited, while a render that does not subscribe keeps the source text; a phrase it lacks shows source text, then the fetched translation once `init()` runs against the contract fixture; a locale it does not hold returns `false`. Mutation M14 |
| SNAP-3 | delegated | - | core row SNAP-3: implemented, n/a (pure) · probe *SNAP-2..3* → 0 hits · firing control hits. Through this binding, an edited snapshot throws the core's `SnapshotError` (the same class, re-exported by reference) with reason `checksum` and leaves the catalog untouched; after `init()`, the catalog rather than the snapshot answers (`src/snapshot.test.ts`). The README's refresh path is re-export. Mutation M14 |

## Mutation evidence

Each runtime claim above is proven by breaking it and watching named assertions fail (CONF-3). The
mutations run in a disposable git worktree carrying this tree, never in the working copy. Each
mutation asserts that its edit applied exactly once before running, and the worktree's baseline is
118 passed with typecheck clean.

| Mutation | Target | Assertions that went red |
|---|---|---|
| M1: `src/index.ts` replaced by the wrapper class that listed core methods one by one | BIND-6 | 13 of 24 in `surface.test.ts`: "is the core singleton itself"; "reaches every public core member, including the two the old wrapper never listed"; "survives destructuring — nothing is re-bound"; and "… is the core export itself" for `writeEnabled`, `autoDiscovery`, `setWriteGrant` the seven server-message exports and `SnapshotError` |
| M2: `useWriteEnabled` returns `useSignal(writeEnabled) ?? false` | BIND-2 | "returns undefined, false and true exactly as the core holds them" |
| M3: `useT` memoizes the function with `useMemo(() => t, [])` | BIND-1, BIND-5 | "useT returns the core's translation function itself, and follows it across a catalog change"; probe "BIND-5: no caching or memoizing lookups > absent from this binding". The BIND-5 render test stays green here, correctly: the core's function reads fresh state on every call, so memoizing the *function* loses no lookup; memoizing the *result* does, and the render test's firing control shows it catches that |
| M4: `discovery?: boolean` added to `iLangsysInitConfig` | BIND-4 | `tsc` TS2322 at the compile-time assertion; "declares exactly one member, and it narrows a key the core already has" |
| M5: a hook calling `setTimeout` appended to `hooks.ts` | BIND-3 | probe "BIND-3: no network behaviour: requests, headers, timers or scheduling > absent from this binding" |
| M6: a hook returning `writeEnabled.get() === true` appended to `hooks.ts` | BIND-2, GATE | probes "BIND-2: no branches on server-computed capability or policy" and "GATE-1..9: no capability decisions" |
| M7: `src/teardown.ts` no longer passes its subscription to `setTeardownSignal` | REG-3 | "a phrase held by backoff lands when the app leaves the foreground" (contract); "loading the package installs exactly one listener" |
| M8: the departure signal fires on every change that is not `active` | REG-3, REG-5 | "fires once per departure from active, however many states the exit passes through"; "does not fire for an app that has not been active" |
| M9: a function returning `entry.template` appended to `hooks.ts` | MSG | probe "MSG-1..6: no server-message resolution or rendering > absent from this binding" |
| M10: a `vi.fn()` call assertion added to `hooks.test.ts` | CONF-1 | "no test asserts on spies, mock calls or outgoing requests" |
| M11: `useServerMessage` no longer calls `useT()` | MSG-5 | "follows the catalog: the entry's message, then the translation once it arrives" |
| M12: `useServerMessage` returns `entry.message` itself | MSG-1, MSG-5 | six render vectors ("laravel-translation-with-param", "laravel-translation-no-params", "pydantic-translation", "icu-plural-translation-count-one", "icu-plural-translation-count-many", "code-does-not-choose-text"); "the same entries render identically beside two frameworks' native bodies"; "follows the catalog …"; probe "MSG-1..6: no server-message resolution or rendering > absent from this binding" |
| M13: `LangsysApp` replaced by an object whose `init` drops `legacyKeys` before calling the core | MIG passthrough | "a key renders the translation of its source value, through useT()"; "a new key registers its value under the key's namespace, never the key"; "is the core singleton itself" |
| M14: `LangsysApp` replaced by an object whose `loadSnapshot` returns `false` | SNAP-2, SNAP-3 | "renders through useT() as soon as it loads, before init, with nothing awaited"; "throws the core's SnapshotError with reason checksum, and the catalog is untouched"; "is the core singleton itself"; "reaches every public core member …" |
| M15: a function that `JSON.parse`s a bundle and reads its catalog appended to `hooks.ts` | SNAP | probe "SNAP-2..3: no snapshot parsing, verification or loading > absent from this binding" |
| M16: `node_modules/langsys-js-typescript` resolved to the published 0.6.5 tarball | release | `tsc` TS2305 ×22 in `src`: every 838 name the binding imports, from `writeEnabled` and `setTeardownSignal` to the server-message exports; "carries every 838 name this binding imports or forwards". Its positive control, the pre-838 baseline, stays green |

## Probes

The absence probes live in `src/conformance-probes.test.ts` and run in the suite.

- **Files:** `src/**/*.ts` excluding tests, pinned to `components/DontTranslate.ts`, `hooks.ts`,
  `index.ts` and `teardown.ts`. Adding source fails the suite until the probes are re-read against it.
- **Comments are stripped before matching; code and line numbers are kept.** Every absent
  behaviour is discussed in a comment somewhere, and an unstripped probe reports participation
  that does not exist.
- **Shared controls:** known code is still found after stripping (1 `useSyncExternalStore(` call,
  at least 4 imports from the core), and a construct that appears only in comments is not a hit.
- **Firing control per probe:** the same pattern, run over a snippet containing the construct,
  must hit. A pattern that could never match would otherwise report the same zero as a clean
  binding.

## Gaps, ranked by cost

1. **The dependency range installs a core without the 838 surface.** `^0.6.5` resolves to the
   published 0.6.5, against which a fresh clone fails `tsc` (TS2305 ×22) and the upstream
   precondition test. It blocks installability, not behaviour, and belongs to the release wave:
   the range must name the core version that ships this surface.
2. **One delegated row waits on the core: REG-10**, partial there pending an API decision. It is the
   last row between this file and green.
3. **ICU on Hermes is not exercised.** The delegated ICU rows rest on core evidence produced under
   Node's full ICU. Hermes's `Intl` coverage varies by React Native version and build flags, and
   nothing here runs on Hermes.
4. **The departure send is dispatched, not guaranteed.** React Native's `fetch` has no
   `keepalive`, so whether the last request completes depends on how long the OS lets the app run
   after it leaves the foreground. The contract test proves the send is made at departure, under
   Node; delivery on a device is not exercised.
5. **No discovery reporting from apps.** A read-only key on React Native registers nothing and
   reports nothing (the HINT carve-out). A product limit rather than a conformance defect, and the
   README documents it.

## Reproducing this file's evidence

```bash
# the spec text this file was checked against
git -C ~/Documents/dev/langsys2 ls-tree aac52142 docs/sdk-spec.mdx     # blob 5f01ef7d…

# a clean build of the core under test, linked in place of the sibling working copy
git -C ~/Documents/dev/langsys-js-typescript worktree add --detach /tmp/core fbbb6a93
(cd /tmp/core && npm ci && npm run build)
ln -sfn /tmp/core node_modules/langsys-js-typescript

# the vendored fixture is byte-exact
git add contract-fixture && git write-tree --prefix=contract-fixture/   # 542f57f5…
git hash-object vectors/server-message-vectors.json                      # 7333e391…

# suite, types, lint, build
npm run typecheck && npm test && npm run lint && npm run build

# restore the sibling link
ln -sfn ../../langsys-js-typescript node_modules/langsys-js-typescript
```
