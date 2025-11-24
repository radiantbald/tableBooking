require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('\n=== Тест отправки email ===\n');
  
  // Проверяем настройки
  console.log('Проверка настроек:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'не установлен');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'не установлен');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***установлен***' : 'не установлен');
  console.log('DISABLE_EMAIL:', process.env.DISABLE_EMAIL || 'не установлен');
  console.log('');
  
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('❌ Отправка email отключена (DISABLE_EMAIL=true)');
    return;
  }
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ SMTP настройки не заполнены');
    console.log('Используется тестовый Ethereal Email');
    console.log('');
    
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      const info = await transporter.sendMail({
        from: 'noreply@rwb.ru',
        to: 'test@rwb.ru',
        subject: 'Тестовое письмо',
        text: 'Это тестовое письмо',
        html: '<p>Это тестовое письмо</p>'
      });
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('✅ Тестовое письмо отправлено через Ethereal Email');
      console.log('Просмотр письма:', previewUrl);
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
    }
    return;
  }
  
  // Тестируем реальный SMTP
  console.log('Тестирование SMTP подключения...\n');
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Проверяем подключение
    await transporter.verify();
    console.log('✅ SMTP подключение успешно!\n');
    
    // Отправляем тестовое письмо
    const testEmail = process.env.SMTP_USER; // Отправляем на тот же адрес
    console.log(`Отправка тестового письма на ${testEmail}...`);
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: 'Тестовое письмо - Table Booking',
      text: 'Это тестовое письмо для проверки SMTP настроек',
      html: '<p>Это тестовое письмо для проверки SMTP настроек</p><p>Если вы получили это письмо, значит SMTP настроен правильно!</p>'
    });
    
    console.log('✅ Тестовое письмо отправлено!');
    console.log('Message ID:', info.messageId);
    console.log(`\nПроверьте почту ${testEmail} (включая папку "Спам")\n`);
    
  } catch (error) {
    console.error('\n❌ Ошибка при отправке email:');
    console.error('Код:', error.code);
    console.error('Сообщение:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 Проблема с аутентификацией:');
      console.error('- Проверьте правильность логина и пароля');
      console.error('- Для Gmail используйте пароль приложения (не обычный пароль)');
      console.error('- Убедитесь, что включена двухфакторная аутентификация');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Проблема с подключением:');
      console.error('- Проверьте правильность SMTP_HOST и SMTP_PORT');
      console.error('- Убедитесь, что SMTP сервер доступен');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Таймаут подключения:');
      console.error('- Проверьте настройки файрвола');
      console.error('- Попробуйте другой порт (587 или 465)');
    }
  }
}

testEmail();

