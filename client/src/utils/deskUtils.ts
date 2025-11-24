import { Desk } from '../api/desks';
import { DeskType, DESK_TYPE_RANGES } from '../types/deskTypes';

/**
 * Извлекает номер стола из его label
 */
export const parseDeskNumber = (label: string): number => {
  return parseInt(label.replace('Стол ', ''), 10);
};

/**
 * Определяет тип стола по его номеру
 */
export const getDeskType = (deskNumber: number): DeskType => {
  if (deskNumber >= DESK_TYPE_RANGES.VERTICAL.min && deskNumber <= DESK_TYPE_RANGES.VERTICAL.max) {
    return DeskType.VERTICAL;
  }
  if (deskNumber === DESK_TYPE_RANGES.LARGE.number) {
    return DeskType.LARGE;
  }
  return DeskType.HORIZONTAL;
};

/**
 * Получает номер стола из объекта Desk
 */
export const getDeskNumber = (desk: Desk): number => {
  return parseDeskNumber(desk.label);
};

/**
 * Получает тип стола из объекта Desk
 */
export const getDeskTypeFromDesk = (desk: Desk): DeskType => {
  return getDeskType(getDeskNumber(desk));
};

