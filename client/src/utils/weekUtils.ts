/**
 * Утилиты для работы с днями недели
 */
export class WeekUtils {
  /**
   * Получает даты для выбранных дней недели начиная с текущей недели
   * @param selectedDays - массив индексов дней недели (1 = понедельник, 2 = вторник, ..., 7 = воскресенье)
   * @param startDate - начальная дата (обычно сегодня)
   * @returns массив дат в формате YYYY-MM-DD
   */
  static getDatesForWeekDays(selectedDays: number[], startDate: Date = new Date()): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    // Используем сегодняшнюю дату как минимальную (не бронируем в прошлое)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = start < today ? today : start;
    
    // Находим начало недели для минимальной даты (понедельник)
    const dayOfWeek = minDate.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Если воскресенье, откатываемся на 6 дней назад
    const weekStart = new Date(minDate);
    weekStart.setDate(minDate.getDate() + mondayOffset);
    
    // Генерируем даты на год вперед от минимальной даты
    const endDate = new Date(minDate);
    endDate.setFullYear(minDate.getFullYear() + 1);
    
    let currentWeekStart = new Date(weekStart);
    
    while (currentWeekStart < endDate) {
      for (const dayIndex of selectedDays) {
        // dayIndex: 1=понедельник, 2=вторник, ..., 6=суббота, 7=воскресенье
        // offset от понедельника: 0=понедельник, 1=вторник, ..., 5=суббота, 6=воскресенье
        const offset = dayIndex === 7 ? 6 : dayIndex - 1;
        
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + offset);
        
        // Включаем дату, если она >= минимальной даты (сегодня или выбранная дата) и < конца года
        if (date >= minDate && date < endDate) {
          const dateStr = this.formatDate(date);
          if (!dates.includes(dateStr)) {
            dates.push(dateStr);
          }
        }
      }
      // Переходим к следующей неделе
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return dates.sort();
  }

  /**
   * Форматирует дату в формат YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Форматирует дату для отображения
   */
  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Получает названия дней недели
   */
  static getWeekDayNames(): string[] {
    return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  }

  /**
   * Получает полные названия дней недели
   */
  static getFullWeekDayNames(): string[] {
    return ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  }
}

