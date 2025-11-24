/**
 * Утилиты для работы с датами
 */
export class DateUtils {
  /**
   * Форматирует дату для отображения
   */
  static formatSelectedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

