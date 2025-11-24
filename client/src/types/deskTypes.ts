// Константы размеров помещения
export const BASE_OFFICE_WIDTH = 640;
export const BASE_OFFICE_HEIGHT = 850;

// Константы размеров столов
export const BASE_DESK_WIDTH = 120;  // длинная сторона для горизонтальных столов
export const BASE_DESK_HEIGHT = 60; // короткая сторона для горизонтальных столов
export const BASE_DESK_VERTICAL_WIDTH = 60;  // короткая сторона для вертикальных столов
export const BASE_DESK_VERTICAL_HEIGHT = 120; // длинная сторона для вертикальных столов
export const BASE_DESK_LARGE_WIDTH = 225;    // длинная сторона для большого стола
export const BASE_DESK_LARGE_HEIGHT = 75;    // короткая сторона для большого стола

// Типы столов
export enum DeskType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  LARGE = 'large',
}

// Диапазоны номеров столов по типам
export const DESK_TYPE_RANGES = {
  VERTICAL: { min: 13, max: 16 },
  LARGE: { number: 19 },
} as const;

export interface DeskSize {
  width: number;
  height: number;
}

