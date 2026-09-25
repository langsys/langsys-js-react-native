import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { iLangsysInitConfig as CoreInitConfig } from 'langsys-js-typescript';
import { describe, expect, it } from 'vitest';
import type { iLangsysInitConfig as RnInitConfig } from './index.js';

/**
 * Absence probes: this binding authors none of the behaviour the core owns.
 *
 * A probe that reports zero proves nothing on its own — a pattern that can never
 * match, a stripper that deletes code, or a walk that reads no files all report
 * zero too. So every probe carries a FIRING CONTROL (the same pattern, run over
 * a snippet containing the construct, must hit), and the probe set shares three
 * more: the file list is pinned, stripping keeps known code, and stripping drops
 * comments. The last matters because every absent behaviour here is *discussed*
 * in a comment somewhere, and an unstripped probe reports participation that
 * does not exist.
 *
 * Adding a source file fails the pinned list on purpose: new source is new
 * surface, and the probes should be re-read against it.
 */

const SRC_DIR = fileURLToPath(new URL('.', import.meta.url));

interface Source {
    file: string;
    text: string;
}

function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return walk(path);
        return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
    });
}

/** Comments out, code and line numbers kept. */
function stripComments(text: string): string {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ''))
        .replace(/(^|\s)\/\/[^\n]*/gm, '$1');
}

function probe(pattern: RegExp, sources: Source[]): string[] {
    const hits: string[] = [];
    for (const { file, text } of sources) {
        stripComments(text)
            .split('\n')
            .forEach((line, i) => {
                if (pattern.test(line)) hits.push(`${file}:${i + 1}`);
            });
    }
    return hits;
}

const synthetic = (code: string): Source[] => [{ file: 'synthetic.ts', text: code }];

const sources: Source[] = walk(SRC_DIR).map((path) => ({
    file: relative(SRC_DIR, path),
    text: readFileSync(path, 'utf8'),
}));

