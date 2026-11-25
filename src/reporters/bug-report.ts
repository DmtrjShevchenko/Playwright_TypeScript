import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, Reporter, Suite, TestCase, TestError, TestResult } from '@playwright/test/reporter';

/**
 * Generates bug reports (Markdown) from failed tests.
 *
 * - Steps        → titles of `test.step(...)` calls; the failed step is marked.
 * - Expected     → custom assertion message (`expect(x, '<expected behaviour>')`) + "Expected:" line of the error.
 * - Actual       → "Received:" line of the error.
 * - Severity     → annotation `{ type: 'severity', description: 'Major' }`.
 * - Precondition → annotation `{ type: 'precondition', description: '...' }`.
 *
 * Only final outcomes count: a test that passed on retry (flaky) is not reported as a bug.
 * On GitHub Actions the same Markdown is appended to the job summary.
 */
interface Options {
  outputFile?: string;
}

const ANSI = /\u001b\[[0-9;]*m/g;
const SEVERITY_ORDER = ['Critical', 'Major', 'Medium', 'Minor'];

const clean = (text = ''): string => text.replace(ANSI, '').trim();
const stripTags = (title: string): string => title.replace(/\s+@[\w-]+/g, '').trim();
const annotation = (test: TestCase, type: string): string | undefined =>
  test.annotations.find((a) => a.type === type)?.description;

/**
 * A failed test is not automatically a product bug. These signatures point to the environment
 * or to the test itself — such failures go to "Потребує тріажу" instead of the bug list.
 */
const TRIAGE_RULES: { reason: string; pattern: RegExp }[] = [
  { reason: 'мережа / недоступність сервісу', pattern: /ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|socket hang up|net::ERR_/i },
  { reason: 'сервіс недоступний (502/503/504)', pattern: /Received:\s*(502|503|504)\b/ },
  { reason: 'таймаут тесту', pattern: /Test timeout of \d+ms exceeded/i },
  { reason: 'дефект тесту: неоднозначний локатор', pattern: /strict mode violation/i },
  { reason: 'дефект тесту: помилка в коді тесту', pattern: /\b(TypeError|ReferenceError|SyntaxError)\b/ },
  { reason: 'браузер або контекст закрився', pattern: /Target page, context or browser has been closed|Browser closed/i },
];

function triageReason(test: TestCase): string | undefined {
  const text = (test.results.at(-1)?.errors ?? []).map((e) => clean(e.message ?? e.value)).join('\n');
  return TRIAGE_RULES.find((r) => r.pattern.test(text))?.reason;
}

interface ParsedError {
  message?: string;
  expected?: string;
  received?: string;
  raw: string;
}

function parseError(error: TestError): ParsedError {
  const raw = clean(error.message ?? error.value ?? 'Unknown error');
  const lines = raw.split('\n').map((l) => l.trim());
  const first = lines[0].replace(/^Error:\s*/, '');
  return {
    // Custom message is the first line, unless Playwright put its own matcher text there.
    message: first && !/^(expect|locator|Timed out|Test timeout)/i.test(first) ? first : undefined,
    expected: lines.find((l) => /^Expected\b/.test(l)),
    // Visibility/locator matchers have no "Received:" line — they report "element(s) not found".
    received:
      lines.find((l) => /^Received\b/.test(l)) ??
      lines.find((l) => /element\(s\) not found/i.test(l))?.replace(/^Error:\s*/, 'Received: '),
    raw,
  };
}

export default class BugReportReporter implements Reporter {
  private readonly outputFile: string;
  private config!: FullConfig;
  private suite!: Suite;

  constructor(options: Options = {}) {
    this.outputFile = options.outputFile ?? 'bug-reports/BUGS.md';
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
  }

  onEnd(): void {
    // `--list` or an interrupted run executes nothing — keep the previous report.
    if (!this.suite.allTests().some((t) => t.results.length > 0)) return;

    const failed = this.suite
      .allTests()
      .filter((t) => t.outcome() === 'unexpected')
      .sort((a, b) => {
        const sa = SEVERITY_ORDER.indexOf(annotation(a, 'severity') ?? '');
        const sb = SEVERITY_ORDER.indexOf(annotation(b, 'severity') ?? '');
        return (sa === -1 ? 99 : sa) - (sb === -1 ? 99 : sb) || this.location(a).localeCompare(this.location(b));
      });

    const bugs = failed.filter((t) => !triageReason(t));
    const triage = failed.filter((t) => triageReason(t));

    const markdown = this.render(bugs, triage);
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, markdown, 'utf8');
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

    console.log(`\nBug reports: ${bugs.length}, needs triage: ${triage.length} → ${this.outputFile}`);
  }

  private location(test: TestCase): string {
    const file = path.relative(process.cwd(), test.location.file).replace(/\\/g, '/');
    return `${file}:${test.location.line}`;
  }

  private render(failed: TestCase[], triage: TestCase[]): string {
    const out: string[] = [];
    const runUrl = process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : undefined;

    out.push('# Баг-репорти', '');
    out.push(
      `> Згенеровано автоматично з упалих автотестів (\`src/reporters/bug-report.ts\`) · ${new Date().toISOString().slice(0, 10)}` +
        (runUrl ? ` · [CI run](${runUrl})` : ' · локальний прогін'),
      '',
    );

    out.push(
      '> Кожне падіння — це **кандидат** у баги. Падіння з ознаками проблеми оточення або самого тесту',
      '> (мережа, 502/503/504, таймаут, неоднозначний локатор, помилка в коді тесту) винесено в розділ «Потребує тріажу».',
      '> Решту людина підтверджує перед тим, як заводити баг у трекер.',
      '',
    );

    if (triage.length) {
      out.push('## Потребує тріажу', '', '| Автотест | Причина | Помилка |', '|---|---|---|');
      for (const test of triage) {
        const firstLine = clean(test.results.at(-1)?.errors[0]?.message).split('\n')[0].replace(/\|/g, '\\|').slice(0, 120);
        out.push(`| \`${this.location(test)}\` › ${stripTags(test.title)} | ${triageReason(test)} | ${firstLine} |`);
      }
      out.push('');
    }

    if (failed.length === 0) {
      out.push('Падінь, схожих на баги продукту, немає.', '');
      return out.join('\n');
    }

    out.push('## Баги', '');
    out.push('| ID | Система | Баг | Серйозність | Автотест |', '|---|---|---|---|---|');
    failed.forEach((test, i) => {
      out.push(
        `| [BUG-${String(i + 1).padStart(2, '0')}](#bug-${String(i + 1).padStart(2, '0')}) | ${this.projectName(test)} | ${this.bugTitle(test)} | ${annotation(test, 'severity') ?? '—'} | \`${this.location(test)}\` |`,
      );
    });
    out.push('');

    failed.forEach((test, i) => out.push(...this.renderBug(test, `BUG-${String(i + 1).padStart(2, '0')}`)));
    return out.join('\n');
  }

  private projectName(test: TestCase): string {
    return test.parent.project()?.name ?? '—';
  }

  /** Test title states the expected behaviour; append what actually happened. */
  private bugTitle(test: TestCase): string {
    const title = stripTags(test.title);
    const received = [
      ...new Set(
        (test.results.at(-1)?.errors ?? [])
          .map((e) => parseError(e).received?.replace(/^Received(\s+\w+)?:\s*/, '').trim())
          .filter(Boolean),
      ),
    ].join(', ');
    return received ? `${title} — фактично: ${received.slice(0, 100)}` : title;
  }

  private renderBug(test: TestCase, id: string): string[] {
    const result = test.results.at(-1) as TestResult;
    const project = test.parent.project();
    const out: string[] = [];

    out.push('---', '', `### ${id}`, `**${this.bugTitle(test)}**`, '');
    out.push('| | |', '|---|---|');
    out.push(`| Серйозність | ${annotation(test, 'severity') ?? 'не визначено'} |`);
    out.push(`| Система | ${project?.use.baseURL ?? '—'} |`);
    if (project?.use.browserName || project?.use.defaultBrowserType)
      out.push(`| Браузер | ${project.use.browserName ?? project.use.defaultBrowserType} |`);
    out.push(`| Автотест | \`${this.location(test)}\` › ${stripTags(test.title)} |`);
    out.push(`| Спроб | ${test.results.length} (впав у всіх) |`, '');

    const precondition = annotation(test, 'precondition');
    if (precondition) out.push(`**Передумова:** ${precondition}`, '');

    const steps = result.steps.filter((s) => s.category === 'test.step');
    out.push('**Кроки:**');
    if (steps.length === 0) out.push('1. Див. автотест.');
    steps.forEach((s, i) => out.push(`${i + 1}. ${s.title}${s.error ? ' ❌' : ''}`));
    out.push('');

    const errors = result.errors.map(parseError);
    const expected = errors.map((e) => [e.message, e.expected].filter(Boolean).join(' — ')).filter(Boolean);
    const received = errors.map((e) => e.received).filter(Boolean);

    out.push('**Очікуваний результат:**', ...(expected.length ? expected.map((e) => `- ${e}`) : ['- див. помилку нижче']), '');
    out.push('**Фактичний результат:**', ...(received.length ? received.map((r) => `- ${r}`) : ['- див. помилку нижче']), '');

    out.push('<details><summary>Помилка</summary>', '', '```', errors.map((e) => e.raw).join('\n\n').slice(0, 3000), '```', '', '</details>', '');

    const files = result.attachments.filter((a) => a.path && /screenshot|trace/.test(a.name));
    if (files.length) {
      out.push('**Вкладення:** ' + files.map((a) => `\`${path.relative(process.cwd(), a.path!).replace(/\\/g, '/')}\``).join(', '), '');
    }
    return out;
  }
}
