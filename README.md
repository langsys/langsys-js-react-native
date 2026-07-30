# langsys-js-react-native

React Native binding for [Langsys](https://langsys.dev) — realtime, continuous
translations with automatic token discovery. The phrase in your code is the
lookup key **and** the base-language default: no keys file, no extraction step.

> **Status: experimental, hooks-first.** The full `t()` pipeline works on
> Hermes today; the DOM-oriented components are intentionally absent (see
> Roadmap). Requires `langsys-js-typescript` ≥ 0.4.2 (the release that added
> `setPersistStorage` and made the token-flush timer demand-driven).

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
token discovery (write keys) all behave exactly like the web SDKs.

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
