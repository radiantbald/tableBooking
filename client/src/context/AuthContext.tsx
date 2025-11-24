import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../api/auth';

interface User {
  userId: number;
  email: string;
}

// Интерфейс для декодированного JWT токена (включает стандартные поля JWT)
interface DecodedToken extends User {
  exp?: number; // Время истечения токена (Unix timestamp)
  iat?: number; // Время выдачи токена (Unix timestamp)
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // При инициализации проверяем localStorage
  // Токен из httpOnly cookie недоступен через JavaScript, но отправляется автоматически браузером
  const getInitialToken = (): string | null => {
    return localStorage.getItem('token');
  };

  const initialToken = getInitialToken();
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<User | null>(() => {
    // Устанавливаем пользователя сразу при инициализации, если есть токен
    if (initialToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(initialToken);
        // Проверяем, не истек ли токен
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          return null;
        }
        // Возвращаем только данные пользователя без полей JWT
        return { userId: decoded.userId, email: decoded.email };
      } catch (error) {
        return null;
      }
    }
    return null;
  });

  const logout = useCallback(async () => {
    try {
      // Удаляем куку на сервере
      await authApi.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    // Удаляем куку на клиенте (на всякий случай)
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }, []);

  // Проверяем авторизацию на сервере в фоне при загрузке
  useEffect(() => {
    if (token) {
      // Проверяем токен на сервере в фоне для синхронизации
      // Сервер проверит токен из httpOnly cookie или Authorization header
      authApi.checkAuth().then((response) => {
        if (response.success && response.authenticated && response.token) {
          // Обновляем токен, если сервер вернул новый
          if (response.token !== token) {
            setToken(response.token);
            localStorage.setItem('token', response.token);
          }
          if (response.user) {
            setUser(response.user);
          }
        } else {
          // Токен недействителен на сервере
          logout();
        }
      }).catch((error) => {
        // Ошибка сети - не критично, токен уже установлен локально
        // Проверка будет происходить при каждом запросе через middleware
        console.warn('Не удалось проверить авторизацию на сервере:', error);
      });
    } else {
      // Если токена нет в localStorage, проверяем на сервере (может быть в httpOnly cookie)
      authApi.checkAuth().then((response) => {
        if (response.success && response.authenticated && response.token) {
          setToken(response.token);
          localStorage.setItem('token', response.token);
          if (response.user) {
            setUser(response.user);
          }
        }
      }).catch((error) => {
        // Игнорируем ошибки при проверке
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняем только при монтировании

  useEffect(() => {
    if (token && !user) {
      // Устанавливаем пользователя только если его еще нет
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        // Проверяем, не истек ли токен
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Токен истек');
          logout();
          return;
        }
        setUser({ userId: decoded.userId, email: decoded.email });
      } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        logout();
      }
    } else if (token && user) {
      // Если токен изменился, обновляем пользователя
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('Токен истек');
          logout();
          return;
        }
        // Обновляем пользователя только если данные изменились
        if (decoded.userId !== user.userId || decoded.email !== user.email) {
          setUser({ userId: decoded.userId, email: decoded.email });
        }
      } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        logout();
      }
    }
  }, [token, user, logout]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Кука уже установлена сервером, но на всякий случай сохраняем токен
    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      setUser({ userId: decoded.userId, email: decoded.email });
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

