const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSMTP() {
  console.log('\n=== Настройка SMTP для отправки email ===\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  // Читаем существующий .env файл, если есть
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Создаём базовый .env файл
    envContent = `PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_booking
DB_USER=${process.env.USER || 'postgres'}
DB_PASSWORD=
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

`;
  }

  console.log('Выберите провайдера SMTP:');
  console.log('1. Gmail');
  console.log('2. Yandex Mail');
  console.log('3. Mail.ru');
  console.log('4. Outlook/Hotmail');
  console.log('5. Другой (ввести вручную)');
  console.log('6. Отключить отправку email (только консоль)');
  
  const choice = await question('\nВаш выбор (1-6): ');
  
  let smtpConfig = '';
  
  switch(choice) {
    case '1': // Gmail
      console.log('\n--- Настройка Gmail ---');
      console.log('Для Gmail нужен пароль приложения:');
      console.log('1. Включите двухфакторную аутентификацию');
      console.log('2. Создайте пароль приложения: https://myaccount.google.com/apppasswords');
      console.log('3. Выберите "Почта" и "Другое устройство"');
      console.log('4. Введите название (например, "Table Booking")');
      console.log('5. Скопируйте 16-символьный пароль\n');
      
      const gmailUser = await question('Email (your-email@gmail.com): ');
      const gmailPass = await question('Пароль приложения (16 символов): ');
      
      smtpConfig = `SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${gmailUser}
SMTP_PASS=${gmailPass}
SMTP_FROM=noreply@rwb.ru
`;
      break;
      
    case '2': // Yandex
      console.log('\n--- Настройка Yandex Mail ---');
      const yandexUser = await question('Email (your-email@yandex.ru): ');
      const yandexPass = await question('Пароль: ');
      
      smtpConfig = `SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=${yandexUser}
SMTP_PASS=${yandexPass}
SMTP_FROM=noreply@rwb.ru
`;
      break;
      
    case '3': // Mail.ru
      console.log('\n--- Настройка Mail.ru ---');
      const mailruUser = await question('Email (your-email@mail.ru): ');
      const mailruPass = await question('Пароль: ');
      
      smtpConfig = `SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=${mailruUser}
SMTP_PASS=${mailruPass}
SMTP_FROM=noreply@rwb.ru
`;
      break;
      
    case '4': // Outlook
      console.log('\n--- Настройка Outlook/Hotmail ---');
      const outlookUser = await question('Email (your-email@outlook.com): ');
      const outlookPass = await question('Пароль: ');
      
      smtpConfig = `SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=${outlookUser}
SMTP_PASS=${outlookPass}
SMTP_FROM=noreply@rwb.ru
`;
      break;
      
    case '5': // Другой
      console.log('\n--- Настройка пользовательского SMTP ---');
      const customHost = await question('SMTP Host (например, smtp.example.com): ');
      const customPort = await question('SMTP Port (587 или 465): ');
      const customSecure = await question('Использовать SSL/TLS? (y/n, для порта 465 обычно y): ');
      const customUser = await question('Email/Username: ');
      const customPass = await question('Пароль: ');
      const customFrom = await question('From адрес (noreply@rwb.ru): ') || 'noreply@rwb.ru';
      
      smtpConfig = `SMTP_HOST=${customHost}
SMTP_PORT=${customPort}
SMTP_SECURE=${customSecure.toLowerCase() === 'y' ? 'true' : 'false'}
SMTP_USER=${customUser}
SMTP_PASS=${customPass}
SMTP_FROM=${customFrom}
`;
      break;
      
    case '6': // Отключить
      smtpConfig = `DISABLE_EMAIL=true
`;
      break;
      
    default:
      console.log('Неверный выбор. Настройка отменена.');
      rl.close();
      return;
  }
  
  // Удаляем старые SMTP настройки из .env
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    return !line.startsWith('SMTP_') && 
           !line.startsWith('# Настройки SMTP') &&
           !line.startsWith('# Раскомментируйте') &&
           line.trim() !== '';
  });
  
  // Добавляем новые настройки
  const newEnvContent = filteredLines.join('\n') + '\n# Настройки SMTP для отправки email\n' + smtpConfig;
  
  // Сохраняем .env файл
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ SMTP настройки сохранены в server/.env');
  console.log('\nДля применения изменений перезапустите сервер.');
  
  if (choice !== '6') {
    console.log('\nДля проверки отправьте тестовый запрос кода подтверждения.');
  }
  
  rl.close();
}

setupSMTP().catch(err => {
  console.error('Ошибка:', err);
  rl.close();
  process.exit(1);
});

