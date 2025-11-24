const pool = require('../config/database');

// Проверка, что дата не в прошлом (сегодня и будущее)
const isNotPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

exports.createBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { date, deskId } = req.body;
    const userId = req.user.userId;

    if (!date || deskId === undefined || deskId === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Дата и ID стола обязательны'
      });
    }

    // Валидация типов данных
    if (typeof deskId !== 'number' && typeof deskId !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Неверный тип данных для ID стола'
      });
    }

    // Нормализация deskId к строке для сравнения с базой данных
    const normalizedDeskId = String(deskId);

    // Нормализуем дату в формат YYYY-MM-DD, избегая проблем с часовыми поясами
    let normalizedDate = date;
    if (typeof date === 'string') {
      // Убираем время, если есть
      normalizedDate = date.split('T')[0].split(' ')[0].trim();
      // Проверяем формат YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Неверный формат даты. Ожидается YYYY-MM-DD'
        });
      }
    }

    // Проверяем, что дата не в прошлом (парсим без часовых поясов)
    const [year, month, day] = normalizedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setHours(0, 0, 0, 0);
    
    if (isNaN(dateObj.getTime())) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Неверный формат даты'
      });
    }

    // Проверяем, что дата не в прошлом
    if (!isNotPast(dateObj)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Нельзя бронировать стол на прошедшую дату'
      });
    }

    // Проверяем, что стол существует и активен
    const deskResult = await client.query(
      'SELECT id FROM desks WHERE id = $1 AND is_active = true',
      [normalizedDeskId]
    );

    if (deskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Стол не найден'
      });
    }

    // Проверяем, что у пользователя нет другого бронирования на эту дату
    // Если есть - удаляем старое бронирование (заменяем выбор)
    const existingUserBooking = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND date = $2',
      [userId, normalizedDate]
    );

    if (existingUserBooking.rows.length > 0) {
      // Удаляем старое бронирование пользователя на эту дату
      await client.query(
        'DELETE FROM bookings WHERE user_id = $1 AND date = $2',
        [userId, normalizedDate]
      );
    }

    // Проверяем, что стол свободен на эту дату
    const existingDeskBooking = await client.query(
      'SELECT id FROM bookings WHERE desk_id = $1 AND date = $2',
      [normalizedDeskId, normalizedDate]
    );

    if (existingDeskBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Стол уже занят'
      });
    }

    // Создаём бронирование (используем нормализованную дату)
    await client.query(
      'INSERT INTO bookings (user_id, desk_id, date) VALUES ($1, $2, $3)',
      [userId, normalizedDeskId, normalizedDate]
    );

    await client.query('COMMIT');

    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при создании бронирования:', error);
    
    // Проверяем на уникальное ограничение
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Стол уже занят'
      });
    }

    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Получаем только актуальные бронирования (сегодня и будущие)
    // Прошедшие бронирования остаются в базе данных, но не возвращаются в API
    // Используем CURRENT_DATE для корректного сравнения дат в PostgreSQL
    const result = await pool.query(
      `SELECT b.id, b.date, b.created_at, d.id as desk_id, d.label as desk_label
       FROM bookings b
       JOIN desks d ON b.desk_id = d.id
       WHERE b.user_id = $1 AND b.date >= CURRENT_DATE
       ORDER BY b.date DESC, b.created_at DESC`,
      [userId]
    );

    // Форматируем даты в формат YYYY-MM-DD, чтобы избежать проблем с часовыми поясами
    const bookings = result.rows.map(booking => {
      // Преобразуем дату в строку формата YYYY-MM-DD, избегая проблем с часовыми поясами
      let dateStr;
      if (booking.date instanceof Date) {
        // Используем локальные методы для получения года, месяца и дня, чтобы избежать сдвига из-за часовых поясов
        const year = booking.date.getFullYear();
        const month = String(booking.date.getMonth() + 1).padStart(2, '0');
        const day = String(booking.date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else if (typeof booking.date === 'string') {
        // Если уже строка, берем только дату (убираем время, если есть)
        dateStr = booking.date.split('T')[0].split(' ')[0].trim();
      } else {
        // Fallback: пытаемся преобразовать в строку
        dateStr = String(booking.date).split('T')[0].split(' ')[0].trim();
      }
      
      return {
        ...booking,
        date: dateStr
      };
    });

    res.json({
      success: true,
      bookings: bookings
    });
  } catch (error) {
    console.error('Ошибка при получении бронирований:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
};

exports.cancelBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { date, deskId } = req.body;
    const userId = req.user.userId;

    if (!date || deskId === undefined || deskId === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Дата и ID стола обязательны'
      });
    }

    // Валидация типов данных
    if (typeof deskId !== 'number' && typeof deskId !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Неверный тип данных для ID стола'
      });
    }

    // Нормализация deskId к строке для сравнения с базой данных
    const normalizedDeskId = String(deskId);

    // Нормализуем дату в формат YYYY-MM-DD, избегая проблем с часовыми поясами
    let normalizedDate = date;
    if (typeof date === 'string') {
      // Убираем время, если есть
      normalizedDate = date.split('T')[0].split(' ')[0].trim();
      // Проверяем формат YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Неверный формат даты. Ожидается YYYY-MM-DD'
        });
      }
    }

    // Проверяем, что бронирование существует и принадлежит пользователю
    const bookingResult = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND desk_id = $2 AND date = $3',
      [userId, normalizedDeskId, normalizedDate]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Бронирование не найдено'
      });
    }

    // Удаляем бронирование
    await client.query(
      'DELETE FROM bookings WHERE user_id = $1 AND desk_id = $2 AND date = $3',
      [userId, normalizedDeskId, normalizedDate]
    );

    await client.query('COMMIT');

    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при отмене бронирования:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
};

