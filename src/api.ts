/**
 * Everything an API spec needs, in one import:
 *
 *   import { test, expect, meta, buildBooking } from '@api';
 */
export { test, expect, Bookings } from './fixtures/api';
export { meta, type Severity } from './support/meta';
export { API_CREDENTIALS, NON_EXISTENT_ID, buildBooking } from './data/bookings';
export type { Booking, BookingDates, CreateBookingResponse } from './api/BookingApi';
