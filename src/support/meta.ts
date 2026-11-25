import type { TestDetails } from '@playwright/test';

export type Severity = 'Critical' | 'Major' | 'Medium' | 'Minor';

export interface MetaOptions {
  /** Shown in the bug report as "Передумова". */
  precondition?: string;
  /**
   * The test reveals a KNOWN product bug. Value = how the bug shows up in the failure: a substring of the assertion
   * error (usually its `Received` line), e.g. `'Received: 500'` or `'checkout-step-two.html'`.
   *
   * The test also gets the tag `@known-bug`: the regression run (`npm test`, CI step "Regression") excludes it,
   * the separate non-blocking run (`npm run test:known-bugs`) runs only such tests. In that run the bug reporter
   * marks a failure as "confirmed" when every error contains the signature, otherwise as a changed failure,
   * and a passed test as "probably fixed".
   */
  knownBug?: string;
}

/**
 * Test details read by the bug reporter (src/reporters/bug-report.ts):
 *
 *   meta('Major')
 *   meta('Major', 'Залогінений `standard_user`, кошик порожній.')
 *   meta('Major', { knownBug: 'Received: 500' })
 *   meta('Major', 'Залогінений `standard_user`, кошик порожній.', { knownBug: 'checkout-step-one.html' })
 */
export function meta(severity: Severity, precondition?: string | MetaOptions, options: MetaOptions = {}): TestDetails {
  const opts: MetaOptions = typeof precondition === 'string' ? { ...options, precondition } : { ...precondition, ...options };
  return {
    ...(opts.knownBug ? { tag: '@known-bug' } : {}),
    annotation: [
      { type: 'severity', description: severity },
      ...(opts.precondition ? [{ type: 'precondition', description: opts.precondition }] : []),
      ...(opts.knownBug ? [{ type: 'known-bug', description: opts.knownBug }] : []),
    ],
  };
}
