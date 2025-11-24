import apiClient from './client';

export interface CreateBookingRequest {
  date: string;
  deskId: string;
}

export interface CheckBookingsRequest {
  dates: string[];
  deskId: string;
}

export interface CheckBookingsResponse {
  success: boolean;
  bookedDates?: string[];
  error?: string;
}

export interface CreateMultipleBookingsRequest {
  dates: string[];
  deskId: string;
}

export interface CreateMultipleBookingsResponse {
  success: boolean;
  createdDates?: string[];
  failedDates?: string[];
  error?: string;
}

export interface BookingResponse {
  success: boolean;
  error?: string;
}

export interface CancelAllBookingsResponse {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export interface Booking {
  id: number;
  date: string;
  created_at: string;
  desk_id: string;
  desk_label: string;
}

export interface GetMyBookingsResponse {
  success: boolean;
  bookings?: Booking[];
  error?: string;
}

export const bookingsApi = {
  createBooking: async (data: CreateBookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post('/bookings', data);
    return response.data;
  },
  cancelBooking: async (data: CreateBookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.delete('/bookings', { data });
    return response.data;
  },
  cancelAllBookings: async (): Promise<CancelAllBookingsResponse> => {
    const response = await apiClient.delete('/bookings/all');
    return response.data;
  },
  getMyBookings: async (): Promise<GetMyBookingsResponse> => {
    const response = await apiClient.get('/bookings/me');
    return response.data;
  },
  checkBookings: async (data: CheckBookingsRequest): Promise<CheckBookingsResponse> => {
    const response = await apiClient.post('/bookings/check', data);
    return response.data;
  },
  createMultipleBookings: async (data: CreateMultipleBookingsRequest): Promise<CreateMultipleBookingsResponse> => {
    const response = await apiClient.post('/bookings/multiple', data);
    return response.data;
  },
};

