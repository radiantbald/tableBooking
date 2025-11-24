import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker';
import OfficeMap from './OfficeMap';
import { desksApi, Desk } from '../api/desks';
import './BookingPage.css';

const BookingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Устанавливаем сегодняшнюю дату по умолчанию
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    setSelectedDate(todayStr);
  }, []);

  // Загружаем столы при выборе даты
  useEffect(() => {
    if (selectedDate) {
      loadDesks(selectedDate);
    }
  }, [selectedDate]);

  const loadDesks = async (date: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await desksApi.getDesks(date);
      if (response.success) {
        setDesks(response.desks);
      } else {
        setError(response.error || 'Ошибка при загрузке столов');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleBookingSuccess = () => {
    if (selectedDate) {
      loadDesks(selectedDate);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div>
          <h1>Бронирование мест в офисе</h1>
          <p className="user-info">Вы вошли как: {user?.email}</p>
        </div>
        <button onClick={logout} className="logout-button">
          Выйти
        </button>
      </div>
      <div className="booking-content">
        <div className="booking-left">
          <DatePicker selectedDate={selectedDate} onDateSelect={handleDateSelect} />
          {loading && <div className="loading">Загрузка...</div>}
          {error && <div className="error-message">{error}</div>}
        </div>
        {selectedDate && desks.length > 0 && (
          <div className="booking-right">
            <div className="office-map-wrapper-container">
              <OfficeMap
                desks={desks}
                selectedDate={selectedDate}
                currentUserEmail={user?.email || ''}
                onBookingSuccess={handleBookingSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;

