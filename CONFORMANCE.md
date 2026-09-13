# Conformance — `langsys-js-react-native`

| | |
|---|---|
| **Spec revision read** | langsys2 5cff03a1…, docs/sdk-spec.mdx blob 5c5c0723f88fb8e6b13f58876c7adca8b6b35691 |
| **Profiles** | browser, binding, all — derived: binding over langsys-js-typescript |
| **specVersion** | 8.0.1, the unpublished correction to v8. The blob was re-derived at this write with `git -C ~/Documents/dev/langsys2 ls-tree 5cff03a1 docs/sdk-spec.mdx` rather than carried from the dispatch, and the 79 rule ids below were enumerated from that blob |
| **SDK** | `langsys-js-react-native` 0.1.0 — React Native binding, hooks-first, experimental |
| **SDK revision** | `feature/838_write_key_gating`, cut from `main` `785f1a0` |
| **Core consumed** | `langsys-js-typescript` `feature/838_write_key_gating_reland` @ `f58e0c4` (pushed), through a gitignored `node_modules` symlink. This is **not** the published 0.6.5, which carries none of the 838 surface (Gap 2). The core's `dist` was built after that commit, and its `src` has no uncommitted diff. Core rows cited below come from its `CONFORMANCE.md`, blob `bc888983620e3752ade33c06145d827856e4ca32` at that commit |
| **Suite** | 63 tests in 5 files, `npm test`, all passing. That is 62 tests plus one `it.fails` that pins the REG-3 gap and goes red when the gap closes. Counted from vitest's JSON report at this tip, not by hand |
| **Tally** | implemented 9 · delegated 40 · not implemented 1 · n/a (architecture) 28 · n/a (profile: server) 1 — 79 rows, each id graded once |

**What surfaced while writing this.** Five things, each found by running code rather than by reading it:

1. **REG-3 is unmet on React Native, and this binding cannot meet it alone.** The core installs its
   teardown flush only where `document` exists. React Native defines `window` and not `document`, so
   a registration still queued when the app is killed is lost — worst under REG-8 backoff, where the
   queue can wait minutes. The browser-shaped control flushes the same queued miss on `pagehide`;
   the React Native shape sends nothing. The core has no public flush to wire `AppState` to. A core
   seam is proposed and pending the core operator's approval.
2. **The old wrapper class had silently stopped tracking the core.** It listed core methods one by
   one, and `seedCatalog` and `setWriteGrant` were never added, so neither was reachable here.
   `LangsysApp` is now the core singleton by reference. Restoring the wrapper (mutation M1) reddens
   six rows.
3. **The README's version floor was false against the published artifact.** It said "`≥ 0.4.2`,
   the release that added `setPersistStorage`". Neither the published 0.4.2 tarball nor 0.6.5
   contains `setPersistStorage` in any `dist` file, while the controls `canonicalizeLocale` and
   `getCountries` are each found in 6. The floor was written from a working copy.
4. **A fresh clone does not typecheck.** `^0.6.5` resolves to the published 0.6.5, and against it
   `tsc` reports TS2305 seven times in `src` (mutation M9). The suite passes only through the
   symlinked 838 core.
5. **The README claimed token discovery works "exactly like the web SDKs".** Registration from a
   write-enabled session does. The report lane cannot: every HINT rule starts at a page URL, and an
   app has none, so a read-only key on React Native discovers nothing. The README now says so.

The core's HEAD also moved from `4eac870` to `f58e0c4` while this file was being prepared. Every
provenance value above was re-derived at the later commit.

## Scope

This is a **binding**. It inherits the browser core's profile and adds no behaviour of its own, so
three kinds of row appear:

- **`implemented`** — the six binding rules and the three conformance meta-rules. All are
  in-process properties with no server involved, so their tier is `n/a (pure)`.
- **`delegated`** — families the core owns. Each row names the core's own row, plus an absence probe
  proving this binding does not participate, plus that probe's firing control. Tier is `-`: the
  evidence for the behaviour lives in the core, not here.
- **`n/a (architecture: …)`** — rules the React Native execution model cannot reach, per the spec's
  Profiles carve-out (no DOM, so no HINT, TOK or MARK) or because nothing here renders on a server
  (no SSR, no SRV). Each names what would make it live. Tier is `-`.

## Status

