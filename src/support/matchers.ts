import { expect as baseExpect, type APIResponse } from '@playwright/test';
import { toCents } from '../utils/price';

const money = (value: number): string => `$${value.toFixed(2)}`;

/**
 * Project matchers. Their messages keep the `Expected:` / `Received:` lines the bug reporter parses,
 * so a failure turns into a readable "expected / actual" in the bug report.
 */
export const expect = baseExpect.extend({
  /** HTTP status of an API response. On failure also shows the request URL and the response body. */
  async toHaveStatus(response: APIResponse, expected: number) {
    const actual = response.status();
    const pass = actual === expected;
    const body = pass === this.isNot ? (await response.text().catch(() => '')).slice(0, 300) : '';
    return {
      pass,
      name: 'toHaveStatus',
      expected,
      actual,
      message: () =>
        `expect(response).${this.isNot ? 'not.' : ''}toHaveStatus(expected)\n\n` +
        `Expected: ${this.isNot ? 'not ' : ''}${expected}\n` +
        `Received: ${actual}\n` +
        `Request:  ${response.url()}\n` +
        `Body:     ${body || '(empty)'}`,
    };
  },

  /** Money amount compared in cents (no float noise); the message shows dollars, not cents. */
  toEqualMoney(received: number, expected: number) {
    const pass = toCents(received) === toCents(expected);
    return {
      pass,
      name: 'toEqualMoney',
      expected,
      actual: received,
      message: () =>
        `expect(amount).${this.isNot ? 'not.' : ''}toEqualMoney(expected)\n\n` +
        `Expected: ${this.isNot ? 'not ' : ''}${money(expected)}\n` +
        `Received: ${money(received)}`,
    };
  },
});

/**
 * For checks where the app must NOT do something (e.g. "stays on /cart.html"): no reason to wait the full
 * expect timeout, the state is either there quickly or the bug is confirmed.
 */
export const expectQuick = expect.configure({ timeout: 3_000 });