describe('probe controls', () => {
    it('reads the binding source — the file list is pinned', () => {
        expect(sources.map((s) => s.file).sort()).toEqual([
            'components/DontTranslate.ts',
            'hooks.ts',
            'index.ts',
            'teardown.ts',
        ]);
    });

    it('stripping keeps code: constructs known to be present are found', () => {
        expect(probe(/useSyncExternalStore\(/, sources)).toHaveLength(1);
        expect(probe(/from 'langsys-js-typescript'/, sources).length).toBeGreaterThanOrEqual(4);
    });

    it('stripping drops comments: a construct only discussed in a comment is not a hit', () => {
        expect(probe(/fetch\(/, synthetic('/* fetch(url) */\n// fetch(url)\nconst a = 1; // fetch(url)'))).toEqual([]);
    });
});

interface Probe {
    rule: string;
    behaviour: string;
    pattern: RegExp;
    firesOn: string;
}

const PROBES: Probe[] = [
    {
        rule: 'BIND-2',
        behaviour: 'branches on server-computed capability or policy',
        pattern: /key_type|keyType|write_enabled|auto_discovery|writeEnabled\.get\(|autoDiscovery\.get\(/,
        firesOn: 'if (writeEnabled.get() === false) return null;',
    },
    {
        rule: 'BIND-3',
        behaviour: 'network behaviour: requests, headers, timers or scheduling',
        pattern:
            /\bfetch\(|XMLHttpRequest|axios|setTimeout|setInterval|queueMicrotask|requestAnimationFrame|headers\s*[:[]/,
        firesOn: 'setTimeout(() => void fetch(url), 400);',
    },
    {
        rule: 'BIND-5',
        behaviour: 'caching or memoizing lookups',
        pattern: /useMemo|useCallback|\bmemo\(|new (Weak)?Map\(|\bcache\b/i,
        firesOn: "const label = useMemo(() => t('Save', 'UI'), []);",
    },
    {
        rule: 'GATE-1..9',
        behaviour: 'capability decisions',
        pattern:
            /key_type|keyType|write_enabled|writeEnabled\.(get|set)\(|setWriteEnabled|discovery_base_locale_only|discoveryBaseLocaleOnly/,
        firesOn: "if (auth.key_type === 'write') queue.push(phrase);",
    },
    {
        rule: 'REG-1..13',
        behaviour: 'registration: queueing, batching, sending or backoff',
        pattern:
            /translatable-items|createTranslatableItems|missingTokens|keepalive|sendBeacon|batch_limit|retryNotBefore/,
        firesOn: 'api.createTranslatableItems(batch, { keepalive: true });',
    },
    {
        rule: 'CAT-1..3',
        behaviour: 'catalog reads or presence tests',
        pattern: /hasOwnProperty|Object\.hasOwn|__uncategorized__|sTranslations\.get\(|\.lookup(Content)?\(/,
        firesOn: 'if (!Object.prototype.hasOwnProperty.call(bucket, phrase)) record(phrase);',
    },
    {
        rule: 'CACHE-1..2',
        behaviour: 'cache keys or storage access',
        pattern: /localStorage|sessionStorage|\.getItem\(|\.setItem\(|['"`]langsys:/,
        firesOn: 'storage.setItem(`langsys:${locale}`, json);',
    },
    {
        rule: 'CID-1..4',
        behaviour: 'content-block identity derivation',
        pattern: /generateCustomId|\bmd5(Legacy)?\b|custom_id|customId/,
        firesOn: 'const id = md5(JSON.stringify([category, tokens]));',
    },
    {
        rule: 'ICU-1..6',
        behaviour: 'interpolation or ICU recovery',
        pattern: /\binterpolate\b|\bisICU\b|IntlMessageFormat|intl-messageformat|\bIntl\./,
        firesOn: 'return new IntlMessageFormat(template, locale).format(params);',
    },
    {
        rule: 'GRANT-1..4',
        behaviour: 'grant resolution or transmission',
        pattern: /X-Write-Grant|writeGrant\s*[:=(]|resolveWriteGrant|hasWriteGrant/,
        firesOn: "headers['X-Write-Grant'] = await config.writeGrant();",
    },
    {
        rule: 'OBS-1',
        behaviour: 'diagnostics emitted here',
        pattern: /console\.|\blogger\.|\.warn\(/,
        firesOn: "console.warn('write capability unusable for this key');",
    },
    {
        rule: 'WIRE-1..5',
        behaviour: 'wire handling: auth header, API base, status parsing or identifier casing',
        pattern: /x-authorization|apiUrl|setBaseUrl|\.status\s*===?\s*204|\.json\(\)|toLowerCase\(/i,
        firesOn: 'const res = await fetch(`${apiUrl}/translations`); if (res.status === 204) return;',
    },
    {
        rule: 'MSG-1..6',
        behaviour: 'server-message resolution or rendering',
        pattern: /\.template\b|\.message\b|\.params\b|['"]Errors['"]/,
        firesOn: "t(entry.template, 'Errors', entry.params ?? {});",
    },
    {
        rule: 'MIG-1..8',
        behaviour: 'legacy-key lookup or conversion',
        pattern: /legacy|migrat|\{\{/i,
        firesOn: 'const phrase = legacyFile[key] ?? key;',
    },
    {
        rule: 'SNAP-2..3',
        behaviour: 'snapshot loading',
        pattern: /snapshot|preload/i,
        firesOn: 'LangsysApp.seedCatalog(loadSnapshot(bundle), locale);',
    },
];

describe('absence probes — each with a firing control', () => {
    for (const p of PROBES) {
        describe(`${p.rule}: no ${p.behaviour}`, () => {
            it('firing control: the probe hits when the construct is present', () => {
                expect(probe(p.pattern, synthetic(p.firesOn)).length).toBeGreaterThan(0);
            });

            it('absent from this binding', () => {
                expect(probe(p.pattern, sources)).toEqual([]);
            });
        });
    }
});

/** Member names declared directly in one interface body. */
function interfaceMembers(text: string, name: string): string[] {
    const code = stripComments(text);
    const start = code.search(new RegExp(`interface ${name}\\b[^{]*\\{`));
    if (start === -1) return [];
    const open = code.indexOf('{', start);
    let depth = 0;
    let end = open;
    for (let i = open; i < code.length; i++) {
        if (code[i] === '{') depth++;
        else if (code[i] === '}' && --depth === 0) {
            end = i;
            break;
        }
    }
    return [...code.slice(open + 1, end).matchAll(/^\s*([A-Za-z_]\w*)\??\s*:/gm)].map((m) => m[1] ?? '');
}

describe('BIND-4 — no configuration the core does not define', () => {
    const indexSource = sources.find((s) => s.file === 'index.ts')?.text ?? '';

    it('firing control: the member reader sees an added option', () => {
        const added =
            'interface iLangsysInitConfig extends Base {\n    UserLocaleStore: Signal<string>;\n    discovery?: boolean;\n}';
        expect(interfaceMembers(added, 'iLangsysInitConfig')).toEqual(['UserLocaleStore', 'discovery']);
    });

    it('declares exactly one member, and it narrows a key the core already has', () => {
        expect(interfaceMembers(indexSource, 'iLangsysInitConfig')).toEqual(['UserLocaleStore']);
    });

    it('adds no key at the type level (checked by `npm run typecheck`)', () => {
        // Compile-time: a key present in this binding's config and absent from
        // the core's makes this assignment a type error. Mutation recorded in
        // CONFORMANCE.md — adding `discovery?: boolean` fails `tsc`.
        type AddedKeys = Exclude<keyof RnInitConfig, keyof CoreInitConfig>;
        const addsNothing: [AddedKeys] extends [never] ? true : false = true;
        expect(addsNothing).toBe(true);
    });
});

describe('CONF-1 — no conformance claim rests on what the SDK sent', () => {
    // This file is excluded from its own scan: it holds the pattern below as a
    // literal and asserts on nothing the SDK does. `_dev_/rn-teardown-probe.mjs`
    // DOES intercept a send — it measures the REG-3 gap, which is rowed
    // `not implemented` and claims nothing.
    const SPY = /toHaveBeenCalled|toHaveBeenLastCalledWith|\.mock\.calls|vi\.spyOn|vi\.fn\(|getRequests\(/;
    const tests: Source[] = readdirSync(SRC_DIR)
        .filter((f) => /\.test\.tsx?$/.test(f) && f !== 'conformance-probes.test.ts')
        .map((f) => ({ file: f, text: readFileSync(join(SRC_DIR, f), 'utf8') }));

    it('reads the test files — the list is pinned', () => {
        expect(tests.map((t) => t.file).sort()).toEqual([
            'hooks.test.ts',
            'legacy-keys.test.ts',
            'rn-teardown.test.ts',
            'server-messages.test.ts',
            'surface.test.ts',
            'teardown.test.ts',
            'upstream-precondition.test.ts',
        ]);
    });

    it('firing control: the probe hits a call-shape assertion', () => {
        expect(probe(SPY, synthetic("expect(vi.spyOn(api, 'post')).toHaveBeenCalled();")).length).toBeGreaterThan(0);
    });

    it('no test asserts on spies, mock calls or outgoing requests', () => {
        expect(probe(SPY, tests)).toEqual([]);
    });
});