| Rule | Status | Tier | Evidence |
|---|---|---|---|
| GATE-1 | delegated | - | core row GATE-1: provisional, mock · probe *GATE-1..8: no capability decisions* → 0 hits in the 3 pinned source files · firing control hits on `if (auth.key_type === 'write')` |
| GATE-2 | delegated | - | core row GATE-2: provisional, mock · probe *GATE-1..8* → 0 hits · firing control hits. Binding half: `useWriteEnabled` holds `undefined` rather than defaulting it (BIND-2) |
| GATE-3 | delegated | - | core row GATE-3: provisional (no test) · probe *GATE-1..8* → 0 hits · firing control hits. Higher stakes on React Native, where injected storage is durable — Gap 3 |
| GATE-4 | delegated | - | core row GATE-4: provisional (no test) · probe *GATE-1..8* → 0 hits · firing control hits. No response is cached here (probe *CACHE-1* → 0) |
| GATE-5 | delegated | - | core row GATE-5: provisional, mock · probe *GATE-1..8* → 0 hits, and probe *REG-1..12* → 0 hits: no bookkeeping exists here · firing controls hit |
| GATE-6 | delegated | - | core row GATE-6: provisional, mock · probe *GATE-1..8* → 0 hits · firing control hits. The report lane is unreachable on React Native (HINT rows) |
| GATE-7 | delegated | - | core row GATE-7: provisional, mock · probe *GATE-1..8* → 0 hits · firing control hits. The only detecting path here is `t()`, and it is the core function by reference (BIND-6) |
| GATE-8 | delegated | - | core row GATE-8: implemented, mock · probe *GATE-1..8* → 0 hits · firing control hits |
| CAT-1 | delegated | - | core row CAT-1: implemented, n/a (pure) · probe *CAT-1..3: no catalog reads or presence tests* → 0 hits · firing control hits on a `hasOwnProperty` presence test |
| CAT-2 | delegated | - | core row CAT-2: implemented, n/a (pure) · probe *CAT-1..3* → 0 hits · firing control hits. Binding half: a present-with-null phrase renders exactly what the core renders (BIND-5) |
| CAT-3 | delegated | - | core row CAT-3: provisional (no test) · probe *CAT-1..3* → 0 hits · firing control hits |
| REG-1 | delegated | - | core row REG-1: provisional, mock · probe *REG-1..12: no registration: queueing, batching, sending or backoff* → 0 hits · firing control hits on `api.createTranslatableItems(batch, { keepalive: true })` |
| REG-2 | delegated | - | core row REG-2: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits. The ~400ms debounce runs core-side on React Native too, since `window` is defined there |
| REG-3 | not implemented | - | Measured gap. `src/rn-teardown.test.ts` runs `_dev_/rn-teardown-probe.mjs` once per shape, one process each. Browser-shaped control: a miss held under backoff is flushed on `pagehide` with `keepalive`. React Native shape (`window` is the global, no `document`): no teardown flush is installed, the core listens for nothing, the miss stays queued and 0 sends happen. The core's four flush-named members are all `private`. Pinned with `it.fails`; mutation M7 turns it red. Needs a core seam — Gap 1 |
| REG-4 | n/a (architecture: no teardown flush reaches React Native — the core installs its visibilitychange and pagehide listeners only where document exists; live once the REG-3 AppState flush lands, which must then send with keepalive) | - | Measured by the REG-3 probe: in the React Native shape the core listened for no event. Expires with Gap 1 |
| REG-5 | n/a (architecture: no teardown flush reaches React Native; live once the REG-3 AppState flush lands — AppState also leaves active on a plain app switch, so that flush must reuse the ordinary path) | - | Measured by the REG-3 probe, as REG-4. The seam under review routes the AppState event into the core's existing ordinary-path teardown flush. Expires with Gap 1 |
| REG-6 | delegated | - | core row REG-6: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-7 | delegated | - | core row REG-7: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-8 | delegated | - | core row REG-8: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-9 | delegated | - | core row REG-9: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-10 | delegated | - | core row REG-10: provisional, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-11 | delegated | - | core row REG-11: implemented, mock · probe *REG-1..12* → 0 hits · firing control hits |
| REG-12 | delegated | - | core row REG-12: provisional (no test) · probe *REG-1..12* → 0 hits, and probe *CAT-1..3* → 0 hits · firing controls hit |
| HINT-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | Every HINT rule begins at `window.location.href`, which React Native does not have. Live if this binding runs where a page URL exists, such as React Native for Web |
| HINT-2 | n/a (profile: server) | - | Profiles line: server. Expires if that line changes |
| HINT-3 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL exists to capture at miss time |
| HINT-4 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-5 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-6 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL to normalise |
| HINT-7 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-8 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-9 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1. `autoDiscovery` is still surfaced by reference (BIND-6) and is inert here |
| HINT-10 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1: no URL can carry a credential |
| HINT-11 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| HINT-12 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As HINT-1 |
| ICU-1 | delegated | - | core row ICU-1: corroborated (cross-implementation), contract (shared fixture) · probe *ICU-1..5: no interpolation or ICU recovery* → 0 hits · firing control hits on `new IntlMessageFormat(template, locale)`. Core evidence runs on Node's ICU, not Hermes — Gap 4 |
| ICU-2 | delegated | - | core row ICU-2: corroborated (cross-implementation), contract (shared fixture) · probe *ICU-1..5* → 0 hits · firing control hits |
| ICU-3 | delegated | - | core row ICU-3: corroborated (cross-implementation), contract (shared fixture) · probe *ICU-1..5* → 0 hits · firing control hits |
| ICU-4 | delegated | - | core row ICU-4: implemented, n/a (pure) · probe *ICU-1..5* → 0 hits, and probe *OBS-1* → 0 hits: no diagnostic is emitted or swallowed here · firing controls hit |
| ICU-5 | delegated | - | core row ICU-5: corroborated (cross-implementation), contract (shared fixture) · probe *ICU-1..5* → 0 hits · firing control hits |
| CID-1 | delegated | - | core row CID-1: corroborated (cross-implementation), contract (shared fixture) · probe *CID-1..4: no content-block identity derivation* → 0 hits · firing control hits on `md5(JSON.stringify([category, tokens]))`. Text only: there is no `<Phrase>` or `<Translate>` here, so no id is derived from rendered content either |
| CID-2 | delegated | - | core row CID-2: implemented, n/a (pure) · probe *CID-1..4* → 0 hits · firing control hits |
| CID-3 | delegated | - | core row CID-3: implemented, mock · probe *CID-1..4* → 0 hits · firing control hits |
| CID-4 | delegated | - | core row CID-4: corroborated (cross-implementation), contract (shared fixture) · probe *CID-1..4* → 0 hits · firing control hits |
| TOK-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | Nothing to walk: no element tree exists, and no DOM-walking component ships here. Live if one is added. The identity half binds where text is handed over directly, and that derivation is the core's (CID rows) |
| TOK-2 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| TOK-3 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1: no attributes to harvest |
| TOK-4 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| TOK-5 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As TOK-1 |
| MARK-1 | n/a (architecture: no DOM — spec Profiles carve-out) | - | No host element exists to stamp. `<DontTranslate>` renders a plain `<Text>` and carries no identity. Live if a stamping component is added |
| MARK-2 | n/a (architecture: no DOM — spec Profiles carve-out) | - | As MARK-1: no stamp is ever read |
| SSR-1 | n/a (architecture: no server render) | - | React Native renders on the device only, so no server-side module instance ever collects. Live if this binding runs under a server render, such as Expo Router's static or server rendering for web |
| SSR-2 | n/a (architecture: no server render) | - | As SSR-1 |
| SSR-3 | n/a (architecture: no server render) | - | As SSR-1 |
| SRV-1 | n/a (architecture: no server render) | - | No render happens inside a server request scope. Live under the same condition as SSR-1 |
| SRV-2 | n/a (architecture: no server render) | - | As SRV-1 |
| SRV-3 | n/a (architecture: no server render) | - | As SRV-1 |
| SRV-4 | n/a (architecture: no server render) | - | As SRV-1. The core's half, the synchronous seed, is forwarded by reference as `LangsysApp.seedCatalog` (BIND-6). The binding's half, calling it before hydration, exists only where hydration does |
| SRV-5 | n/a (architecture: no server render) | - | As SRV-1 |
| BIND-1 | implemented | n/a (pure) | `src/hooks.test.ts`, BIND-1 block (6 tests). `useT` returns the core's function by identity and follows it across a catalog change. `useCurrentLocale` returns the locale exactly as the core published it. The locale store passes `en-US`, `pt-BR` and `es-CR` through verbatim, leaving casing to the core, and keeps one identity across re-renders. Firing controls: a re-wrapped function is told apart, and every vector changes under `canonicalizeLocale`. Mutation M3 reddens it. Unlike the web React binding, nothing about when a value may be read is adapted, because React Native has no hydration pass |
| BIND-2 | implemented | n/a (pure) | `src/hooks.test.ts`: "returns undefined, false and true exactly as the core holds them". Firing control: a hook that defaults `undefined` to `false` is told apart. Probe *BIND-2: no branches on server-computed capability or policy* → 0 hits, and its firing control hits. Mutations M2 and M6 redden it |
| BIND-3 | implemented | n/a (pure) | Probe *BIND-3: no network behaviour: requests, headers, timers or scheduling* → 0 hits over the 3 pinned source files, and its firing control hits. Mutation M5, a timer in `hooks.ts`, reddens it |
| BIND-4 | implemented | n/a (pure) | `src/conformance-probes.test.ts`, BIND-4 block. `iLangsysInitConfig` declares exactly one member, `UserLocaleStore`, which narrows the core's `LocaleSource` to `Signal<string>`. A compile-time assertion makes any added key a `tsc` error. Firing control: the member reader sees an added `discovery` option. Mutation M4 fails both `tsc` (TS2322) and the member test |
| BIND-5 | implemented | n/a (pure) | `src/hooks.test.ts`, BIND-5 block: a present-with-null phrase renders what the core renders, then the later translation replaces it. Firing control: a memoized lookup keeps the stale value. Probe *BIND-5: no caching or memoizing lookups* → 0 hits, and its firing control hits. Mutation M3 reddens the probe |
| BIND-6 | implemented | n/a (pure) | `src/surface.test.ts` (15 tests). `LangsysApp` is the core singleton itself. Every public core member is reachable, including `seedCatalog` and `setWriteGrant`; public is classified by the core's `.d.ts`, scoped to `LangsysAppClass`. Destructuring keeps identity. Ten values are the core exports by reference: `t`, `currentlyLoadedLocale`, `sTranslations`, `createSignal`, `writeEnabled`, `autoDiscovery`, `setWriteGrant`, `setPersistStorage`, `canonicalizeLocale`, `LangsysAppAPI`. Firing control: a Proxy hiding `seedCatalog` is detected. Mutation M1, the pre-838 wrapper class, reddens 6 rows. Omitted by design: `Translate` and `Phrase`, which walk a DOM (Profiles carve-out) |
| GRANT-1 | delegated | - | core row GRANT-1: implemented, mock · probe *GRANT-1..4: no grant resolution or transmission* → 0 hits · firing control hits on an `X-Write-Grant` header assignment. `writeGrant` is inherited from the core's config type, not declared here (BIND-4) |
| GRANT-2 | delegated | - | core row GRANT-2: implemented, mock · probe *GRANT-1..4* → 0 hits · firing control hits |
| GRANT-3 | delegated | - | core row GRANT-3: implemented, mock · probe *GRANT-1..4* → 0 hits · firing control hits. `setWriteGrant` is the core function by reference (BIND-6), so this binding cannot narrow re-authorization into mere configuration |
| GRANT-4 | delegated | - | core row GRANT-4: implemented, mock · probe *GRANT-1..4* → 0 hits · firing control hits |
| CACHE-1 | delegated | - | core row CACHE-1: implemented, mock · probe *CACHE-1: no cache keys or storage access* → 0 hits · firing control hits on a `langsys:`-prefixed `setItem` key. `setPersistStorage` is forwarded by reference, so every key is built core-side |
| OBS-1 | delegated | - | core row OBS-1: implemented, mock · probe *OBS-1: no diagnostics emitted here* → 0 hits · firing control hits on a `console.warn` |
| WIRE-1 | delegated | - | core row WIRE-1: provisional, mock · probe *WIRE-1..5: no wire handling: auth header, API base, status parsing or identifier casing* → 0 hits · firing control hits on a 204 status check |
| WIRE-2 | delegated | - | core row WIRE-2: provisional, mock · probe *WIRE-1..5* → 0 hits · firing control hits |
| WIRE-3 | delegated | - | core row WIRE-3: implemented, n/a (pure) · probe *WIRE-1..5* → 0 hits · firing control hits. The locale store passes `en-US` through verbatim, so casing is the core's alone (BIND-1) |
| WIRE-4 | delegated | - | core row WIRE-4: provisional (no test) · probe *WIRE-1..5* → 0 hits · firing control hits. On React Native specifically, the REG-3 probe's miss did not throw (`threw: null`) |
| WIRE-5 | delegated | - | core row WIRE-5: implemented, mock · probe *WIRE-1..5* → 0 hits · firing control hits. The documentation half for this package's integrators is covered too: the README section "Configuration: pointing at another API" documents `apiUrl` and the ordering trap, and `iLangsysInitConfig` inherits `apiUrl` from the core's type |
| CONF-1 | implemented | n/a (pure) | `src/conformance-probes.test.ts`, CONF-1 block: no test asserts on spies, mock calls or outgoing requests, across the 4 pinned test files. Firing control hits; mutation M8 reddens it. Every `implemented` row here rests on in-process identity or value evidence. The one interception in the repo, `_dev_/rn-teardown-probe.mjs`, measures the REG-3 gap and claims nothing. On every path: `LangsysApp.t` and `useT` both resolve to the core function (BIND-6, BIND-1) |
| CONF-2 | implemented | n/a (pure) | This file. Every row carries a tier per the dispatch's tier addendum: `n/a (pure)` for in-process and meta rows, `-` for delegated and architecture rows |
| CONF-3 | implemented | n/a (pure) | Mutation evidence, below: nine mutations, each reddening named assertions, then restored and the suite re-verified |

