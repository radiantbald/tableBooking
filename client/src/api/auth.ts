import apiClient from './client';

export interface RequestCodeResponse {
  success: boolean;
  error?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface CheckAuthResponse {
  success: boolean;
  authenticated: boolean;
  token?: string;
  user?: {
    userId: number;
    email: string;
  };
}

export const authApi = {
  requestCode: async (email: string): Promise<RequestCodeResponse> => {
    const response = await apiClient.post('/auth/request-code', { email });
    return response.data;
  },

  verifyCode: async (email: string, code: string): Promise<VerifyCodeResponse> => {
    const response = await apiClient.post('/auth/verify-code', { email, code });
    return response.data;
  },

  checkAuth: async (): Promise<CheckAuthResponse> => {
    const response = await apiClient.get('/auth/check');
    return response.data;
  },

  logout: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};

