# Настройка SMTP для отправки email

## Варианты настройки SMTP

### 1. Gmail (рекомендуется для тестирования)

1. Включите двухфакторную аутентификацию в вашем Google аккаунте
2. Создайте пароль приложения:
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Почта" и "Другое устройство"
   - Введите название (например, "Table Booking")
   - Скопируйте сгенерированный пароль (16 символов)

3. Добавьте в `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@rwb.ru
```

### 2. Yandex Mail

```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-password
SMTP_FROM=noreply@rwb.ru
```

### 3. Mail.ru

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@mail.ru
SMTP_PASS=your-password
SMTP_FROM=noreply@rwb.ru
```

### 4. Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=noreply@rwb.ru
```

### 5. Корпоративный SMTP сервер

Если у вас есть корпоративный SMTP сервер:

```env
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourcompany.com
SMTP_PASS=your-password
SMTP_FROM=noreply@rwb.ru
```

## Проверка настройки

После настройки перезапустите сервер и проверьте:

```bash
cd server
npm run dev
```

При запуске в консоли должно появиться:
```
SMTP транспортер настроен из переменных окружения
```

При запросе кода письмо должно быть отправлено на указанный email адрес.

## Отключение отправки email

Если нужно временно отключить отправку (только логирование в консоль):

```env
DISABLE_EMAIL=true
```

