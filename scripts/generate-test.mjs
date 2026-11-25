#!/usr/bin/env node
/**
 * Test-case text → Playwright test. One case or a whole pool of cases.
 *
 *   node scripts/generate-test.mjs <case.md | dir | pattern>... [--all] [--force] [--fix <n>] [--model <model>] [--dry-run]
 *
 *   generator/cases/01-logout.md          one case
 *   generator/cases                       every *.md in the directory
 *   "generator/cases/0*.md"               simple * pattern (expanded by the script, so it works in PowerShell too)
 *   --all                                 = generator/cases
 *   --force                               regenerate cases whose spec already exists (by default they are skipped,
 *                                         so manual fixes made after review are never overwritten)
 *   --dry-run                             only show what would be generated, no model calls
 *
 * Per case:
 * 1. Reads the case (first line: `Система: UI` or `Система: API`; then precondition, steps, expected result).
 * 2. Builds a prompt with .claude/CLAUDE.md, Page Objects / API client, fixtures, test data and one spec as a style example.
 * 3. Calls Claude Code in headless mode (`claude -p`, no tools: the model sees only what we pass).
 * 4. Writes tests/<ui|api>/generated/<case>.spec.ts, runs `tsc --noEmit` and the test.
 * 5. On failure and --fix > 0, sends the error back and asks for a corrected file.
 * 6. Only a PASSING spec stays in the test pool. A failing one is kept in generator/runs/<case>/ for review
 *    (and a spec that existed before --force is restored).
 *
 * Evidence per case: generator/runs/<case>/ (prompt, raw answers, code and logs of each attempt, summary.json).
 * Pool runs also write generator/runs/batch-summary.md.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE =
  'Usage: node scripts/generate-test.mjs <case.md | dir | pattern>... [--all] [--force] [--fix <n>] [--model <model>] [--dry-run]';
const FLAGS_WITH_VALUE = new Set(['--fix', '--model']);
const DEFAULT_POOL = 'generator/cases';

// ---------- arguments ----------
const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && !FLAGS_WITH_VALUE.has(args[i - 1]));
const has = (name) => args.includes(`--${name}`);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const maxFixes = Number(flag('fix', '1'));
const model = flag('model', undefined);
const force = has('force');
const dryRun = has('dry-run');

if ((positional.length === 0 && !has('all')) || Number.isNaN(maxFixes)) {
  console.error(USAGE);
  process.exit(2);
}

// Paths from the command line are relative to where the user ran it; everything else — to the project root.
// IDEs (IntelliJ "Run" on a .mjs file) start the script with cwd = scripts/, so never rely on cwd.
const startCwd = process.cwd();
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputs = [...positional.map((p) => path.resolve(startCwd, p)), ...(has('all') ? [path.join(PROJECT_ROOT, DEFAULT_POOL)] : [])];
process.chdir(PROJECT_ROOT);

const rel = (p) => path.relative(PROJECT_ROOT, p).split(path.sep).join('/');

/** File, directory (*.md inside) or a simple `*` pattern in the file name. */
function expand(input) {
  if (existsSync(input) && statSync(input).isDirectory()) {
    return readdirSync(input).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md').sort().map((f) => path.join(input, f));
  }
  if (path.basename(input).includes('*')) {
    const dir = path.dirname(input);
    const re = new RegExp(`^${path.basename(input).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    return existsSync(dir) ? readdirSync(dir).filter((f) => re.test(f)).sort().map((f) => path.join(dir, f)) : [];
  }
  return [input];
}

const cases = [...new Set(inputs.flatMap(expand))];
const missing = cases.filter((c) => !existsSync(c));
if (cases.length === 0 || missing.length) {
  console.error(`${missing.length ? `Test case not found: ${missing.join(', ')}` : 'No test cases matched.'}\n${USAGE}`);
  process.exit(2);
}

// ---------- helpers ----------
// The barrel (@ui / @api) goes first: it is what the spec imports from. Then helpers, Page Objects / API client,
// data and one up-to-date spec as a style example.
const CONTEXT = {
  ui: [
    'src/ui.ts',
    'src/support/meta.ts',
    'src/support/matchers.ts',
    'src/data/paths.ts',
    'src/data/messages.ts',
    'src/pages/LoginPage.ts',
    'src/pages/HeaderComponent.ts',
    'src/pages/InventoryPage.ts',
    'src/pages/CartPage.ts',
    'src/pages/CheckoutPage.ts',
    'src/pages/ProductDetailsPage.ts',
    'src/fixtures/ui.ts',
    'src/data/users.ts',
    'src/data/products.ts',
    'tests/ui/checkout.spec.ts',
  ],
  api: [
    'src/api.ts',
    'src/support/meta.ts',
    'src/support/matchers.ts',
    'src/api/BookingApi.ts',
    'src/fixtures/api.ts',
    'src/data/bookings.ts',
    'tests/api/booking.spec.ts',
  ],
};

const fileBlock = (p) => `--- ${p} ---\n${readFileSync(p, 'utf8')}`;

function detectProject(caseText) {
  const first = caseText.replace(/^﻿/, '').split('\n')[0];
  return /Система:\s*API/i.test(first) ? 'api' : /Система:\s*UI/i.test(first) ? 'ui' : null;
}

function buildPrompt(caseText, project, specRel) {
  return `You write one Playwright + TypeScript test file for an existing project.

PROJECT RULES (.claude/CLAUDE.md):
${readFileSync('.claude/CLAUDE.md', 'utf8')}

EXISTING CODE YOU MUST REUSE (do not redefine it):
${CONTEXT[project].map(fileBlock).join('\n\n')}

TASK
Turn the test case below into ONE spec file. It will be saved as \`${specRel}\`.
- Import EVERYTHING from the single alias \`'@${project}'\` (see src/${project}.ts), e.g.
  \`import { test, expect, meta, ... } from '@${project}';\`. No relative imports, no '@playwright/test'.
- Test details: \`test('<title>', meta('<Critical|Major|Medium|Minor>', '<precondition, UI only>'), async ({ ... }) => { ... })\`.
- Reuse Page Object / API client methods and test data constants. Do not invent methods that do not exist.
  Page Object methods accept product objects: \`loggedIn.addToCart(PRODUCTS.backpack, PRODUCTS.onesie)\`.
- Pages: \`expect(page).toHaveURL(PATHS.<page>)\`, never a hand-written URL regex.
- Money: \`expect(amount, '<expected>').toEqualMoney(<number>)\`, never toCents by hand.
- API status: \`await expect(response, '<expected>').toHaveStatus(<code>)\`, never \`response.status()\`.
- "The app must NOT go/do X" checks: \`expectQuick(...)\` (short timeout) instead of \`expect(..., { timeout })\`.
- If an action has no Page Object method, use a locator inline (prefer getByTestId / getByRole) and put the comment
  \`// TODO(page-object): <what to add>\` on the line above it.
- Every step of the case → one \`test.step('<step text in Ukrainian>')\`. Key assertions get a message with the expected
  behaviour: \`expect(x, '<expected>')\`.
- The test asserts the CORRECT behaviour from "Очікуваний результат". Never weaken it to match a possible bug.
- API: create bookings through the \`bookings\` fixture (\`bookings.create(overrides)\`, \`bookings.createRaw(payload)\`):
  it deletes them after the test, so no try/finally.
- Answer with exactly one \`\`\`ts code block and nothing else.

TEST CASE:
${caseText}`;
}

function askModel(input, runDir, attempt) {
  const cliArgs = ['-p', '--output-format', 'json', '--tools', '', '--no-session-persistence'];
  if (model) cliArgs.push('--model', model);
  const started = Date.now();
  const res = spawnSync('claude', cliArgs, { input, encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 20e6 });
  if (res.status !== 0) throw new Error(`claude -p failed (${res.status}): ${(res.stderr || res.stdout).slice(0, 500)}`);
  const json = JSON.parse(res.stdout);
  writeFileSync(`${runDir}/attempt-${attempt}.response.md`, json.result ?? '');
  const code = (json.result ?? '').match(/```(?:ts|typescript)?\s*\n([\s\S]*?)```/)?.[1];
  if (!code) throw new Error(`no code block in the model answer (attempt ${attempt}), see ${runDir}/attempt-${attempt}.response.md`);
  return { code, seconds: Math.round((Date.now() - started) / 1000), cost: json.total_cost_usd ?? 0 };
}

function run(cmd, cmdArgs) {
  const res = spawnSync(cmd, cmdArgs, { encoding: 'utf8', shell: true, env: { ...process.env, HEADLESS: '1' }, maxBuffer: 20e6 });
  return { ok: res.status === 0, output: `${res.stdout}\n${res.stderr}`.replace(/\u001b\[[0-9;]*m/g, '').trim() };
}

function check(specRel, project, runDir, attempt) {
  const tsc = run('npx', ['tsc', '--noEmit']);
  const tscErrors = tsc.output
    .split('\n')
    .filter((l) => l.includes(specRel) || l.includes(specRel.replace(/\//g, path.sep)))
    .join('\n');
  if (!tsc.ok && tscErrors) {
    writeFileSync(`${runDir}/attempt-${attempt}.typecheck.log`, tsc.output);
    return { stage: 'typecheck', ok: false, log: tscErrors };
  }
  // Only the list reporter: generator runs must not overwrite bug-reports/BUGS.md.
  const pw = run('npx', ['playwright', 'test', specRel, `--project=${project}`, '--reporter=list', '--retries=0']);
  writeFileSync(`${runDir}/attempt-${attempt}.test.log`, pw.output);
  return { stage: 'test', ok: pw.ok, log: pw.output.slice(-4000) };
}

function verdictFor(lastResult) {
  const log = lastResult?.log ?? '';
  const assertionFailure = /expect\(.+\)\.[\w.]+\(.*\) failed|Expected[\s\S]*Received/.test(log);
  const codeProblem = /TypeError|ReferenceError|SyntaxError|strict mode violation|Test timeout of \d+ms exceeded/.test(log);
  return lastResult?.stage === 'test' && assertionFailure && !codeProblem
    ? 'possible product bug: test compiles and fails on an assertion — needs human triage'
    : `failed at ${lastResult?.stage ?? 'generation'}: see the last attempt logs`;
}

// ---------- one case ----------
function generateCase(casePath) {
  const caseText = readFileSync(casePath, 'utf8');
  const slug = path.basename(casePath, path.extname(casePath));
  const project = detectProject(caseText);
  const base = { case: rel(casePath), slug, project, model: model ?? 'default', attempts: [] };
  if (!project) return { ...base, status: 'error', verdict: 'first line must contain "Система: UI" or "Система: API"' };

  const specRel = `tests/${project}/generated/${slug}.spec.ts`;
  const runDir = `generator/runs/${slug}`;
  const previousSpec = existsSync(specRel) ? readFileSync(specRel, 'utf8') : undefined;
  if (previousSpec !== undefined && !force) {
    return { ...base, spec: specRel, status: 'skipped', verdict: 'spec already exists (use --force to regenerate)' };
  }
  if (dryRun) return { ...base, spec: specRel, status: 'planned', verdict: previousSpec ? 'would regenerate (--force)' : 'would generate' };

  mkdirSync(path.dirname(specRel), { recursive: true });
  mkdirSync(runDir, { recursive: true });
  const prompt = buildPrompt(caseText, project, specRel);
  writeFileSync(`${runDir}/prompt.txt`, prompt);

  const summary = { ...base, spec: specRel };
  let input = prompt;
  let previousCode;
  let lastResult;

  try {
    for (let attempt = 1; attempt <= maxFixes + 1; attempt++) {
      console.log(`[${slug}] attempt ${attempt}: asking model…`);
      const { code, seconds, cost } = askModel(input, runDir, attempt);
      if (code.trim() === previousCode?.trim()) {
        // The model kept the test as is after seeing the failure: it considers the application wrong, not the test.
        summary.attempts.push({ attempt, seconds, costUsd: cost, stage: 'unchanged', passed: false, pageObjectTodos: 0 });
        console.log(`[${slug}] attempt ${attempt}: model returned the same code, stopping`);
        break;
      }
      previousCode = code;
      writeFileSync(specRel, code);
      writeFileSync(`${runDir}/attempt-${attempt}.spec.ts`, code);

      lastResult = check(specRel, project, runDir, attempt);
      const todos = (code.match(/TODO\(page-object\)/g) ?? []).length;
      summary.attempts.push({ attempt, seconds, costUsd: cost, stage: lastResult.stage, passed: lastResult.ok, pageObjectTodos: todos });
      console.log(`[${slug}] attempt ${attempt}: ${lastResult.stage} ${lastResult.ok ? 'PASSED' : 'FAILED'} (${seconds}s, TODO(page-object): ${todos})`);
      if (lastResult.ok) break;

      input = `${prompt}

YOUR PREVIOUS ANSWER:
\`\`\`ts
${code}
\`\`\`

IT FAILED AT ${lastResult.stage.toUpperCase()}:
${lastResult.log}

If the failure is a TypeScript or test-code error, fix the code. If the test failed because the application behaves
differently from "Очікуваний результат", that may be a real bug: keep the correct assertion and do NOT weaken it.
Answer with the full corrected file in exactly one \`\`\`ts code block.`;
    }
    summary.passed = summary.attempts.at(-1)?.passed ?? false;
    summary.status = summary.passed ? 'passed' : 'failed';
    summary.verdict = summary.passed ? 'passed' : verdictFor(lastResult);
  } catch (error) {
    summary.passed = false;
    summary.status = 'error';
    summary.verdict = `error: ${error.message}`;
  }

  // Only a passing spec stays in the pool; otherwise restore the reviewed version or remove the draft.
  if (!summary.passed) {
    if (previousSpec !== undefined) writeFileSync(specRel, previousSpec);
    else rmSync(specRel, { force: true });
    summary.inPool = previousSpec !== undefined ? 'previous version restored' : 'not added (see runs/)';
  } else {
    summary.inPool = 'added';
  }

  summary.costUsd = Number(summary.attempts.reduce((s, a) => s + (a.costUsd ?? 0), 0).toFixed(4));
  summary.seconds = summary.attempts.reduce((s, a) => s + (a.seconds ?? 0), 0);
  writeFileSync(`${runDir}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
  console.log(`[${slug}] ${summary.status.toUpperCase()} — ${summary.verdict}`);
  return summary;
}

// ---------- pool ----------
console.log(`Cases: ${cases.length}${force ? ' (--force)' : ''}${dryRun ? ' (--dry-run)' : ''}\n`);
const results = [];
for (const c of cases) {
  results.push(generateCase(c));
  console.log('');
}

const icon = { passed: '✅', failed: '❌', error: '⚠️', skipped: '⏭️', planned: '📝' };
const count = (s) => results.filter((r) => r.status === s).length;
const totalCost = results.reduce((s, r) => s + (r.costUsd ?? 0), 0);

console.log('Summary:');
for (const r of results) console.log(`  ${icon[r.status]} ${r.slug.padEnd(28)} ${r.status.padEnd(8)} ${r.verdict}`);
console.log(
  `\npassed ${count('passed')} · failed ${count('failed')} · error ${count('error')} · skipped ${count('skipped')}` +
    (dryRun ? ` · planned ${count('planned')}` : '') +
    ` · cost $${totalCost.toFixed(2)}`,
);

if (cases.length > 1 && !dryRun) {
  const md = [
    '# Генератор: останній прогін по пулу',
    '',
    `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · кейсів: ${cases.length} · вартість: $${totalCost.toFixed(2)}${force ? ' · `--force`' : ''}`,
    '',
    '| Кейс | Проєкт | Статус | Спроб | Час, с | Вартість | У пулі | Вердикт |',
    '|---|---|---|---|---|---|---|---|',
    ...results.map(
      (r) =>
        `| [${r.slug}](../cases/${path.basename(r.case)}) | ${r.project ?? '—'} | ${icon[r.status]} ${r.status} | ${r.attempts.length || '—'} | ${r.seconds ?? '—'} | ${r.costUsd !== undefined ? `$${r.costUsd.toFixed(2)}` : '—'} | ${r.inPool ?? '—'} | ${r.verdict} |`,
    ),
    '',
  ].join('\n');
  writeFileSync('generator/runs/batch-summary.md', md);
  console.log('→ generator/runs/batch-summary.md');
}

process.exit(results.some((r) => r.status === 'failed' || r.status === 'error') ? 1 : 0);
