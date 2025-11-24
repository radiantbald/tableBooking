import React, { useRef, useEffect, useState } from 'react';
import { Desk } from '../api/desks';
import { DeskSizeService } from '../services/deskSizeService';
import { DeskClassNameUtils } from '../utils/deskClassNameUtils';
import { Position } from '../services/deskPositioningService';
import { getDeskTypeFromDesk } from '../utils/deskUtils';
import { DeskType } from '../types/deskTypes';

interface DeskItemProps {
  desk: Desk;
  position: Position;
  scale: number;
  loading: boolean;
  onClick: (desk: Desk) => void;
  onLongPress?: (desk: Desk, event: React.MouseEvent | React.TouchEvent) => void;
  isUpdating?: boolean;
  animationDelay?: number;
  hoveredAttendeeEmail?: string | null;
}

/**
 * Компонент отдельного стола
 * Принцип Single Responsibility: отвечает только за отображение одного стола
 */
const DeskItem: React.FC<DeskItemProps> = ({ 
  desk, 
  position, 
  scale, 
  loading, 
  onClick,
  onLongPress,
  isUpdating = false,
  animationDelay = 0,
  hoveredAttendeeEmail = null
}) => {
  const baseDeskSize = DeskSizeService.getDeskSize(desk, scale);
  const isHovered = hoveredAttendeeEmail !== null && desk.bookedBy === hoveredAttendeeEmail;
  const hoverScale = isHovered ? 1.3 : 1;
  const deskSize = {
    width: baseDeskSize.width * hoverScale,
    height: baseDeskSize.height * hoverScale,
  };
  const className = DeskClassNameUtils.getDeskClassName(desk);
  const deskType = getDeskTypeFromDesk(desk);
  const isVertical = deskType === DeskType.VERTICAL;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressEventRef = useRef<React.MouseEvent | React.TouchEvent | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const clickBlockedRef = useRef<boolean>(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const getTooltip = (): string => {
    if (desk.status === 'booked' && desk.bookedBy) {
      return `Занято: ${desk.bookedBy}`;
    }
    if (desk.status === 'my') {
      return 'Ваше место';
    }
    return 'Свободно. Нажмите и удерживайте для бронирования на неделю';
  };

  // Обработка долгого нажатия (3 секунды)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onLongPress || desk.status === 'booked') {
      console.log('Long press skipped', { hasHandler: !!onLongPress, status: desk.status });
      return;
    }
    
    console.log('Mouse down, starting long press timer');
    
    // Предотвращаем контекстное меню
    e.preventDefault();
    
    longPressTriggeredRef.current = false;
    clickBlockedRef.current = false;
    longPressEventRef.current = e;
    
    setIsLongPressing(true);
    longPressTimerRef.current = setTimeout(() => {
      console.log('Long press timer fired');
      if (onLongPress && longPressEventRef.current) {
        console.log('Calling onLongPress');
        longPressTriggeredRef.current = true;
        clickBlockedRef.current = true;
        setIsLongPressing(false);
        onLongPress(desk, longPressEventRef.current);
        // Очищаем событие после вызова
        longPressEventRef.current = null;
      } else {
        console.log('onLongPress not available or event cleared', { 
          hasHandler: !!onLongPress, 
          hasEvent: !!longPressEventRef.current 
        });
        setIsLongPressing(false);
      }
    }, 1500); // Уменьшено до 1.5 секунды для удобства тестирования
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsLongPressing(false);
    const wasLongPress = longPressTriggeredRef.current || clickBlockedRef.current;
    
    // Очищаем таймер, если он еще не сработал
    if (longPressTimerRef.current && !wasLongPress) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Если долгое нажатие сработало, блокируем клик
    if (wasLongPress) {
      e.preventDefault();
      e.stopPropagation();
      // Сбрасываем флаги через задержку, чтобы onClick не сработал
      setTimeout(() => {
        longPressTriggeredRef.current = false;
        clickBlockedRef.current = false;
        longPressEventRef.current = null;
      }, 300);
      return;
    }
    
    // Если таймер еще не сработал, просто очищаем событие
    longPressEventRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsLongPressing(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressEventRef.current = null;
    longPressTriggeredRef.current = false;
    clickBlockedRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress || desk.status === 'booked') {
      console.log('Touch long press skipped', { hasHandler: !!onLongPress, status: desk.status });
      return;
    }
    
    console.log('Touch start, starting long press timer');
    
    // Предотвращаем контекстное меню и скролл
    e.preventDefault();
    
    longPressTriggeredRef.current = false;
    clickBlockedRef.current = false;
    longPressEventRef.current = e;
    
    setIsLongPressing(true);
    longPressTimerRef.current = setTimeout(() => {
      console.log('Touch long press timer fired');
      if (onLongPress && longPressEventRef.current) {
        console.log('Calling onLongPress from touch');
        longPressTriggeredRef.current = true;
        clickBlockedRef.current = true;
        setIsLongPressing(false);
        onLongPress(desk, longPressEventRef.current);
        // Очищаем событие после вызова
        longPressEventRef.current = null;
      } else {
        console.log('onLongPress not available or event cleared from touch');
        setIsLongPressing(false);
      }
    }, 1500); // Уменьшено до 1.5 секунды для удобства тестирования
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsLongPressing(false);
    const wasLongPress = longPressTriggeredRef.current || clickBlockedRef.current;
    
    // Очищаем таймер, если он еще не сработал
    if (longPressTimerRef.current && !wasLongPress) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Если долгое нажатие сработало, блокируем клик
    if (wasLongPress) {
      e.preventDefault();
      e.stopPropagation();
      // Сбрасываем флаги через задержку, чтобы onClick не сработал
      setTimeout(() => {
        longPressTriggeredRef.current = false;
        clickBlockedRef.current = false;
        longPressEventRef.current = null;
      }, 300);
      return;
    }
    
    // Если таймер еще не сработал, просто очищаем событие
    longPressEventRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Блокируем клик для столов, забронированных другими пользователями
    if (desk.status === 'booked') {
      console.log('Click blocked: desk is booked by another user');
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
        (e.nativeEvent as any).stopImmediatePropagation();
      }
      return;
    }

    // Предотвращаем обычный клик, если было долгое нажатие
    if (longPressTriggeredRef.current || clickBlockedRef.current) {
      console.log('Click blocked due to long press');
      e.preventDefault();
      e.stopPropagation();
      // Используем нативное событие для stopImmediatePropagation
      if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
        (e.nativeEvent as any).stopImmediatePropagation();
      }
      return;
    }
    console.log('Normal click handled');
    onClick(desk);
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Разбиваем label для вертикальных столов на две строки
  const renderDeskLabel = () => {
    if (isVertical) {
      // Для вертикальных столов: "Стол 13" -> "Стол" на первой строке, "13" на второй
      const parts = desk.label.split(' ');
      if (parts.length >= 2) {
        const labelText = parts.slice(0, -1).join(' '); // "Стол"
        const numberText = parts[parts.length - 1]; // "13"
        return (
          <>
            <div className="desk-label-line">{labelText}</div>
            <div className="desk-label-line">{numberText}</div>
          </>
        );
      }
    }
    // Для горизонтальных и больших столов оставляем как есть
    return <div className="desk-label">{desk.label}</div>;
  };

  return (
    <div
      className={`${className} ${isUpdating ? 'updating' : ''} ${isLongPressing ? 'long-press-active' : ''} ${isHovered ? 'attendee-hovered' : ''}`}
      style={{
        left: position.x - (deskSize.width - baseDeskSize.width) / 2,
        top: position.y - (deskSize.height - baseDeskSize.height) / 2,
        width: deskSize.width,
        height: deskSize.height,
        fontSize: `${0.85 * scale}rem`,
        animationDelay: `${animationDelay}s`,
        zIndex: isHovered ? 20 : 'auto',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => {
        // Предотвращаем контекстное меню при долгом нажатии
        if (onLongPress && desk.status !== 'booked') {
          e.preventDefault();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      title={getTooltip()}
    >
      {loading ? (
        <div className="desk-loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      ) : (
        <>
          {renderDeskLabel()}
          {desk.status === 'booked' && desk.bookedBy && (
            <div className="desk-booked-by" style={{ fontSize: `${0.7 * scale}rem` }}>
              {desk.bookedBy}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DeskItem;

