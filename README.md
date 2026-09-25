# langsys-js-react-native

React Native binding for [Langsys](https://langsys.dev) — realtime, continuous
translations with automatic token discovery. The phrase in your code is the
lookup key **and** the base-language default: no keys file, no extraction step.

> **Status: experimental, hooks-first.** The full `t()` pipeline works on
> Hermes today; the DOM-oriented components are intentionally absent (see
> Roadmap). Requires the `langsys-js-typescript` release that carries the
> write-gating surface — `setPersistStorage`, `writeEnabled`, `setWriteGrant`,
> `seedCatalog`, `setTeardownSignal`. No published version carries it yet (0.6.5 does not), and this
> package's dependency range moves to that release when it ships.

## What works today

The base SDK's `t()` path is platform-clean: transport is global `fetch`,
formatting is `Intl` (Hermes ships it), and every browser-global touch is
guarded. So the hooks — identical surface to
[`langsys-js-react`](https://github.com/langsys/langsys-js-react) — just work:

```tsx
import { Text, View } from 'react-native';
import { LangsysApp, useLocaleStore, useT } from 'langsys-js-react-native';

function Greeting({ name }: { name: string }) {
    const t = useT();
    return <Text>{t('Hello, {name}!', 'Greetings', { name })}</Text>;
}

export default function App() {
    const [locale, setLocale, store] = useLocaleStore('en-US');
    // init once (module scope or a top-level effect):
    // LangsysApp.init({ projectid, key, UserLocaleStore: store });
    return (
        <View>
            <Greeting name="Sarah" />
        </View>
    );
}
```

ICU plurals, locale-aware number/date params, category disambiguation, and
registration from write-enabled sessions behave like the web SDKs. Two things
differ on React Native — see [Known limitations](#known-limitations).

Content waiting to be registered is sent when the app leaves the foreground —
`AppState` leaving `active` — so it isn't stranded when the OS suspends or
kills the app. The package wires this up itself when it loads; there is
nothing to call.

## Storage: make the catalog survive cold starts

RN has no `localStorage`, so by default the catalog cache is in-memory and a
cold start refetches it. Inject any synchronous key-value storage at startup —
[MMKV](https://github.com/mrousavy/react-native-mmkv) is the natural fit:

```ts
import { MMKV } from 'react-native-mmkv';
import { setPersistStorage } from 'langsys-js-react-native';

const storage = new MMKV({ id: 'langsys' });
setPersistStorage({
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
});
// then LangsysApp.init(...) as usual
```

Call it before (or after — it re-hydrates) `init`; the last-loaded catalog then
paints instantly on the next launch while the fresh one fetches.

## Write capability, grants and seeding

Whether a session may register content is decided by the server, per session —
the same key can be write-enabled from one network and read-only from another.
Read it with `useWriteEnabled()`: `undefined` until authorization lands, then
`false` or `true`. Render for all three, and don't default `undefined` to
`false`.

```tsx
import { useWriteEnabled } from 'langsys-js-react-native';

const writeEnabled = useWriteEnabled();
```

The raw `writeEnabled` and `autoDiscovery` signals are re-exported unchanged for
use outside components. `LangsysApp` is the base SDK's singleton itself, so
every core method is on it, including:

- `setWriteGrant(grant)` (also exported standalone) — supply a short-lived write
  grant after `init()`, e.g. once the user logs in. Pass a provider function so
  the token is fetched fresh per request.
- `seedCatalog(catalog, locale)` — put a catalog in place synchronously, with no
  network, e.g. one bundled with the app for first paint.

## Server messages

Validation errors and other messages your API returns can be translated like any
other phrase. Find the entries in a response with `resolveServerMessages`, then
render each with `useServerMessage`: it shows the translation of the entry's
template when the catalog has one, the entry's own `message` otherwise, and
re-renders when the catalog or locale changes.

```tsx
import { Text } from 'react-native';
import { resolveServerMessages, useServerMessage, type ServerMessage } from 'langsys-js-react-native';

function FieldError({ entry }: { entry: ServerMessage }) {
    return <Text>{useServerMessage(entry)}</Text>;
}

const entries = resolveServerMessages(await response.json());
```

Entries are looked up under the `Errors` category unless you set
`messagesCategory` in `init`.

## A bundled catalog for the first launch

Ship a catalog snapshot exported from Langsys inside the app, and load it before
the first render: translations then show on the very first launch and offline,
with no network call.

```ts
import snapshot from './langsys-snapshot.json';

LangsysApp.loadSnapshot(snapshot); // synchronous; for another locale, pass it as the second argument
LangsysApp.init({ projectid: '...', key: '...', UserLocaleStore: store });
```

The snapshot is a cache, not the source of truth. `init()` still fetches the
catalog and replaces it, and a phrase the snapshot lacks is found there. To
refresh one, export it again; an edited snapshot fails its checksum and
`loadSnapshot` throws a `SnapshotError` (`error.reason === 'checksum'`) rather
than serving it. `loadSnapshot` returns `false` when the snapshot holds no
catalog for the locale.

## Migrating from i18n keys

If your app already translates with keys, pass its source-language file to
`init` as `legacyKeys`. `t('checkout.submit')` then resolves the key to its
value and translates that value, so keyed and plain-text calls work side by
side while you migrate. A JSON file bundled with the app works as is:

```ts
import en from './locales/en.json';

LangsysApp.init({
    projectid: '...',
    key: '...',
    UserLocaleStore: store,
    legacyKeys: [{ name: 'en.json', data: en }],
});
```

A key's leading namespace becomes its category (`checkout.submit` → `checkout`)
unless the call passes one. Langsys only ever sees the source values, never the
keys. `format` may be `plain` (the default), `i18next` or `vue-i18n`.

## Configuration: pointing at another API

The SDK talks to `https://api.langsys.dev/api` by default. To run against a local
instance, a staging host or a test double, pass `apiUrl` to `init`:

```ts
LangsysApp.init({
    projectid: '...',
    key: '...',
    UserLocaleStore: store,
    apiUrl: 'http://10.0.2.2:8000/api', // the host machine, from an Android emulator
});
```

Prefer `apiUrl` over `LangsysAppAPI.setBaseUrl()`. `setBaseUrl` must run
**before** `init()`: called after it, the SDK has already authorized against the
default host and stays inert for the life of the app, with nothing thrown.
`apiUrl` is applied inside `init()` before authorization, so the ordering cannot
be got wrong. Check what `init()` returns — a failed authorization is reported
there and nowhere else.

## Known limitations

- **The departure send is dispatched, not guaranteed.** React Native's `fetch`
  has no `keepalive`, so whether that last request completes depends on how
  long the OS lets the app run after leaving the foreground.
- **No discovery reporting.** On the web, a read-only session reports the page's
  URL so Langsys can visit it and register what it finds. An app has no URL, so a
  read-only key on React Native registers nothing and reports nothing. Use a
  write-enabled session (or a write grant) to register content from the app.

## Roadmap

- **`<Phrase>`** — portable in principle: the base SDK's rich-text scheme uses
  neutral `{m0o}`/`{m0c}` markup tokens with exported helpers, so an RN
  implementation maps slots to nested `<Text>` runs instead of cloned DOM
  elements. Needs an RN-native encoder for the children.
- **`<Translate>` (content blocks)** — the web version walks an HTML tree; RN
  has no equivalent, so this is unlikely to be ported. Coverage in RN is
  explicit: what you wrap in `t()` translates.
- `<DontTranslate>` ships now as an API-parity `<Text>` pass-through.

## Learn more

- The Langsys Learning Center — [docs.langsys.dev/learn](https://docs.langsys.dev/learn)
- Base SDK: [`langsys-js-typescript`](https://github.com/langsys/langsys-js-typescript)
- API docs: [docs.langsys.dev](https://docs.langsys.dev)
