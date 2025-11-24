import React, { useState, useEffect } from 'react';
import './DatePicker.css';

interface DatePickerProps {
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Переключаем месяц календаря, когда selectedDate меняется
  useEffect(() => {
    if (selectedDate) {
      // Парсим дату в формате YYYY-MM-DD, избегая проблем с часовыми поясами
      const dateStr = selectedDate.split('T')[0]; // Убираем время, если есть
      const [year, month, day] = dateStr.split('-').map(Number);
      // Проверяем, что текущий месяц отличается от месяца выбранной даты
      const selectedMonth = new Date(year, month - 1, 1);
      if (currentMonth.getFullYear() !== year || currentMonth.getMonth() !== month - 1) {
        setCurrentMonth(selectedMonth);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Получаем серверную дату (в реальном приложении можно получить через API)
  const getServerDate = () => {
    return new Date();
  };

  const isNotPast = (date: Date) => {
    const today = getServerDate();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today;
  };

  const isDateEnabled = (date: Date) => {
    return isNotPast(date);
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Получаем день недели первого дня месяца (0 = воскресенье, 1 = понедельник, ...)
    const firstDayOfWeek = firstDay.getDay();
    // Преобразуем воскресенье (0) в 7 для правильного отображения
    const adjustedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    const days: (Date | null)[] = [];
    
    // Добавляем пустые ячейки перед первым днем месяца, чтобы начать с понедельника
    for (let i = 1; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Добавляем все дни месяца
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getMonthName = (date: Date) => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[date.getMonth()];
  };


  const days = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    if (isDateEnabled(date)) {
      onDateSelect(formatDate(date));
    }
  };

  const handleTodayClick = () => {
    const today = getServerDate();
    const todayFormatted = formatDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(todayFormatted);
  };

  return (
    <div className="date-picker">
      <div className="date-picker-header">
        <button onClick={handlePrevMonth} className="month-nav-button">‹</button>
        <h2>{getMonthName(currentMonth)} {currentMonth.getFullYear()}</h2>
        <button onClick={handleNextMonth} className="month-nav-button">›</button>
      </div>
      <div className="date-picker-grid">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="date-cell empty"></div>;
          }
          
          const isEnabled = isDateEnabled(day);
          const dayFormatted = formatDate(day);
          // Нормализуем selectedDate для сравнения (убираем возможное время и лишние пробелы)
          const selectedDateNormalized = selectedDate ? selectedDate.split('T')[0].trim() : null;
          const isSelected = Boolean(selectedDateNormalized && selectedDateNormalized === dayFormatted);

          return (
            <button
              key={formatDate(day)}
              className={`date-cell ${!isEnabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDateClick(day)}
              disabled={!isEnabled}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="date-picker-footer">
        <button onClick={handleTodayClick} className="today-button">
          Сегодня
        </button>
        {selectedDate && (() => {
          // Парсим дату в формате YYYY-MM-DD, избегая проблем с часовыми поясами
          const dateStr = selectedDate.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          
          // Форматируем дату в сокращенном формате: пн, 24.11.2025
          const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
          const weekday = weekdays[date.getDay()];
          const formattedDay = String(day).padStart(2, '0');
          const formattedMonth = String(month).padStart(2, '0');
          const formattedDate = `${weekday}, ${formattedDay}.${formattedMonth}.${year}`;
          
          return (
            <div className="selected-date-info">
              Выбрана дата: {formattedDate}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DatePicker;