## Mutation evidence

Every runtime claim above was proven by breaking it and watching named assertions fail (CONF-3).
Each mutation script asserts that its edit applied exactly once before running, because a mutation
that silently failed to apply reads as green. Afterwards the tree was restored, byte-compared against
backups, and the full suite re-run: 62 passed plus 1 expected failure, typecheck clean.

| Mutation | Target | Assertions that went red |
|---|---|---|
| M1: `src/index.ts` restored to the pre-838 wrapper class from `785f1a0` | BIND-6 | 6 of 15 in `surface.test.ts`: "is the core singleton itself"; "reaches every public core member, including the two the old wrapper never listed"; "survives destructuring — nothing is re-bound"; "writeEnabled / autoDiscovery / setWriteGrant is the core export itself" |
| M2: `useWriteEnabled` returns `useSignal(writeEnabled) ?? false` | BIND-2 | "returns undefined, false and true exactly as the core holds them" |
| M3: `useT` memoizes the function with `useMemo(() => t, [])` | BIND-1, BIND-5 | "useT returns the core's translation function itself, and follows it across a catalog change"; probe "BIND-5: no caching or memoizing lookups > absent from this binding". The BIND-5 render test stays green here, correctly: the core's function reads fresh state on every call, so memoizing the *function* loses no lookup. Memoizing the *result* does, and that is what the render test's firing control proves it catches |
| M4: `discovery?: boolean` added to `iLangsysInitConfig` | BIND-4 | `tsc` TS2322 at the compile-time assertion; "declares exactly one member, and it narrows a key the core already has" |
| M5: a hook calling `setTimeout` appended to `hooks.ts` | BIND-3 | probe "BIND-3: no network behaviour: requests, headers, timers or scheduling > absent from this binding" |
| M6: a hook returning `writeEnabled.get() === true` appended to `hooks.ts` | BIND-2, GATE | probes "BIND-2: no branches on server-computed capability or policy" and "GATE-1..8: no capability decisions" |
| M7: the React Native probe calls the core's private `flushOnTeardown`, standing in for the missing seam | REG-3 pin | "React Native flushes the queue before its execution context ends", the `it.fails` row, went red — so the pin is live |
| M8: a `vi.fn()` call assertion added to `hooks.test.ts` | CONF-1 | "no test asserts on spies, mock calls or outgoing requests" |
| M9: `node_modules/langsys-js-typescript` pointed at the published 0.6.5 tarball | release wave | `tsc` TS2305 ×7 in `src` (`writeEnabled` in `hooks.ts`; `PersistStorage`, `WriteGrant`, `autoDiscovery`, `writeEnabled`, `setWriteGrant`, `setPersistStorage` in `index.ts`); "carries every 838 name this binding imports or forwards". The positive control, the pre-838 baseline, stayed green, so the failure is the missing surface rather than a package that did not load |

