import { test, expect } from '../../src/fixtures/api';
import type { Booking, CreateBookingResponse } from '../../src/api/BookingApi';
import { API_CREDENTIALS, buildBooking } from '../../src/data/bookings';

/** Large enough never to collide with a real booking on the shared server. */
const NON_EXISTENT_ID = 2_147_000_000;

test.describe('Booking API', () => {
  test('auth, create, update, delete, then booking is gone', async ({ bookingApi }) => {
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
      // 201 Created is the DOCUMENTED response (apidoc), even though 200/204 would match HTTP semantics.
      // Listed in README under "Задокументовано, але розходиться з HTTP-семантикою", not as a bug.
      expect(response.status(), 'DELETE returns the documented 201 Created').toBe(201);
    });

    await test.step('GET /booking/:id returns 404 after delete', async () => {
      const response = await bookingApi.getBooking(bookingId);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('negative @negative', () => {
    test(
      'POST /auth with wrong password returns 401 and no token',
      { annotation: [{ type: 'severity', description: 'Medium' }] },
      async ({ bookingApi }) => {
        const response = await test.step('POST /auth з username admin і невірним паролем', async () =>
          bookingApi.createToken(API_CREDENTIALS.username, 'wrong-password'),
        );

        await test.step('Перевірити відповідь', async () => {
          const body = await response.json();
          expect(body, 'Токен не видається').not.toHaveProperty('token');
          expect(response.status(), 'Невірні облікові дані → 401 Unauthorized').toBe(401);
        });
      },
    );

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
      const response = await bookingApi.getBooking(NON_EXISTENT_ID);

      expect(response.status()).toBe(404);
    });

    test(
      'PUT and DELETE for a non-existent id return 404',
      { annotation: [{ type: 'severity', description: 'Minor' }] },
      async ({ bookingApi, token }) => {
        await test.step(`PUT /booking/${NON_EXISTENT_ID} з валідним тілом і токеном`, async () => {
          const response = await bookingApi.updateBooking(NON_EXISTENT_ID, buildBooking(), token);
          expect.soft(response.status(), 'Метод PUT підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found').toBe(404);
        });

        await test.step(`DELETE /booking/${NON_EXISTENT_ID} з токеном`, async () => {
          const response = await bookingApi.deleteBooking(NON_EXISTENT_ID, token);
          expect.soft(response.status(), 'Метод DELETE підтримується; відсутній саме ресурс, тож коректна відповідь — 404 Not Found').toBe(404);
        });
      },
    );
  });

  test.describe('validation @negative', () => {
    const invalidPayloads: { title: string; severity: string; payload: () => unknown; step: string }[] = [
      {
        title: 'POST /booking without required fields returns 400',
        severity: 'Major',
        step: 'POST /booking з валідним бронюванням без поля firstname',
        payload: () => {
          const { firstname, ...rest } = buildBooking();
          return rest;
        },
      },
      {
        title: 'POST /booking with non-numeric totalprice returns 400',
        severity: 'Major',
        step: 'POST /booking з "totalprice": "abc"',
        payload: () => ({ ...buildBooking(), totalprice: 'abc' }),
      },
      {
        title: 'POST /booking with an invalid date returns 400',
        severity: 'Major',
        step: 'POST /booking з невалідним "checkin": "2027-13-45" (checkout валідний: "2027-01-10")',
        payload: () => buildBooking({ bookingdates: { checkin: '2027-13-45', checkout: '2027-01-10' } }),
      },
      {
        title: 'POST /booking with checkout before checkin returns 400',
        severity: 'Major',
        step: 'POST /booking з "checkin": "2027-01-15", "checkout": "2027-01-10"',
        payload: () => buildBooking({ bookingdates: { checkin: '2027-01-15', checkout: '2027-01-10' } }),
      },
      {
        title: 'POST /booking with negative totalprice returns 400',
        severity: 'Medium',
        step: 'POST /booking з "totalprice": -100',
        payload: () => buildBooking({ totalprice: -100 }),
      },
    ];

    for (const { title, severity, step, payload } of invalidPayloads) {
      test(title, { annotation: [{ type: 'severity', description: severity }] }, async ({ bookingApi, token }) => {
        const response = await test.step(step, async () => bookingApi.createBookingRaw(payload()));
        try {
          await test.step('Перевірити, що бронювання відхилено', async () => {
            expect(response.status(), 'Невалідні дані → 400 Bad Request, бронювання не створюється').toBe(400);
          });
        } finally {
          // The API may wrongly accept the payload — never leave garbage on the shared server.
          const body = await response.json().catch(() => null);
          if (body?.bookingid) await bookingApi.deleteBooking(body.bookingid, token);
        }
      });
    }
  });
});
