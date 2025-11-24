import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import VerifyCodePage from './components/VerifyCodePage';
import BookingPage from './components/BookingPage';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [requestPromise, setRequestPromise] = useState<Promise<any> | undefined>(undefined);

  // Сбрасываем состояние ввода кода при выходе из аккаунта
  useEffect(() => {
    if (!isAuthenticated) {
      setShowVerify(false);
      setEmail('');
      setRequestPromise(undefined);
    }
  }, [isAuthenticated]);

  const handleCodeSent = (userEmail: string, promise: Promise<any>) => {
    setEmail(userEmail);
    setRequestPromise(promise);
    setShowVerify(true);
  };

  const handleBack = () => {
    setShowVerify(false);
    setEmail('');
    setRequestPromise(undefined);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          showVerify ? (
            <VerifyCodePage email={email} onBack={handleBack} requestPromise={requestPromise} />
          ) : (
            <LoginPage onCodeSent={handleCodeSent} />
          )
        }
      />
      <Route
        path="/booking"
        element={
          <PrivateRoute>
            <BookingPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
