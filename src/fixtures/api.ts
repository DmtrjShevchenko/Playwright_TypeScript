import { test as base, type APIResponse } from '@playwright/test';
import { expect } from '../support/matchers';
import { BookingApi, type Booking, type CreateBookingResponse } from '../api/BookingApi';
import { API_CREDENTIALS, buildBooking } from '../data/bookings';

/**
 * Creates bookings for a test and deletes every one of them after the test — even if it failed,
 * and even if the API wrongly accepted an invalid payload. Nothing is left on the shared sandbox.
 */
export class Bookings {
  private readonly ids = new Set<number>();

  constructor(private readonly api: BookingApi) {}

  /** Creates a valid booking (fields can be overridden) and checks it was accepted. */
  async create(overrides: Partial<Booking> = {}): Promise<{ id: number; booking: Booking }> {
    const booking = buildBooking(overrides);
    const response = await this.api.createBooking(booking);
    await expect(response, 'Бронювання створено → 200 OK').toHaveStatus(200);
    const { bookingid }: CreateBookingResponse = await response.json();
    this.ids.add(bookingid);
    return { id: bookingid, booking };
  }

  /** Sends any (possibly invalid) payload; if the API creates a booking anyway, it is still cleaned up. */
  async createRaw(payload: unknown): Promise<APIResponse> {
    const response = await this.api.createBookingRaw(payload);
    this.trackResponse(await response.json().catch(() => null));
    return response;
  }

  /** Registers a booking created elsewhere (e.g. directly via BookingApi) for cleanup. */
  track(id: number): void {
    this.ids.add(id);
  }

  async cleanup(token: string): Promise<void> {
    // Already deleted by the test → the API answers 405; that is fine here.
    for (const id of this.ids) await this.api.deleteBooking(id, token).catch(() => undefined);
  }

  private trackResponse(body: { bookingid?: number } | null): void {
    if (body?.bookingid) this.ids.add(body.bookingid);
  }
}

interface ApiFixtures {
  bookingApi: BookingApi;
  /** Valid auth token obtained via POST /auth. */
  token: string;
  /** Bookings created through it are deleted after the test. */
  bookings: Bookings;
}

export const test = base.extend<ApiFixtures>({
  bookingApi: async ({ request }, use) => use(new BookingApi(request)),

  token: async ({ bookingApi }, use) => {
    const response = await bookingApi.createToken(API_CREDENTIALS.username, API_CREDENTIALS.password);
    await expect(response, 'Авторизація для фікстури').toHaveStatus(200);
    const { token } = await response.json();
    expect(token, 'auth token should be returned').toBeTruthy();
    await use(token);
  },

  bookings: async ({ bookingApi, token }, use) => {
    const bookings = new Bookings(bookingApi);
    await use(bookings);
    await bookings.cleanup(token);
  },
});

export { expect };
