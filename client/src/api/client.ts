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
      const headers = error.response.headers;
      // Пробуем разные варианты заголовков
      const retryAfter = headers['retry-after'] || headers['Retry-After'];
      const rateLimitReset = headers['ratelimit-reset'] || headers['RateLimit-Reset'] || headers['x-ratelimit-reset'];
      
      let message = 'Слишком много запросов. Пожалуйста, подождите немного перед повторной попыткой.';
      let retryAfterSeconds: number | null = null;
      
      // Обрабатываем Retry-After (секунды до сброса)
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds) && seconds > 0) {
          retryAfterSeconds = seconds;
          const minutes = Math.ceil(seconds / 60);
          message = `Слишком много запросов. Попробуйте снова через ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}.`;
        }
      }
      // Обрабатываем RateLimit-Reset (Unix timestamp в секундах)
      else if (rateLimitReset) {
        const resetTimestamp = parseInt(rateLimitReset, 10);
        if (!isNaN(resetTimestamp) && resetTimestamp > 0) {
          const now = Math.floor(Date.now() / 1000);
          const seconds = Math.max(0, resetTimestamp - now);
          if (seconds > 0) {
            retryAfterSeconds = seconds;
            const minutes = Math.ceil(seconds / 60);
            message = `Слишком много запросов. Попробуйте снова через ${minutes} ${minutes === 1 ? 'минуту' : minutes < 5 ? 'минуты' : 'минут'}.`;
          }
        }
      }
      
      // Если заголовков нет, используем дефолтное значение 15 минут
      if (!retryAfterSeconds || retryAfterSeconds <= 0) {
        retryAfterSeconds = 15 * 60;
        message = 'Слишком много запросов. Пожалуйста, подождите 15 минут перед повторной попыткой.';
      }
      
      // Улучшаем сообщение об ошибке для пользователя и добавляем retryAfter
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data = {
          ...error.response.data,
          error: message,
          retryAfter: retryAfterSeconds,
        };
      } else {
        error.response.data = { error: message, retryAfter: retryAfterSeconds };
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

