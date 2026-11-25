import { type APIRequestContext, type APIResponse } from '@playwright/test';

export interface BookingDates {
  checkin: string; // YYYY-MM-DD
  checkout: string; // YYYY-MM-DD
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface CreateBookingResponse {
  bookingid: number;
  booking: Booking;
}

/** Thin wrapper over https://restful-booker.herokuapp.com/apidoc */
export class BookingApi {
  constructor(private readonly request: APIRequestContext) {}

  createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  createBooking(booking: Booking): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking });
  }

  /** Sends an arbitrary (possibly invalid) payload — for validation / negative tests. */
  createBookingRaw(payload: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: payload });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  updateBooking(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: authHeader(token) });
  }

  partialUpdateBooking(id: number, patch: Partial<Booking>, token?: string): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: patch, headers: authHeader(token) });
  }

  deleteBooking(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: authHeader(token) });
  }
}

function authHeader(token?: string): Record<string, string> {
  return token ? { Cookie: `token=${token}` } : {};
}