## Probes

The absence probes live in `src/conformance-probes.test.ts`, so they run in the suite rather than
in a script someone has to remember. What they read:

- **Files:** `src/**/*.ts` excluding tests. The list is pinned to `components/DontTranslate.ts`,
  `hooks.ts` and `index.ts`, so adding source fails the suite until the probes are re-read
  against it.
- **Comments are stripped before matching; code and line numbers are kept.** Every absent
  behaviour is *discussed* in a comment somewhere, and an unstripped probe reports participation
  that does not exist.
- **Controls shared by every probe:** known code is still found after stripping (1
  `useSyncExternalStore(` call, at least 4 imports from the core), and a construct that appears
  only in comments is not a hit.
- **Firing control per probe:** the same pattern, run over a snippet containing the construct, must
  hit. A pattern that could never match would otherwise report the same zero as a clean binding.

## Gaps, ranked by cost

1. **REG-3 — registrations still queued when the app is killed are lost.** Silent data loss on the
   one path discovery depends on, worst under REG-8 backoff. It needs a core seam this binding
   cannot supply: the proposal on mesh topic `rn-teardown-flush-seam` is an injectable teardown
   signal in the `setPersistStorage` style. The binding would adapt only the `AppState` transition
   out of `active`, edge-triggered so iOS's active → inactive → background fires once, and the send
   stays on the core's ordinary path. The proposal awaits the core operator's approval. When it
   lands, REG-3, REG-4 and REG-5 are re-graded together, the `it.fails` pin flips, and
   `"sideEffects": false` in `package.json` must change, or a bundler may drop the install.
