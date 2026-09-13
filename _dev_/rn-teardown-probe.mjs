#!/usr/bin/env node
/**
 * REG-3 measurement: does anything flush the core's registration queue when the
 * execution context ends?
 *
 *   node _dev_/rn-teardown-probe.mjs browser   # firing control: window + document
 *   node _dev_/rn-teardown-probe.mjs rn        # React Native: window === global, no document
 *
 * One shape per process. The core is a module singleton, so running both shapes
 * in one process lets the first contaminate the second (CONF-3).
 *
 * The browser run is the control, not a formality: it proves this harness
 * observes a teardown flush when one exists, so an empty `sentOnTeardown` in the
 * rn run is an absence rather than a harness that cannot see anything.
 *
 * The send is intercepted in-process. That is fine for what this measures —
 * whether a flush is dispatched at all — and it is why REG-3 cites this as a
 * measurement of a gap, never as conformance evidence (CONF-1).
 *
 * Prints one JSON line.
 */
const mode = process.argv[2];
if (mode !== 'browser' && mode !== 'rn') {
    console.error('usage: rn-teardown-probe.mjs browser|rn');
    process.exit(2);
}

const listeners = {};
const addEventListener = (evt, handler) => void (listeners[evt] ??= []).push(handler);
if (mode === 'browser') {
    globalThis.window = { addEventListener, location: { href: 'https://site.local/p' } };
    globalThis.document = { addEventListener, visibilityState: 'visible' };
    globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
} else {
    // What React Native provides: `global.window = global`; no document, no
    // location, no sessionStorage.
    globalThis.window = globalThis;
}

// Imported only after the globals exist, so the core sees the shape under test.
const { Translations, LangsysAppAPI, createSignal, writeEnabled, sTranslations } =
    await import('langsys-js-typescript');

const sends = [];
LangsysAppAPI.createTranslatableItems = async (items, opts = {}) => {
    sends.push({ phrases: items.map((i) => i.phrase), keepalive: !!opts.keepalive });
    return { status: true };
};

sTranslations.set({ __uncategorized__: { __category__: '__uncategorized__', __symbol__: '__uncategorized__' } });
const translations = new Translations({
    projectid: 'p',
    key: 'k',
    sUserLocale: createSignal('en-US'),
    baseLocale: 'en',
});
writeEnabled.set(true);

let threw = null;
try {
    translations.t('Unseen phrase');
} catch (err) {
    threw = String(err);
}

// A previous send failed: REG-8 backoff puts the next ordinary attempt a minute out.
translations.retryNotBefore = Date.now() + 60_000;
await new Promise((resolve) => setTimeout(resolve, 1000)); // well past the ~400ms debounce
const queuedAtTeardown = translations.missingTokens.map((m) => m.token ?? m.phrase);

// The execution context ends. Browser: pagehide. React Native: nothing the core
// listens to exists, so there is nothing to fire.
(listeners.pagehide ?? []).forEach((handler) => handler());
await new Promise((resolve) => setTimeout(resolve, 50));

console.log(
    JSON.stringify({
        mode,
        threw,
        teardownInstalled: translations.teardownInstalled,
        coreListenedFor: Object.keys(listeners),
        queuedAtTeardown,
        sentOnTeardown: sends.filter((s) => s.keepalive),
    })
);
process.exit(0);