exports.checkBookings = async (req, res) => {
  try {
    const { dates, deskId } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Массив дат обязателен'
      });
    }

    if (deskId === undefined || deskId === null) {
      return res.status(400).json({
        success: false,
        error: 'ID стола обязателен'
      });
    }

    // Нормализация deskId к строке
    const normalizedDeskId = String(deskId);

    // Проверяем, что стол существует и активен
    const deskResult = await pool.query(
      'SELECT id FROM desks WHERE id = $1 AND is_active = true',
      [normalizedDeskId]
    );

    if (deskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Стол не найден'
      });
    }

    // Проверяем, какие даты уже заняты
    const bookedDatesResult = await pool.query(
      'SELECT date FROM bookings WHERE desk_id = $1 AND date = ANY($2::date[])',
      [normalizedDeskId, dates]
    );

    // Нормализуем даты в формат YYYY-MM-DD, избегая проблем с часовыми поясами
    const bookedDates = bookedDatesResult.rows.map(row => {
      const date = row.date;
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } else if (typeof date === 'string') {
        return date.split('T')[0].split(' ')[0].trim();
      } else {
        return String(date).split('T')[0].split(' ')[0].trim();
      }
    });

    res.json({
      success: true,
      bookedDates
    });
  } catch (error) {
    console.error('Ошибка при проверке бронирований:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
};

exports.cancelAllBookings = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const userId = req.user.userId;

    // Удаляем все бронирования пользователя
    const result = await client.query(
      'DELETE FROM bookings WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true,
      deletedCount: result.rowCount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при отмене всех бронирований:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
};

exports.createMultipleBookings = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { dates, deskId } = req.body;
    const userId = req.user.userId;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Массив дат обязателен'
      });
    }

    if (deskId === undefined || deskId === null) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'ID стола обязателен'
      });
    }

    // Валидация типов данных
    if (typeof deskId !== 'number' && typeof deskId !== 'string') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Неверный тип данных для ID стола'
      });
    }

    // Нормализация deskId к строке
    const normalizedDeskId = String(deskId);

    // Проверяем, что стол существует и активен
    const deskResult = await client.query(
      'SELECT id FROM desks WHERE id = $1 AND is_active = true',
      [normalizedDeskId]
    );

    if (deskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Стол не найден'
      });
    }

    // Валидация и нормализация дат
    const validDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const validDatesSet = new Set(); // Для предотвращения дубликатов

    for (const dateStr of dates) {
      // Нормализуем дату в формат YYYY-MM-DD, избегая проблем с часовыми поясами
      let normalizedDate = dateStr;
      if (typeof dateStr === 'string') {
        normalizedDate = dateStr.split('T')[0].split(' ')[0].trim();
        // Проверяем формат YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
          console.warn(`Invalid date format: ${dateStr}`);
          continue;
        }
      }
      
      // Парсим дату без часовых поясов для проверки
      const [year, month, day] = normalizedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      dateObj.setHours(0, 0, 0, 0);
      
      if (isNaN(dateObj.getTime())) {
        console.warn(`Invalid date: ${dateStr}`);
        continue;
      }
      
      if (dateObj >= today) {
        // Добавляем только если еще не добавлена
        if (!validDatesSet.has(normalizedDate)) {
          validDates.push(normalizedDate);
          validDatesSet.add(normalizedDate);
        }
      }
    }

    // Сортируем даты для правильной обработки
    validDates.sort();

    if (validDates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Нет валидных дат для бронирования'
      });
    }

    console.log('Processing multiple bookings:', {
      deskId: normalizedDeskId,
      userId,
      totalDates: validDates.length,
      firstDate: validDates[0],
      lastDate: validDates[validDates.length - 1]
    });

    // ВАЖНО: Сначала проверяем, какие даты уже заняты другим пользователем на выбранном столе
    // Это нужно делать ДО удаления старых бронирований, чтобы не отменять старое бронирование,
    // если выбранный стол занят другим пользователем
    const bookedDatesResult = await client.query(
      `SELECT date, user_id FROM bookings 
       WHERE desk_id = $1 AND date = ANY($2::date[])`,
      [normalizedDeskId, validDates]
    );

    // Нормализуем занятые даты в формат YYYY-MM-DD и разделяем на занятые другим пользователем и самим пользователем
    const bookedDatesByOtherUsers = [];
    const bookedDatesByCurrentUser = [];
    
    bookedDatesResult.rows.forEach(row => {
      const date = row.date;
      let normalizedDate;
      
      // Если это объект Date, конвертируем в строку
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      } else if (typeof date === 'string') {
        // Если это строка, берем только дату (убираем время, если есть)
        normalizedDate = date.split('T')[0].split(' ')[0].trim();
      } else {
        // Fallback: пытаемся преобразовать в строку
        normalizedDate = String(date).split('T')[0].split(' ')[0].trim();
      }
      
      // Разделяем по пользователям: если занято другим пользователем - сохраняем, если самим - удалим старое бронирование
      if (row.user_id === userId) {
        bookedDatesByCurrentUser.push(normalizedDate);
      } else {
        bookedDatesByOtherUsers.push(normalizedDate);
      }
    });

    // Создаем Set для быстрого поиска дат, занятых другими пользователями
    const bookedDatesByOtherUsersSet = new Set(bookedDatesByOtherUsers);
    
    // Определяем даты, на которых нужно удалить старое бронирование:
    // это даты, где выбранный стол НЕ занят другим пользователем
    const datesToDeleteOldBooking = validDates.filter(date => !bookedDatesByOtherUsersSet.has(date));
    
    // Удаляем старые бронирования пользователя только на те даты, где выбранный стол свободен или занят самим пользователем
    if (datesToDeleteOldBooking.length > 0) {
      const deleteResult = await client.query(
        'DELETE FROM bookings WHERE user_id = $1 AND date = ANY($2::date[])',
        [userId, datesToDeleteOldBooking]
      );
      
      console.log('Deleted old bookings:', {
        deletedCount: deleteResult.rowCount,
        dates: datesToDeleteOldBooking.slice(0, 5) // Первые 5 для отладки
      });
    }
    
    // После удаления старых бронирований пользователя, даты, где стол был занят самим пользователем, теперь свободны
    // Фильтруем доступные даты: исключаем только те, что заняты другими пользователями
    const availableDates = validDates.filter(date => !bookedDatesByOtherUsersSet.has(date));
    
    console.log('Booking dates check:', {
      totalDates: validDates.length,
      bookedByOtherUsersCount: bookedDatesByOtherUsers.length,
      bookedByCurrentUserCount: bookedDatesByCurrentUser.length,
      datesToDeleteCount: datesToDeleteOldBooking.length,
      availableDatesCount: availableDates.length,
      bookedByOtherUsers: bookedDatesByOtherUsers.slice(0, 10), // Первые 10 для отладки
      availableDates: availableDates.slice(0, 10) // Первые 10 для отладки
    });

    // Создаем новые бронирования только на доступные даты
    const createdDates = [];
    const failedDates = [];

    console.log('Creating bookings for available dates:', {
      availableDatesCount: availableDates.length,
      firstAvailable: availableDates[0],
      lastAvailable: availableDates[availableDates.length - 1]
    });

    for (const date of availableDates) {
      try {
        await client.query(
          'INSERT INTO bookings (user_id, desk_id, date) VALUES ($1, $2, $3)',
          [userId, normalizedDeskId, date]
        );
        createdDates.push(date);
      } catch (error) {
        // Если ошибка уникального ограничения, значит уже занято (редкий случай гонки)
        if (error.code === '23505') {
          console.warn(`Booking conflict for date ${date} (unique constraint)`);
          failedDates.push(date);
        } else {
          console.error(`Ошибка при создании бронирования на ${date}:`, error);
          failedDates.push(date);
        }
      }
    }

    console.log('Booking creation result:', {
      createdCount: createdDates.length,
      failedCount: failedDates.length,
      bookedByOtherUsersCount: bookedDatesByOtherUsers.length
    });

    await client.query('COMMIT');

    // Возвращаем результат: созданные даты и занятые даты (которые не удалось забронировать)
    // failedDates содержит даты, где произошла ошибка при создании бронирования
    // bookedDatesByOtherUsers содержит даты, где стол занят другим пользователем
    res.json({
      success: true,
      createdDates,
      failedDates: [...failedDates, ...bookedDatesByOtherUsers]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при создании множественных бронирований:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  } finally {
    client.release();
  }
};

