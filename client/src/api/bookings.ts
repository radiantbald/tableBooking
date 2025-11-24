import apiClient from './client';

export interface CreateBookingRequest {
  date: string;
  deskId: string;
}

export interface BookingResponse {
  success: boolean;
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
};

