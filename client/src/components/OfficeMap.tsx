import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Desk } from '../api/desks';
import { BASE_OFFICE_WIDTH, BASE_OFFICE_HEIGHT } from '../types/deskTypes';
import { useOfficeScale } from '../hooks/useOfficeScale';
import { DeskPositioningService } from '../services/deskPositioningService';
import { BookingService } from '../services/bookingService';
import { DateUtils } from '../utils/dateUtils';
import { WeekUtils } from '../utils/weekUtils';
import DeskItem from './DeskItem';
import AttendeesList from './AttendeesList';
import WeekCalendar from './WeekCalendar';
import './OfficeMap.css';

interface OfficeMapProps {
  desks: Desk[];
  selectedDate: string;
  currentUserEmail: string;
  onBookingSuccess: (newDate?: string) => void;
}

/**
 * Компонент карты офиса
 * Принцип Single Responsibility: координирует работу подкомпонентов и сервисов
 */
const OfficeMap: React.FC<OfficeMapProps> = ({
  desks,
  selectedDate,
  currentUserEmail,
  onBookingSuccess,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [selectedDeskForWeek, setSelectedDeskForWeek] = useState<Desk | null>(null);
  const [animationDelays, setAnimationDelays] = useState<number[]>([]);
  const [animationKey, setAnimationKey] = useState<string>('');
  const [hoveredAttendeeEmail, setHoveredAttendeeEmail] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const scale = useOfficeScale(mapContainerRef);

  // Инициализация при монтировании
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Генерируем случайные задержки при изменении даты или количества столов
  useEffect(() => {
    if (desks.length > 0) {
      // Генерируем новый ключ для принудительного пересоздания компонентов
      setAnimationKey(Math.random().toString(36).substring(2, 9));
      
      // Создаем массив последовательных задержек
      const maxDelay = Math.min(0.15, desks.length * 0.015);
      const delays: number[] = [];
      for (let i = 0; i < desks.length; i++) {
        delays.push((i / desks.length) * maxDelay);
      }
      
      // Перемешиваем массив задержек алгоритмом Fisher-Yates
      for (let i = delays.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [delays[i], delays[j]] = [delays[j], delays[i]];
      }
      
      setAnimationDelays(delays);
    }
  }, [desks.length, selectedDate]);

  // Обработка обновления данных при изменении даты
  useEffect(() => {
    if (mounted && selectedDate) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, mounted]);

  // Очищаем ошибку при изменении даты
  useEffect(() => {
    setError('');
  }, [selectedDate]);

  /**
   * Обработчик клика по столу
   */
  const handleDeskClick = async (desk: Desk) => {
    setLoading(desk.id);
    setError('');

    await BookingService.handleDeskClick(
      desk,
      selectedDate,
      () => {
        setLoading(null);
        onBookingSuccess();
      },
      (errorMessage: string) => {
        setError(errorMessage);
        setLoading(null);
      }
    );
  };

  /**
   * Обработчик долгого нажатия на стол
   */
  const handleDeskLongPress = (desk: Desk, event: React.MouseEvent | React.TouchEvent) => {
    console.log('handleDeskLongPress called', { deskId: desk.id, status: desk.status });
    
    // Не показываем календарь для занятых столов
    if (desk.status === 'booked') {
      console.log('Desk is booked, skipping calendar');
      return;
    }

    setSelectedDeskForWeek(desk);
    setShowWeekCalendar(true);
  };

  /**
   * Обработчик подтверждения выбора дней недели
   */
  const handleWeekCalendarConfirm = async (selectedDays: number[]) => {
    if (!selectedDeskForWeek) return;

    setShowWeekCalendar(false);
    setLoading(selectedDeskForWeek.id);
    setError('');

    try {
      // Получаем даты для выбранных дней недели (на год вперед)
      // Используем текущую выбранную дату как начальную точку, чтобы гарантировать включение текущей даты
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const dates = WeekUtils.getDatesForWeekDays(selectedDays, selectedDateObj);

      // ВАЖНО: Гарантируем, что текущая выбранная дата включена, если она соответствует выбранным дням недели
      // Это нужно для того, чтобы бронирование обновлялось и на текущую выбранную дату
      const selectedDateDayOfWeek = selectedDateObj.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
      const selectedDateWeekDay = selectedDateDayOfWeek === 0 ? 7 : selectedDateDayOfWeek; // Конвертируем в формат 1-7
      
      if (selectedDays.includes(selectedDateWeekDay)) {
        // Если текущая выбранная дата соответствует выбранным дням недели, гарантируем её включение
        const selectedDateStr = WeekUtils.formatDate(selectedDateObj);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Включаем выбранную дату, если она сегодня или в будущем
        if (selectedDateObj >= today && !dates.includes(selectedDateStr)) {
          dates.push(selectedDateStr);
        }
      }

      if (dates.length === 0) {
        setError('Не удалось сгенерировать даты для бронирования');
        setLoading(null);
        return;
      }

      // Отправляем все даты на сервер
      // Сервер проверит доступность стола и отменит старые бронирования пользователя только на те даты,
      // где выбранный стол свободен. Если стол занят другим пользователем, старое бронирование сохраняется.
      const createResponse = await BookingService.createMultipleBookings(
        dates,
        selectedDeskForWeek.id
      );

      if (createResponse.success) {
        const createdCount = createResponse.createdDates?.length || 0;
        const failedCount = createResponse.failedDates?.length || 0;

        // Проверяем, является ли текущая выбранная дата одним из выбранных дней недели
        // Нормализуем дату в формате YYYY-MM-DD (убираем время, если есть)
        const selectedDateStr = selectedDate.split('T')[0].split(' ')[0].trim();
        const [year, month, day] = selectedDateStr.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        selectedDateObj.setHours(0, 0, 0, 0);
        const selectedDateDayOfWeek = selectedDateObj.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
        const selectedDateWeekDay = selectedDateDayOfWeek === 0 ? 7 : selectedDateDayOfWeek; // Конвертируем в формат 1-7
        const isCurrentDateInSelectedDays = selectedDays.includes(selectedDateWeekDay);

        // Если текущая дата не входит в выбранные дни недели, находим ближайшую дату из созданных бронирований
        let nearestDate: string | undefined;
        if (!isCurrentDateInSelectedDays && createResponse.createdDates && createResponse.createdDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Находим ближайшую дату из созданных бронирований (не в прошлом)
          const futureDates = createResponse.createdDates
            .map(dateStr => {
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day);
            })
            .filter(date => {
              date.setHours(0, 0, 0, 0);
              return date >= today;
            })
            .sort((a, b) => a.getTime() - b.getTime());
          
          if (futureDates.length > 0) {
            nearestDate = WeekUtils.formatDate(futureDates[0]);
          }
        }

        if (createdCount > 0) {
          alert(`Успешно забронировано на ${createdCount} дат(ы)`);
          onBookingSuccess(nearestDate);
        }

        if (failedCount > 0 && createResponse.failedDates) {
          const failedDatesFormatted = createResponse.failedDates
            .map(date => WeekUtils.formatDateForDisplay(date))
            .join(', ');
          alert(`Внимание! Стол "${selectedDeskForWeek.label}" уже забронирован другими пользователями на следующие даты: ${failedDatesFormatted}. Ваши старые бронирования на эти даты сохранены.`);
        }

        // Если ничего не создалось, но и ошибки нет - значит все даты были заняты
        if (createdCount === 0 && failedCount > 0) {
          // Уже показали уведомление выше
          onBookingSuccess(); // Обновляем список, чтобы показать отмененные бронирования
        }
      } else {
        // Если сервер вернул ошибку "Все даты заняты", это нормально - старые бронирования сохранены
        if (createResponse.error && createResponse.error.includes('заняты')) {
          alert(`Все выбранные даты уже заняты другими пользователями. Ваши старые бронирования на эти даты сохранены.`);
          onBookingSuccess(); // Обновляем список
        } else {
          setError(createResponse.error || 'Ошибка при создании бронирований');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при бронировании');
    } finally {
      setLoading(null);
      setSelectedDeskForWeek(null);
    }
  };

  /**
   * Обработчик закрытия календаря
   */
  const handleWeekCalendarClose = () => {
    setShowWeekCalendar(false);
    setSelectedDeskForWeek(null);
  };

  // Вычисляем размеры помещения с учетом масштаба
  const officeWidth = BASE_OFFICE_WIDTH * scale;
  const officeHeight = BASE_OFFICE_HEIGHT * scale;

  // Вычисляем позиции всех столов
  const deskPositions = useMemo(() => {
    return DeskPositioningService.calculatePositions(desks, scale);
  }, [desks, scale]);

  return (
    <>
      <div className="office-map-container">
        <div className="office-map-header">
          <div>
            <h2>Финтех - Схема офиса</h2>
            <div className="selected-date-display">
              {DateUtils.formatSelectedDate(selectedDate)}
            </div>
          </div>
        </div>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color free"></div>
            <span>Свободно</span>
          </div>
          <div className="legend-item">
            <div className="legend-color booked"></div>
            <span>Занято</span>
          </div>
          <div className="legend-item">
            <div className="legend-color my"></div>
            <span>Моё место</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="office-map-wrapper">
          <div
            ref={mapContainerRef}
            className="office-map"
            style={{
              width: `${officeWidth}px`,
              height: `${officeHeight}px`,
            }}
          >
            {/* Разделительная линия между верхней и нижней секциями */}
            <div
              className="section-divider"
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: `${2 * scale}px`,
                background: '#333',
                zIndex: 1,
              }}
            />
            {desks.map((desk, index) => {
              const position = deskPositions[desk.id] || {
                x: desk.x * scale,
                y: desk.y * scale,
              };

              return (
                <DeskItem
                  key={`${desk.id}-${selectedDate}-${animationKey}`}
                  desk={desk}
                  position={position}
                  scale={scale}
                  loading={loading === desk.id}
                  onClick={handleDeskClick}
                  onLongPress={handleDeskLongPress}
                  isUpdating={isUpdating}
                  animationDelay={animationDelays[index] || 0}
                  hoveredAttendeeEmail={hoveredAttendeeEmail}
                />
              );
            })}
          </div>
        </div>
      </div>
      <AttendeesList 
        desks={desks} 
        currentUserEmail={currentUserEmail} 
        selectedDate={selectedDate}
        onAttendeeHover={setHoveredAttendeeEmail}
      />
      {showWeekCalendar && selectedDeskForWeek && (
        <WeekCalendar
          deskId={selectedDeskForWeek.id}
          deskLabel={selectedDeskForWeek.label}
          onClose={handleWeekCalendarClose}
          onConfirm={handleWeekCalendarConfirm}
        />
      )}
    </>
  );
};

export default OfficeMap;
