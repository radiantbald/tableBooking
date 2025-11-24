const pool = require('../config/database');

exports.getDesks = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Дата не указана'
      });
    }

    // Проверяем формат даты
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат даты'
      });
    }

    // Получаем все столы
    const desksResult = await pool.query(
      'SELECT id, label, x, y, zone, is_active FROM desks WHERE is_active = true ORDER BY id'
    );

    // Получаем бронирования на эту дату
    const bookingsResult = await pool.query(
      `SELECT b.desk_id, b.user_id, u.email 
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.date = $1`,
      [date]
    );

    // Создаём мапу бронирований
    const bookingsMap = {};
    bookingsResult.rows.forEach(booking => {
      bookingsMap[booking.desk_id] = {
        userId: booking.user_id,
        email: booking.email
      };
    });

    const currentUserId = req.user.userId;

    // Формируем ответ
    const desks = desksResult.rows.map(desk => {
      const booking = bookingsMap[desk.id];
      const isBooked = !!booking;
      const isMyBooking = booking && booking.userId === currentUserId;

      return {
        id: desk.id,
        label: desk.label,
        x: desk.x,
        y: desk.y,
        zone: desk.zone,
        status: isMyBooking ? 'my' : (isBooked ? 'booked' : 'free'),
        bookedBy: booking ? booking.email : null
      };
    });

    res.json({
      success: true,
      date,
      desks
    });
  } catch (error) {
    console.error('Ошибка при получении столов:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
};

