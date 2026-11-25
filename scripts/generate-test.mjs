#!/usr/bin/env node
/**
 * Test-case text → Playwright test.
 *
 *   node scripts/generate-test.mjs <case.md> [--fix <n>] [--model <model>]
 *
 * 1. Reads a plain-text test case (steps + expected result). Its first line must contain `Система: UI` or `Система: API`.
 * 2. Builds a prompt with the project's rules (.claude/CLAUDE.md), Page Objects / API client, fixtures, test data
 *    and one existing spec as a style example.
 * 3. Calls Claude Code in headless mode (`claude -p`, no tools: the model sees only what we pass).
 * 4. Writes the spec to tests/<ui|api>/generated/<case>.spec.ts, runs `tsc --noEmit` and the test itself.
 * 5. If typecheck or the test fails and --fix > 0, sends the error back and asks for a corrected file.
 *
 * Everything (prompt, raw model answers, run logs, summary) is saved to generator/runs/<case>/ as evidence.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const casePath = args.find((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const maxFixes = Number(flag('fix', '1'));
const model = flag('model', undefined);

if (!casePath) {
  console.error('Usage: node scripts/generate-test.mjs <case.md> [--fix <n>] [--model <model>]');
  process.exit(2);
}

const caseText = readFileSync(casePath, 'utf8');
const project = /Система:\s*API/i.test(caseText.split('\n')[0]) ? 'api' : /Система:\s*UI/i.test(caseText.split('\n')[0]) ? 'ui' : null;
if (!project) {
  console.error('First line of the case must contain "Система: UI" or "Система: API".');
  process.exit(2);
}

const slug = path.basename(casePath, path.extname(casePath));
const specRel = `tests/${project}/generated/${slug}.spec.ts`;
const runDir = `generator/runs/${slug}`;
mkdirSync(path.dirname(specRel), { recursive: true });
mkdirSync(runDir, { recursive: true });

const CONTEXT = {
  ui: [
    'src/pages/LoginPage.ts',
    'src/pages/HeaderComponent.ts',
    'src/pages/InventoryPage.ts',
    'src/pages/CartPage.ts',
    'src/pages/CheckoutPage.ts',
    'src/fixtures/ui.ts',
    'src/data/users.ts',
    'src/data/products.ts',
    'tests/ui/cart.spec.ts',
  ],
  api: ['src/api/BookingApi.ts', 'src/fixtures/api.ts', 'src/data/bookings.ts', 'tests/api/booking.spec.ts'],
}[project];

const file = (p) => `--- ${p} ---\n${readFileSync(p, 'utf8')}`;

const prompt = `You write one Playwright + TypeScript test file for an existing project.

PROJECT RULES (.claude/CLAUDE.md):
${readFileSync('.claude/CLAUDE.md', 'utf8')}

EXISTING CODE YOU MUST REUSE (do not redefine it):
${CONTEXT.map(file).join('\n\n')}

TASK
Turn the test case below into ONE spec file. It will be saved as \`${specRel}\`, so imports are relative to that location
(e.g. \`import { test, expect } from '../../../src/fixtures/${project}';\`).
- Import test/expect only from the project's fixtures file.
- Reuse Page Object / API client methods and test data constants. Do not invent methods that do not exist.
- If an action has no Page Object method, use a locator inline (prefer getByTestId / getByRole) and put the comment
  \`// TODO(page-object): <what to add>\` on the line above it.
- Every step of the case → one \`test.step('<step text in Ukrainian>')\`. Key assertions get a message with the expected
  behaviour: \`expect(x, '<expected>')\`. Add annotations \`severity\` and (for UI) \`precondition\`.
- The test asserts the CORRECT behaviour from "Очікуваний результат". Never weaken it to match a possible bug.
- API tests clean up everything they create in \`finally\`.
- Answer with exactly one \`\`\`ts code block and nothing else.

TEST CASE:
${caseText}`;

writeFileSync(`${runDir}/prompt.txt`, prompt);

function askModel(input, attempt) {
  const cliArgs = ['-p', '--output-format', 'json', '--tools', '', '--no-session-persistence'];
  if (model) cliArgs.push('--model', model);
  const started = Date.now();
  const res = spawnSync('claude', cliArgs, { input, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 20e6 });
  if (res.status !== 0) throw new Error(`claude -p failed (${res.status}): ${res.stderr || res.stdout}`);
  const json = JSON.parse(res.stdout);
  writeFileSync(`${runDir}/attempt-${attempt}.response.md`, json.result ?? '');
  const code = (json.result ?? '').match(/```(?:ts|typescript)?\s*\n([\s\S]*?)```/)?.[1];
  if (!code) throw new Error(`No code block in model answer (attempt ${attempt}). See ${runDir}/attempt-${attempt}.response.md`);
  return { code, seconds: Math.round((Date.now() - started) / 1000), cost: json.total_cost_usd };
}

function run(cmd, cmdArgs, env = {}) {
  const res = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, HEADLESS: '1', ...env },
    maxBuffer: 20e6,
  });
  return { ok: res.status === 0, output: `${res.stdout}\n${res.stderr}`.replace(/\u001b\[[0-9;]*m/g, '').trim() };
}

function check(attempt) {
  const tsc = run('npx', ['tsc', '--noEmit']);
  const tscErrors = tsc.output.split('\n').filter((l) => l.includes(specRel.replace(/\//g, path.sep)) || l.includes(specRel)).join('\n');
  if (!tsc.ok && tscErrors) {
    writeFileSync(`${runDir}/attempt-${attempt}.typecheck.log`, tsc.output);
    return { stage: 'typecheck', ok: false, log: tscErrors };
  }
  // Only the list reporter: generated runs must not overwrite bug-reports/BUGS.md.
  const pw = run('npx', ['playwright', 'test', specRel, `--project=${project}`, '--reporter=list', '--retries=0']);
  writeFileSync(`${runDir}/attempt-${attempt}.test.log`, pw.output);
  return { stage: 'test', ok: pw.ok, log: pw.output.slice(-4000) };
}

const summary = { case: casePath, project, spec: specRel, model: model ?? 'default', attempts: [] };
let input = prompt;
let previousCode;
let lastResult;

for (let attempt = 1; attempt <= maxFixes + 1; attempt++) {
  console.log(`\n[${slug}] attempt ${attempt}: asking model…`);
  const { code, seconds, cost } = askModel(input, attempt);
  if (code.trim() === previousCode?.trim()) {
    // The model kept the test as is after seeing the failure: it considers the application wrong, not the test.
    summary.attempts.push({ attempt, seconds, costUsd: cost, stage: 'unchanged', passed: false, pageObjectTodos: 0 });
    summary.verdict = 'possible product bug: model kept the correct assertion after the failure';
    console.log(`[${slug}] attempt ${attempt}: model returned the same code → possible product bug, stopping`);
    break;
  }
  previousCode = code;
  writeFileSync(specRel, code);
  writeFileSync(`${runDir}/attempt-${attempt}.spec.ts`, code);

  const result = check(attempt);
  lastResult = result;
  const todos = (code.match(/TODO\(page-object\)/g) ?? []).length;
  summary.attempts.push({ attempt, seconds, costUsd: cost, stage: result.stage, passed: result.ok, pageObjectTodos: todos });
  console.log(`[${slug}] attempt ${attempt}: ${result.stage} ${result.ok ? 'PASSED' : 'FAILED'} (${seconds}s, TODO(page-object): ${todos})`);
  if (result.ok) break;

  input = `${prompt}

YOUR PREVIOUS ANSWER:
\`\`\`ts
${code}
\`\`\`

IT FAILED AT ${result.stage.toUpperCase()}:
${result.log}

If the failure is a TypeScript or test-code error, fix the code. If the test failed because the application behaves
differently from "Очікуваний результат", that may be a real bug: keep the correct assertion and do NOT weaken it.
Answer with the full corrected file in exactly one \`\`\`ts code block.`;
}

summary.passed = summary.attempts.at(-1).passed;
if (!summary.verdict && !summary.passed) {
  const lastLog = lastResult?.log ?? '';
  const assertionFailure = /expect\(.+\)\.[\w.]+\(.*\) failed|Expected[\s\S]*Received/.test(lastLog);
  const codeProblem = /TypeError|ReferenceError|SyntaxError|strict mode violation|Test timeout of \d+ms exceeded/.test(lastLog);
  summary.verdict =
    lastResult?.stage === 'test' && assertionFailure && !codeProblem
      ? 'possible product bug: test compiles and fails on an assertion — needs human triage'
      : `failed at ${lastResult?.stage ?? 'generation'}: see the last attempt logs`;
}
summary.verdict ??= 'passed';
console.log(`[${slug}] verdict: ${summary.verdict}`);
writeFileSync(`${runDir}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(`\n[${slug}] ${summary.passed ? 'PASSED' : 'FAILED'} after ${summary.attempts.length} attempt(s) → ${specRel}`);
process.exit(summary.passed ? 0 : 1);
