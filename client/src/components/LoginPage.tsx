import React, { useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import { useCountdown } from '../hooks/useCountdown';
import './LoginPage.css';

interface LoginPageProps {
  onCodeSent: (email: string, requestPromise: Promise<any>) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onCodeSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { formattedTime, isActive, start, reset } = useCountdown();

  useEffect(() => {
    // Сбрасываем таймер при изменении ошибки
    if (!error || !error.includes('Слишком много запросов')) {
      reset();
    }
  }, [error, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    reset();

    if (!email.endsWith('@rwb.ru')) {
      setError('Доступ разрешён только для корпоративной почты @rwb.ru');
      return;
    }

    setLoading(true);
    // Сразу переключаемся на страницу ввода кода, не дожидаясь ответа
    const requestPromise = authApi.requestCode(email)
      .then((response) => {
        setLoading(false);
        if (!response.success) {
          throw new Error(response.error || 'Ошибка при отправке кода');
        }
        return response;
      })
      .catch((err: any) => {
        setLoading(false);
        const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
        const retryAfter = err.response?.data?.retryAfter;
        
        setError(errorMessage);
        
        // Запускаем таймер, если есть retryAfter
        if (retryAfter && typeof retryAfter === 'number' && retryAfter > 0) {
          start(retryAfter);
        }
        
        throw new Error(errorMessage);
      });
    
    onCodeSent(email, requestPromise);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Бронирование мест в офисе</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@rwb.ru"
              required
              disabled={loading}
            />
          </div>
          {error && (
            <div className="error-message">
              <div>{error}</div>
              {isActive && (
                <div className="countdown-timer">
                  Повторная попытка будет доступна через: <strong>{formattedTime}</strong>
                </div>
              )}
            </div>
          )}
          <button type="submit" disabled={loading || isActive} className="submit-button">
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

