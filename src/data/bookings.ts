import { randomUUID } from 'node:crypto';
import type { Booking } from '../api/BookingApi';

// Public demo credentials from https://restful-booker.herokuapp.com/apidoc
export const API_CREDENTIALS = {
  username: process.env.BOOKER_USERNAME ?? 'admin',
  password: process.env.BOOKER_PASSWORD ?? 'password123',
} as const;

/** Builds a valid booking; unique lastname makes test data traceable on the shared server. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Autotest',
    lastname: `PW-${randomUUID().slice(0, 8)}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-15' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
