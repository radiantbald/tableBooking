import React, { useState } from 'react';
import { authApi } from '../api/auth';
import './LoginPage.css';

interface LoginPageProps {
  onCodeSent: (email: string, requestPromise: Promise<any>) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onCodeSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        setError(errorMessage);
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
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Отправка...' : 'Получить код'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

