# Changelog

## 0.1.0 — Unreleased (experimental)

Initial hooks-first scaffold.

- `useT`, `useCurrentLocale`, `useTranslations`, `useLocaleStore`, `useSignal`,
  `createLocaleStore` — identical implementations to the web React binding
  (`useSyncExternalStore` is core React).
- `setPersistStorage` re-export + MMKV recipe for catalog persistence across
  cold starts (requires `langsys-js-typescript` ≥ 0.4.2, unreleased at the
  time of writing).
- `<DontTranslate>` as an API-parity `<Text>` pass-through.
- No `<Translate>`/`<Phrase>` yet — see README roadmap.
- Not yet tested on-device; typechecked and built only. The base SDK's
  RN-relevant behaviors (in-memory persist fallback under a `window`-defined /
  localStorage-less environment, plain-text logger, demand-driven flush timer)
  are covered by tests in the base repo's verification.
