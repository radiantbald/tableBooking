import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WeekUtils } from '../utils/weekUtils';
import './WeekCalendar.css';

interface WeekCalendarProps {
  deskId: string;
  deskLabel: string;
  onClose: () => void;
  onConfirm: (selectedDays: number[]) => void;
}

/**
 * Компонент мини-календаря для выбора дней недели
 */
const WeekCalendar: React.FC<WeekCalendarProps> = ({
  deskId,
  deskLabel,
  onClose,
  onConfirm,
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const weekDayNames = WeekUtils.getWeekDayNames();

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const handleConfirm = () => {
    if (selectedDays.length > 0) {
      onConfirm(selectedDays);
    }
  };

  // Применяем класс видимости после монтирования для плавной анимации
  useEffect(() => {
    // Используем requestAnimationFrame для синхронизации с браузером
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const modalContent = (
    <>
      <div className="week-calendar-overlay" onClick={onClose} />
      <div
        className={`week-calendar ${isVisible ? 'week-calendar-visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="week-calendar-header">
          <h3>Бронирование: {deskLabel}</h3>
          <button className="week-calendar-close" onClick={onClose}>×</button>
        </div>
        <div className="week-calendar-content">
          <p className="week-calendar-hint">Выберите дни недели для бронирования:</p>
          <div className="week-days-grid">
            {weekDayNames.map((dayName, index) => {
              const dayIndex = index + 1; // 1 = понедельник, 7 = воскресенье
              const isSelected = selectedDays.includes(dayIndex);
              return (
                <button
                  key={dayIndex}
                  className={`week-day-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleDay(dayIndex)}
                >
                  <div className="week-day-name">{dayName}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="week-calendar-footer">
          <button
            className="week-calendar-button confirm"
            onClick={handleConfirm}
            disabled={selectedDays.length === 0}
          >
            Забронировать
          </button>
          <button className="week-calendar-button cancel" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default WeekCalendar;

