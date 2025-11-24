import { Desk } from '../api/desks';
import { DeskType } from '../types/deskTypes';
import { getDeskTypeFromDesk } from './deskUtils';

/**
 * Утилиты для работы с CSS классами столов
 */
export class DeskClassNameUtils {
  /**
   * Получает CSS класс для стола в зависимости от его статуса и типа
   */
  static getDeskClassName(desk: Desk): string {
    const baseClass = 'desk';
    const orientationClass = this.getOrientationClass(desk);
    const statusClass = this.getStatusClass(desk.status);

    return `${baseClass} ${orientationClass} ${statusClass}`.trim();
  }

  /**
   * Получает класс ориентации стола
   */
  private static getOrientationClass(desk: Desk): string {
    const deskType = getDeskTypeFromDesk(desk);
    switch (deskType) {
      case DeskType.VERTICAL:
        return 'desk-vertical';
      case DeskType.LARGE:
        return 'desk-large';
      case DeskType.HORIZONTAL:
      default:
        return '';
    }
  }

  /**
   * Получает класс статуса стола
   */
  private static getStatusClass(status: Desk['status']): string {
    switch (status) {
      case 'my':
        return 'my-desk';
      case 'booked':
        return 'booked-desk';
      case 'free':
      default:
        return 'free-desk';
    }
  }
}

