import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useCountdown } from '../hooks/useCountdown';
import './VerifyCodePage.css';

interface VerifyCodePageProps {
  email: string;
  onBack: () => void;
  requestPromise?: Promise<any>;
}

const VerifyCodePage: React.FC<VerifyCodePageProps> = ({ email, onBack, requestPromise }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeSending, setCodeSending] = useState(true);
  const [codeSent, setCodeSent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { formattedTime, isActive, start, reset } = useCountdown();

  useEffect(() => {
    if (requestPromise) {
      requestPromise
        .then(() => {
          setCodeSending(false);
          setCodeSent(true);
          reset();
        })
        .catch((err: any) => {
          setCodeSending(false);
          setCodeSent(false);
          const errorMessage = err.response?.data?.error || err.message || 'Ошибка при отправке кода';
          const retryAfter = err.response?.data?.retryAfter;
          setError(errorMessage);
          
          // Запускаем таймер, если есть retryAfter
          if (retryAfter && typeof retryAfter === 'number' && retryAfter > 0) {
            start(retryAfter);
          }
        });
    } else {
      // Если промис не передан, считаем что код уже отправлен
      setCodeSending(false);
      setCodeSent(true);
    }
  }, [requestPromise, reset, start]);
  
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

    if (code.length !== 6) {
      setError('Код должен состоять из 6 цифр');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyCode(email, code);
      if (response.success && response.token) {
        login(response.token);
        navigate('/booking');
      } else {
        setError(response.error || 'Неверный код');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
      const retryAfter = err.response?.data?.retryAfter;
      setError(errorMessage);
      
      // Запускаем таймер, если есть retryAfter
      if (retryAfter && typeof retryAfter === 'number' && retryAfter > 0) {
        start(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <h1>Введите код подтверждения</h1>
        <p className="email-hint">
          {codeSending ? `Отправляем код на ${email}` : codeSent ? `Код отправлен на ${email}` : `Ошибка отправки кода на ${email}`}
        </p>
        {codeSending ? (
          <div className="loading-animation">
            <img src="/images/loading.gif" alt="Загрузка" className="loading-gif" />
          </div>
        ) : codeSent ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="code">Код</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                disabled={loading}
                className="code-input"
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
            <div className="button-group">
              <button type="button" onClick={onBack} className="back-button">
                Назад
              </button>
              <button type="submit" disabled={loading || isActive} className="submit-button">
                {loading ? 'Проверка...' : 'Войти'}
              </button>
            </div>
          </form>
        ) : (
          <div className="button-group">
            <button type="button" onClick={onBack} className="back-button">
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCodePage;

