import { Desk } from '../api/desks';
import { DeskType, DeskSize } from '../types/deskTypes';
import {
  BASE_DESK_WIDTH,
  BASE_DESK_HEIGHT,
  BASE_DESK_VERTICAL_WIDTH,
  BASE_DESK_VERTICAL_HEIGHT,
  BASE_DESK_LARGE_WIDTH,
  BASE_DESK_LARGE_HEIGHT,
} from '../types/deskTypes';
import { getDeskTypeFromDesk, getDeskType } from '../utils/deskUtils';

/**
 * Сервис для работы с размерами столов
 * Принцип Single Responsibility: отвечает только за вычисление размеров столов
 */
export class DeskSizeService {
  /**
   * Получает базовые размеры стола по его типу
   */
  private static getBaseDeskSize(deskType: DeskType): { width: number; height: number } {
    switch (deskType) {
      case DeskType.VERTICAL:
        return {
          width: BASE_DESK_VERTICAL_WIDTH,
          height: BASE_DESK_VERTICAL_HEIGHT,
        };
      case DeskType.LARGE:
        return {
          width: BASE_DESK_LARGE_WIDTH,
          height: BASE_DESK_LARGE_HEIGHT,
        };
      case DeskType.HORIZONTAL:
      default:
        return {
          width: BASE_DESK_WIDTH,
          height: BASE_DESK_HEIGHT,
        };
    }
  }

  /**
   * Получает размеры стола с учетом масштаба
   */
  static getDeskSize(desk: Desk, scale: number): DeskSize {
    const deskType = getDeskTypeFromDesk(desk);
    const baseSize = this.getBaseDeskSize(deskType);
    return {
      width: baseSize.width * scale,
      height: baseSize.height * scale,
    };
  }

  /**
   * Получает размеры стола по номеру с учетом масштаба
   */
  static getDeskSizeByNumber(deskNumber: number, scale: number): DeskSize {
    const deskType = getDeskType(deskNumber);
    const baseSize = this.getBaseDeskSize(deskType);
    return {
      width: baseSize.width * scale,
      height: baseSize.height * scale,
    };
  }
}

