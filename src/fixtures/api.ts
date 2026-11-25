import { test as base, expect } from '@playwright/test';
import { BookingApi } from '../api/BookingApi';
import { API_CREDENTIALS } from '../data/bookings';

interface ApiFixtures {
  bookingApi: BookingApi;
  /** Valid auth token obtained via POST /auth. */
  token: string;
}

export const test = base.extend<ApiFixtures>({
  bookingApi: async ({ request }, use) => use(new BookingApi(request)),

  token: async ({ bookingApi }, use) => {
    const response = await bookingApi.createToken(API_CREDENTIALS.username, API_CREDENTIALS.password);
    expect(response.status()).toBe(200);
    const { token } = await response.json();
    expect(token, 'auth token should be returned').toBeTruthy();
    await use(token);
  },
});

export { expect };