2. **Release wave — the dependency range names a core that does not carry the 838 surface.**
   `^0.6.5` installs the published 0.6.5, against which a fresh clone fails `tsc` (TS2305 ×7) and the
   upstream precondition test. This blocks installability, not behaviour, and is owned by the release
   wave: the range must name the core version that actually ships.
3. **GATE-3 carries higher stakes on React Native, and the core row has no test.** This package's
   README steers integrators to durable storage (MMKV through `setPersistStorage`), which outlives
   the page session GATE-3 bounds. The core's code keeps `writeEnabled` out of `persist()`, but its
   row is `provisional (no test)`. On this platform, the evidence that matters is a test that the
   write decision never reaches injected storage.
4. **ICU on Hermes is not exercised.** The delegated ICU rows rest on core evidence produced under
   Node's full ICU. Hermes's `Intl` coverage varies by React Native version and build flags, and
   nothing here runs on Hermes.
5. **No discovery reporting from apps.** A read-only key on React Native registers nothing and
   reports nothing (the HINT carve-out). That is a product limit rather than a conformance defect,
   and the README documents it.

## Corrections

- **README version floor.** "Requires `langsys-js-typescript` ≥ 0.4.2 (the release that added
  `setPersistStorage`…)" was false: published 0.4.2 and 0.6.5 have `setPersistStorage` in 0 `dist`
  files each, while their controls are found in 6. Replaced with a statement that no published
  version carries the required surface yet.
