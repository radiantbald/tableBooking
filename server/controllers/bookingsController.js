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

    // Проверяем формат даты
    const dateObj = new Date(date);
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
      [userId, date]
    );

    if (existingUserBooking.rows.length > 0) {
      // Удаляем старое бронирование пользователя на эту дату
      await client.query(
        'DELETE FROM bookings WHERE user_id = $1 AND date = $2',
        [userId, date]
      );
    }

    // Проверяем, что стол свободен на эту дату
    const existingDeskBooking = await client.query(
      'SELECT id FROM bookings WHERE desk_id = $1 AND date = $2',
      [normalizedDeskId, date]
    );

    if (existingDeskBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Стол уже занят'
      });
    }

    // Создаём бронирование
    await client.query(
      'INSERT INTO bookings (user_id, desk_id, date) VALUES ($1, $2, $3)',
      [userId, normalizedDeskId, date]
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

    const result = await pool.query(
      `SELECT b.id, b.date, b.created_at, d.id as desk_id, d.label as desk_label
       FROM bookings b
       JOIN desks d ON b.desk_id = d.id
       WHERE b.user_id = $1
       ORDER BY b.date DESC, b.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      bookings: result.rows
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

    // Проверяем, что бронирование существует и принадлежит пользователю
    const bookingResult = await client.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND desk_id = $2 AND date = $3',
      [userId, normalizedDeskId, date]
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
      [userId, normalizedDeskId, date]
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

