import type { TestDetails } from '@playwright/test';

export type Severity = 'Critical' | 'Major' | 'Medium' | 'Minor';

export interface MetaOptions {
  /** Shown in the bug report as "Передумова". */
  precondition?: string;
  /**
   * The test reveals a KNOWN product bug. Value = how the bug shows up in the failure: a substring of the assertion
   * error (usually its `Received` line), e.g. `'Received: 500'` or `'checkout-step-two.html'`.
   *
   * The bug reporter then sorts every run into:
   * - confirmed known bug — the test failed and EVERY error contains the signature → does not fail the run;
   * - new failure — failed differently (other status, timeout, broken locator…) → fails the run;
   * - probably fixed — the test passed → fails the run, so the bug gets closed and `knownBug` removed.
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
    annotation: [
      { type: 'severity', description: severity },
      ...(opts.precondition ? [{ type: 'precondition', description: opts.precondition }] : []),
      ...(opts.knownBug ? [{ type: 'known-bug', description: opts.knownBug }] : []),
    ],
  };
}
