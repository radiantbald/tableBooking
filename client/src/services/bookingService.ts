import { Desk } from '../api/desks';
import { bookingsApi, CheckBookingsResponse, CreateMultipleBookingsResponse } from '../api/bookings';

/**
 * Сервис для работы с бронированиями
 * Принцип Single Responsibility: отвечает только за операции с бронированиями
 */
export class BookingService {
  /**
   * Создает бронирование
   */
  static async createBooking(date: string, deskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await bookingsApi.createBooking({ date, deskId });
      return response;
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Ошибка сервера',
      };
    }
  }

  /**
   * Отменяет бронирование
   */
  static async cancelBooking(date: string, deskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await bookingsApi.cancelBooking({ date, deskId });
      return response;
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Ошибка сервера',
      };
    }
  }

  /**
   * Проверяет доступность стола на указанные даты
   */
  static async checkBookings(
    dates: string[],
    deskId: string
  ): Promise<CheckBookingsResponse> {
    try {
      const response = await bookingsApi.checkBookings({ dates, deskId });
      return response;
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Ошибка сервера',
      };
    }
  }

  /**
   * Создает множественные бронирования
   */
  static async createMultipleBookings(
    dates: string[],
    deskId: string
  ): Promise<CreateMultipleBookingsResponse> {
    try {
      const response = await bookingsApi.createMultipleBookings({ dates, deskId });
      return response;
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Ошибка сервера',
      };
    }
  }

  /**
   * Обрабатывает клик по столу
   */
  static async handleDeskClick(
    desk: Desk,
    selectedDate: string,
    onSuccess: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Если стол уже выбран пользователем, отменяем бронирование
    if (desk.status === 'my') {
      const confirmed = window.confirm('Отменить выбор этого стола?');
      if (!confirmed) {
        return;
      }

      const response = await this.cancelBooking(selectedDate, desk.id);
      if (response.success) {
        alert('Бронирование отменено');
        onSuccess();
      } else {
        onError(response.error || 'Ошибка при отмене бронирования');
      }
      return;
    }

    // Если стол занят другим пользователем, ничего не делаем
    if (desk.status !== 'free') {
      return;
    }

    // Создаем новое бронирование
    const response = await this.createBooking(selectedDate, desk.id);
    if (response.success) {
      alert('Место успешно забронировано');
      onSuccess();
    } else {
      onError(response.error || 'Ошибка при бронировании');
    }
  }
}

