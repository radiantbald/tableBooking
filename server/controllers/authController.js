const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Создаём транспортер для отправки email
let transporter = null;

// Инициализация транспортера
async function initTransporter() {
  // Если есть настройки SMTP в переменных окружения - используем их
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true для 465, false для других портов
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('SMTP транспортер настроен из переменных окружения');
    return;
  }

  // Если нет настроек SMTP - используем тестовый Ethereal Email
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('Используется тестовый Ethereal Email для отправки писем');
    console.log(`Тестовый аккаунт: ${testAccount.user}`);
  } catch (error) {
    console.error('Ошибка создания тестового аккаунта Ethereal:', error);
    throw error;
  }
}

// Инициализируем транспортер при загрузке модуля
initTransporter().catch(err => {
  console.error('Ошибка инициализации email транспортера:', err);
});

// Отправка кода подтверждения на email
const sendCodeEmail = async (email, code) => {
  // Если отключена отправка email (только для разработки)
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log(`\n=== КОД ПОДТВЕРЖДЕНИЯ (EMAIL ОТКЛЮЧЕН) ===`);
    console.log(`Email: ${email}`);
    console.log(`Код: ${code}`);
    console.log(`==========================================\n`);
    return;
  }

  // Ждём инициализации транспортера, если ещё не готов
  if (!transporter) {
    await initTransporter();
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@rwb.ru',
      to: email,
      subject: 'Код подтверждения для бронирования стола',
      text: `Ваш код подтверждения: ${code}`,
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен в течение 15 минут.</p>`
    });

      // Если используется Ethereal Email - выводим ссылку на просмотр письма
    if (!process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n=== ПИСЬМО ОТПРАВЛЕНО (Ethereal Email) ===`);
        console.log(`Email: ${email}`);
        console.log(`Код: ${code}`);
        console.log(`Просмотр письма: ${previewUrl}`);
        console.log(`==========================================\n`);
      } else {
        console.log(`\n=== ПИСЬМО ОТПРАВЛЕНО ===`);
        console.log(`Email: ${email}`);
        console.log(`Код: ${code}`);
        console.log(`Message ID: ${info.messageId}`);
        console.log(`========================\n`);
      }
    } else {
      console.log(`\n=== ПИСЬМО ОТПРАВЛЕНО ===`);
      console.log(`Email: ${email}`);
      console.log(`Код: ${code}`);
      console.log(`Message ID: ${info.messageId}`);
      console.log(`========================\n`);
    }
  } catch (error) {
    console.error('Ошибка отправки email:', error);
    
    // Детальная информация об ошибке
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  ОШИБКА АУТЕНТИФИКАЦИИ SMTP');
      console.error('Для Gmail нужен пароль приложения, а не обычный пароль!');
      console.error('Инструкция: см. server/GMAIL_SETUP.md');
      console.error('Или: https://myaccount.google.com/apppasswords\n');
    }
    
    // В режиме разработки не падаем, а просто логируем
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n=== КОД ПОДТВЕРЖДЕНИЯ (ОШИБКА ОТПРАВКИ) ===`);
      console.log(`Email: ${email}`);
      console.log(`Код: ${code}`);
      console.log(`==========================================\n`);
      console.log('⚠️  Письмо не отправлено из-за ошибки SMTP');
      console.log('Код сохранён в базе данных, но письмо не доставлено.\n');
    } else {
      throw error;
    }
  }
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.requestCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Строгая валидация email - только корпоративная почта @rwb.ru
    const emailRegex = /^[a-zA-Z0-9._-]+@rwb\.ru$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Доступ разрешён только для корпоративной почты @rwb.ru'
      });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    // Удаляем старые коды для этого email
    await pool.query(
      'DELETE FROM auth_codes WHERE email = $1',
      [email]
    );

    // Сохраняем новый код
    await pool.query(
      'INSERT INTO auth_codes (email, code, expires_at, used) VALUES ($1, $2, $3, $4)',
      [email, code, expiresAt, false]
    );

    // Отправляем код
    await sendCodeEmail(email, code);

    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка при запросе кода:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    // Проверяем токен из куки или заголовка
    const token = req.cookies?.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('ОШИБКА: JWT_SECRET не установлен в переменных окружения!');
      return res.status(500).json({ success: false, authenticated: false });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ success: false, authenticated: false });
      }
      res.json({ success: true, authenticated: true, user: decoded, token });
    });
  } catch (error) {
    console.error('Ошибка при проверке авторизации:', error);
    res.status(500).json({ success: false, authenticated: false });
  }
};

exports.logout = async (req, res) => {
  // Удаляем куку с теми же параметрами безопасности
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/' // Важно: тот же path, что и при установке
  });
  res.json({ success: true });
};

exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Строгая валидация email - только корпоративная почта @rwb.ru
    const emailRegex = /^[a-zA-Z0-9._-]+@rwb\.ru$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Доступ разрешён только для корпоративной почты @rwb.ru'
      });
    }

    // Валидация кода - только цифры, 6 символов
    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат кода'
      });
    }

    // Проверяем код
    const result = await pool.query(
      `SELECT * FROM auth_codes 
       WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Неверный или истёкший код'
      });
    }

    // Помечаем код как использованный
    await pool.query(
      'UPDATE auth_codes SET used = true WHERE id = $1',
      [result.rows[0].id]
    );

    // Создаём или получаем пользователя
    let userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    let userId;
    if (userResult.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO users (email) VALUES ($1) RETURNING id',
        [email]
      );
      userId = insertResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // Генерируем JWT токен
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('ОШИБКА: JWT_SECRET не установлен в переменных окружения!');
      return res.status(500).json({ success: false, error: 'Ошибка конфигурации сервера' });
    }

    const token = jwt.sign(
      { userId, email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // По умолчанию 7 дней, можно настроить через переменную окружения
    );

    // Устанавливаем куку с безопасными настройками
    // httpOnly: true для защиты от XSS атак
    const maxAge = parseInt(process.env.JWT_EXPIRES_IN_MS || '604800000'); // 7 дней по умолчанию
    res.cookie('token', token, {
      httpOnly: true, // Защита от XSS - токен недоступен через JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS в продакшене
      sameSite: 'strict', // Защита от CSRF
      maxAge: maxAge,
      path: '/' // Важно: устанавливаем path для доступности на всех страницах
    });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Ошибка при проверке кода:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
};

