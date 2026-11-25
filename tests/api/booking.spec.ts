import { test, expect } from '../../src/fixtures/api';
import type { Booking, CreateBookingResponse } from '../../src/api/BookingApi';
import { API_CREDENTIALS, buildBooking } from '../../src/data/bookings';

test.describe('Booking API', () => {
  test('auth -> create -> update -> delete -> booking is gone', async ({ bookingApi }) => {
    const token = await test.step('POST /auth returns a token', async () => {
      const response = await bookingApi.createToken(API_CREDENTIALS.username, API_CREDENTIALS.password);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.token).toEqual(expect.any(String));
      return body.token as string;
    });

    const original = buildBooking();
    const bookingId = await test.step('POST /booking creates a booking', async () => {
      const response = await bookingApi.createBooking(original);
      expect(response.status()).toBe(200);
      const body: CreateBookingResponse = await response.json();
      expect(body.bookingid).toEqual(expect.any(Number));
      expect(body.booking).toEqual(original);
      return body.bookingid;
    });

    await test.step('GET /booking/:id returns the created booking', async () => {
      const response = await bookingApi.getBooking(bookingId);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(original);
    });

    const updated: Booking = {
      ...original,
      firstname: 'Updated',
      totalprice: 999,
      depositpaid: false,
      bookingdates: { checkin: '2027-02-01', checkout: '2027-02-03' },
      additionalneeds: 'Late checkout',
    };

    await test.step('PUT /booking/:id updates the booking', async () => {
      const response = await bookingApi.updateBooking(bookingId, updated, token);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('GET /booking/:id reflects the update', async () => {
      const response = await bookingApi.getBooking(bookingId);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('DELETE /booking/:id removes the booking', async () => {
      const response = await bookingApi.deleteBooking(bookingId, token);
      // Restful Booker returns 201 Created on successful delete (documented quirk).
      expect(response.status()).toBe(201);
    });

    await test.step('GET /booking/:id returns 404 after delete', async () => {
      const response = await bookingApi.getBooking(bookingId);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('negative @negative', () => {
    test('POST /auth with wrong password returns "Bad credentials" and no token', async ({ bookingApi }) => {
      const response = await bookingApi.createToken(API_CREDENTIALS.username, 'wrong-password');

      // API responds 200 even for bad credentials — the failure is signalled in the body.
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ reason: 'Bad credentials' });
      expect(body).not.toHaveProperty('token');
    });

    test('PUT /booking/:id without token is forbidden and does not change data', async ({ bookingApi, token }) => {
      const original = buildBooking();
      const created: CreateBookingResponse = await (await bookingApi.createBooking(original)).json();

      try {
        const response = await bookingApi.updateBooking(created.bookingid, { ...original, firstname: 'Hacker' });
        expect(response.status()).toBe(403);

        const current = await bookingApi.getBooking(created.bookingid);
        expect(await current.json()).toEqual(original);
      } finally {
        await bookingApi.deleteBooking(created.bookingid, token);
      }
    });

    test('GET /booking/:id for a non-existent id returns 404', async ({ bookingApi }) => {
      const response = await bookingApi.getBooking(2_147_000_000);

      expect(response.status()).toBe(404);
    });
  });
});
