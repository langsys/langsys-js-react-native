/**
 * Test-only helper: start the vendored contract fixture (`contract-fixture/`)
 * on an ephemeral port, seed it, and read back what it accepted. There is no
 * way to read what the double received — only the state it was left in.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

export interface ContractFixture {
    baseUrl: string;
    seed(doc: object): Promise<void>;
    registered(project: string): Promise<Array<{ category: string | null; phrase: string }>>;
    stop(): void;
}

export async function startContractFixture(): Promise<ContractFixture> {
    const server = fileURLToPath(new URL('../contract-fixture/server.mjs', import.meta.url));
    const proc: ChildProcess = spawn(process.execPath, [server], { stdio: ['ignore', 'pipe', 'inherit'] });
    const line = await new Promise<string>((resolve, reject) => {
        createInterface({ input: proc.stdout! }).once('line', resolve);
        proc.once('exit', (code) => reject(new Error(`contract fixture exited with ${code}`)));
    });
    const ready = JSON.parse(line) as { base_url: string; fixture_url: string };

    return {
        baseUrl: ready.base_url,
        async seed(doc) {
            const res = await fetch(`${ready.fixture_url}/seed`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(doc),
            });
            if (!res.ok) throw new Error(`seed refused: ${res.status}`);
        },
        async registered(project) {
            const state = (await (await fetch(`${ready.fixture_url}/state`)).json()) as {
                projects: Record<string, { phrases: Array<{ category: string | null; phrase: string }> }>;
            };
            return state.projects[project]?.phrases ?? [];
        },
        stop() {
            proc.kill();
        },
    };
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
