import axios, { AxiosError } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Отправляем куки с каждым запросом
});

// Добавляем токен к каждому запросу
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок, включая 429 (Too Many Requests)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      let message = 'Слишком много запросов. Пожалуйста, подождите немного перед повторной попыткой.';
      
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          const minutes = Math.ceil(seconds / 60);
          message = `Слишком много запросов. Попробуйте снова через ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}.`;
        }
      } else {
        message = 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.';
      }
      
      // Улучшаем сообщение об ошибке для пользователя
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data = {
          ...error.response.data,
          error: message,
        };
      } else {
        error.response.data = { error: message };
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

