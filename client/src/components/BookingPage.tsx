import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker';
import OfficeMap from './OfficeMap';
import { desksApi, Desk } from '../api/desks';
import { bookingsApi, Booking } from '../api/bookings';
import './BookingPage.css';

const BookingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasBookings, setHasBookings] = useState(false);
  const [showBookingsList, setShowBookingsList] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

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

  // Проверяем наличие бронирований пользователя
  const checkUserBookings = async () => {
    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success && response.bookings) {
        setHasBookings(response.bookings.length > 0);
      }
    } catch (err) {
      // Игнорируем ошибки при проверке бронирований
      console.error('Ошибка при проверке бронирований:', err);
    }
  };

  // Проверяем бронирования при монтировании компонента
  useEffect(() => {
    checkUserBookings();
  }, []);

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

  const handleBookingSuccess = (newDate?: string) => {
    // Если передана новая дата, обновляем выбранную дату
    if (newDate) {
      setSelectedDate(newDate);
    } else if (selectedDate) {
      loadDesks(selectedDate);
    }
    // Обновляем статус бронирований после успешного бронирования
    checkUserBookings();
  };

  const handleCancelAllBookings = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить все ваши бронирования?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await bookingsApi.cancelAllBookings();
      if (response.success) {
        alert(`Отменено бронирований: ${response.deletedCount || 0}`);
        setHasBookings(false);
        setBookings([]);
        if (selectedDate) {
          loadDesks(selectedDate);
        }
      } else {
        setError(response.error || 'Ошибка при отмене бронирований');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleShowBookings = async () => {
    setShowBookingsList(true);
    setLoadingBookings(true);
    try {
      const response = await bookingsApi.getMyBookings();
      if (response.success && response.bookings) {
        // Сортируем бронирования по возрастанию даты (сверху вниз)
        const sortedBookings = [...response.bookings].sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
        setBookings(sortedBookings);
      } else {
        setError(response.error || 'Ошибка при загрузке бронирований');
        setBookings([]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
      setError(errorMessage);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Парсим дату в формате YYYY-MM-DD, избегая проблем с часовыми поясами
    // Убираем время и пробелы, если есть
    const dateStr = dateString.split('T')[0].split(' ')[0].trim();
    
    // Проверяем формат YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn('Неожиданный формат даты:', dateString);
      return dateString; // Возвращаем как есть, если формат неправильный
    }
    
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  };

  const getWeekday = (dateString: string) => {
    // Парсим дату в формате YYYY-MM-DD, избегая проблем с часовыми поясами
    const dateStr = dateString.split('T')[0].split(' ')[0].trim();
    
    // Проверяем формат YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return '';
    }
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return weekdays[date.getDay()];
  };

  const handleCloseBookingsList = () => {
    setShowBookingsList(false);
    setBookings([]);
  };

  const handleBookingItemClick = (booking: Booking) => {
    // Нормализуем дату в формате YYYY-MM-DD (убираем время, если есть)
    // Берем только часть до 'T' или до пробела, чтобы получить YYYY-MM-DD
    let normalizedDate = booking.date.split('T')[0].split(' ')[0];
    
    // Проверяем, что дата в правильном формате YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      // Если формат неправильный, пытаемся распарсить через Date и переформатировать
      const dateParts = normalizedDate.split('-');
      if (dateParts.length === 3) {
        const [year, month, day] = dateParts.map(Number);
        normalizedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    // Устанавливаем дату из бронирования
    setSelectedDate(normalizedDate);
    // Закрываем модальное окно
    setShowBookingsList(false);
    // Очищаем список бронирований (опционально, можно оставить для быстрого доступа)
    // setBookings([]);
  };

  const handleCancelBooking = async (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие события клика
    
    if (!window.confirm(`Вы уверены, что хотите отменить бронирование стола "${booking.desk_label}" на ${formatDate(booking.date)}?`)) {
      return;
    }

    setLoadingBookings(true);
    setError('');
    try {
      // Нормализуем дату в формате YYYY-MM-DD
      let normalizedDate = booking.date.split('T')[0].split(' ')[0].trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        const dateParts = normalizedDate.split('-');
        if (dateParts.length === 3) {
          const [year, month, day] = dateParts.map(Number);
          normalizedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      const response = await bookingsApi.cancelBooking({
        date: normalizedDate,
        deskId: booking.desk_id
      });

      if (response.success) {
        // Удаляем бронирование из списка
        const updatedBookings = bookings.filter(b => b.id !== booking.id);
        setBookings(updatedBookings);
        // Обновляем статус наличия бронирований
        if (updatedBookings.length === 0) {
          setHasBookings(false);
        }
        // Обновляем статус бронирований
        checkUserBookings();
        // Обновляем столы на текущей дате, если она совпадает с отмененной
        if (selectedDate === normalizedDate) {
          loadDesks(selectedDate);
        }
      } else {
        setError(response.error || 'Ошибка при отмене бронирования');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Ошибка сервера';
      setError(errorMessage);
    } finally {
      setLoadingBookings(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div>
          <h1>Бронирование мест в офисе</h1>
          <p className="user-info">
            Вы вошли как: {user?.email}
            <button onClick={handleShowBookings} className="show-bookings-button">
              Мои бронирования
            </button>
          </p>
        </div>
        <div className="booking-header-buttons">
          <button onClick={logout} className="logout-button">
            Выйти
          </button>
        </div>
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
                onError={setError}
              />
            </div>
          </div>
        )}
      </div>
      
      {showBookingsList && (
        <div className="bookings-modal-overlay" onClick={handleCloseBookingsList}>
          <div className="bookings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bookings-modal-header">
              <div className="bookings-modal-header-top">
                <h2>Мои бронирования</h2>
                <button className="bookings-modal-close" onClick={handleCloseBookingsList}>
                  ×
                </button>
              </div>
              {hasBookings && (
                <button onClick={handleCancelAllBookings} className="cancel-all-button">
                  Отменить все бронирования
                </button>
              )}
            </div>
            <div className="bookings-modal-content">
              {loadingBookings ? (
                <div className="loading">Загрузка...</div>
              ) : bookings.length === 0 ? (
                <div className="no-bookings">У вас нет активных бронирований</div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="booking-item"
                      onClick={() => handleBookingItemClick(booking)}
                    >
                      <div className="booking-item-info">
                        <div className="booking-date">
                          <span className="booking-weekday">{getWeekday(booking.date)}</span>
                          {' '}
                          {formatDate(booking.date)}
                        </div>
                        <div className="booking-desk">{booking.desk_label}</div>
                      </div>
                      <button
                        className="cancel-booking-button"
                        onClick={(e) => handleCancelBooking(booking, e)}
                        title="Отменить бронирование"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;

