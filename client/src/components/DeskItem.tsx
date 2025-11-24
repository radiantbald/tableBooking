import React from 'react';
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
  isUpdating?: boolean;
  animationDelay?: number;
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
  isUpdating = false,
  animationDelay = 0
}) => {
  const deskSize = DeskSizeService.getDeskSize(desk, scale);
  const className = DeskClassNameUtils.getDeskClassName(desk);
  const deskType = getDeskTypeFromDesk(desk);
  const isVertical = deskType === DeskType.VERTICAL;

  const getTooltip = (): string => {
    if (desk.status === 'booked' && desk.bookedBy) {
      return `Занято: ${desk.bookedBy}`;
    }
    if (desk.status === 'my') {
      return 'Ваше место';
    }
    return 'Свободно';
  };

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
      className={`${className} ${isUpdating ? 'updating' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: deskSize.width,
        height: deskSize.height,
        fontSize: `${0.85 * scale}rem`,
        animationDelay: `${animationDelay}s`,
      }}
      onClick={() => onClick(desk)}
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

