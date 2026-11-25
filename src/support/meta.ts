import type { TestDetails } from '@playwright/test';

export type Severity = 'Critical' | 'Major' | 'Medium' | 'Minor';

/**
 * Test details read by the bug reporter (src/reporters/bug-report.ts): severity and an optional precondition.
 *
 *   test('…', meta('Major', 'Залогінений `standard_user`, кошик порожній.'), async ({ … }) => { … });
 */
export function meta(severity: Severity, precondition?: string): TestDetails {
  return {
    annotation: [
      { type: 'severity', description: severity },
      ...(precondition ? [{ type: 'precondition', description: precondition }] : []),
    ],
  };
}
