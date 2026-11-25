import { test, expect } from '../../../src/fixtures/api';
import type { Booking, CreateBookingResponse } from '../../../src/api/BookingApi';
import { buildBooking } from '../../../src/data/bookings';

test.describe('Booking API — PATCH', () => {
  test(
    'PATCH /booking/:id updates only the sent fields and keeps the rest unchanged',
    { annotation: [{ type: 'severity', description: 'Medium' }] },
    async ({ bookingApi, token }) => {
      const original = buildBooking();
      const patch: Partial<Booking> = { firstname: 'Patched', totalprice: 777 };

      const created: CreateBookingResponse = await test.step('POST /booking — створити бронювання', async () => {
        const response = await bookingApi.createBooking(original);
        expect(response.status(), 'Бронювання створено → 200 OK').toBe(200);
        return response.json();
      });

      try {
        await test.step('PATCH /booking/{id} з токеном і тілом {"firstname": "Patched", "totalprice": 777}', async () => {
          const response = await bookingApi.partialUpdateBooking(created.bookingid, patch, token);
          expect(response.status(), 'Часткове оновлення з токеном → 200 OK').toBe(200);
          const body: Booking = await response.json();
          expect.soft(body.firstname, 'У відповіді firstname = "Patched"').toBe('Patched');
          expect.soft(body.totalprice, 'У відповіді totalprice = 777').toBe(777);
        });

        await test.step('GET /booking/{id}', async () => {
          const response = await bookingApi.getBooking(created.bookingid);
          expect(response.status(), 'Бронювання доступне → 200 OK').toBe(200);
          const body: Booking = await response.json();
          expect.soft(body.firstname, 'firstname змінився на "Patched"').toBe('Patched');
          expect.soft(body.totalprice, 'totalprice змінився на 777').toBe(777);
          expect.soft(body.lastname, 'lastname не змінився').toBe(original.lastname);
          expect.soft(body.depositpaid, 'depositpaid не змінився').toBe(original.depositpaid);
          expect.soft(body.bookingdates, 'bookingdates не змінились').toEqual(original.bookingdates);
          expect.soft(body.additionalneeds, 'additionalneeds не змінився').toBe(original.additionalneeds);
        });
      } finally {
        await bookingApi.deleteBooking(created.bookingid, token);
      }
    },
  );
});
