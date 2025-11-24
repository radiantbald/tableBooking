import apiClient from './client';

export interface Desk {
  id: string;
  label: string;
  x: number;
  y: number;
  zone?: string;
  status: 'free' | 'booked' | 'my';
  bookedBy: string | null;
}

export interface DesksResponse {
  success: boolean;
  date: string;
  desks: Desk[];
  error?: string;
}

export const desksApi = {
  getDesks: async (date: string): Promise<DesksResponse> => {
    const response = await apiClient.get('/desks', { params: { date } });
    return response.data;
  },
};