- **README discovery claim.** "Token discovery (write keys) all behave exactly like the web SDKs" is
  replaced by registration-from-write-enabled-sessions plus a Known limitations section covering the
  REG-3 gap and the absent report lane.
- **Entry point.** The wrapper class is replaced by a by-reference export of the core singleton,
  closing the `seedCatalog` and `setWriteGrant` omission that the one-by-one list had hidden.

## Reproducing this file's evidence

```bash
# the spec text this file was checked against
git -C ~/Documents/dev/langsys2 ls-tree 5cff03a1 docs/sdk-spec.mdx     # blob 5c5c0723…
git -C ~/Documents/dev/langsys2 show 5cff03a1:docs/sdk-spec.mdx

# the core actually under test (a symlink, not the registry)
readlink node_modules/langsys-js-typescript                            # ../../langsys-js-typescript
git -C node_modules/langsys-js-typescript rev-parse --short HEAD

# suite, types, lint, build
npm run typecheck && npm test && npm run lint && npm run build

# the REG-3 measurement, one process per shape
node _dev_/rn-teardown-probe.mjs browser     # control: sentOnTeardown has the phrase, keepalive true
node _dev_/rn-teardown-probe.mjs rn          # teardownInstalled false, sentOnTeardown []

# M9: resolve the core to the published tarball, then restore the link
npm pack langsys-js-typescript@0.6.5 && mkdir -p /tmp/p && tar xzf langsys-js-typescript-0.6.5.tgz -C /tmp/p
ln -s ~/Documents/dev/langsys-js-typescript/node_modules /tmp/p/package/node_modules
ln -sfn /tmp/p/package node_modules/langsys-js-typescript && npm run typecheck   # TS2305 ×7
ln -sfn ../../langsys-js-typescript node_modules/langsys-js-typescript
```
