import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Desk } from '../api/desks';
import { BASE_OFFICE_WIDTH, BASE_OFFICE_HEIGHT } from '../types/deskTypes';
import { useOfficeScale } from '../hooks/useOfficeScale';
import { DeskPositioningService } from '../services/deskPositioningService';
import { BookingService } from '../services/bookingService';
import { DateUtils } from '../utils/dateUtils';
import DeskItem from './DeskItem';
import AttendeesList from './AttendeesList';
import './OfficeMap.css';

interface OfficeMapProps {
  desks: Desk[];
  selectedDate: string;
  currentUserEmail: string;
  onBookingSuccess: () => void;
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const scale = useOfficeScale(mapContainerRef);

  // Инициализация при монтировании
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Обработка обновления данных при изменении даты
  useEffect(() => {
    if (mounted && selectedDate) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 350);
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
                  key={`${desk.id}-${selectedDate}`}
                  desk={desk}
                  position={position}
                  scale={scale}
                  loading={loading === desk.id}
                  onClick={handleDeskClick}
                  isUpdating={isUpdating}
                  animationDelay={index * 0.03}
                />
              );
            })}
          </div>
        </div>
      </div>
      <AttendeesList desks={desks} currentUserEmail={currentUserEmail} />
    </>
  );
};

export default OfficeMap;
