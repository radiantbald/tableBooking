# Настройка Gmail для отправки email

## Проблема
Gmail не принимает обычный пароль для SMTP. Нужен **пароль приложения** (Application-specific password).

## Решение: Создание пароля приложения

### Шаг 1: Включите двухфакторную аутентификацию

1. Перейдите: https://myaccount.google.com/security
2. В разделе "Вход в аккаунт Google" найдите "Двухэтапная аутентификация"
3. Включите её, если ещё не включена

### Шаг 2: Создайте пароль приложения

1. Перейдите: https://myaccount.google.com/apppasswords
   - Или: Google Account → Security → 2-Step Verification → App passwords

2. Выберите:
   - **Приложение**: Почта
   - **Устройство**: Другое (Custom name)
   - Введите название: `Table Booking` или любое другое

3. Нажмите "Создать"

4. **Скопируйте 16-символьный пароль** (без пробелов)
   - Пример: `abcd efgh ijkl mnop` → используйте `abcdefghijklmnop`

### Шаг 3: Обновите .env файл

Откройте `server/.env` и замените `SMTP_PASS` на пароль приложения:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=radiantbald@gmail.com
SMTP_PASS=ваш-16-символьный-пароль-приложения
SMTP_FROM=noreply@rwb.ru
```

**Важно:** Используйте пароль приложения, а не обычный пароль!

### Шаг 4: Проверьте настройку

```bash
cd server
npm run test-email
```

Если всё правильно, вы увидите:
```
✅ SMTP подключение успешно!
✅ Тестовое письмо отправлено!
```

### Альтернатива: Использование OAuth2

Для более безопасного варианта можно использовать OAuth2, но это сложнее в настройке.

## Частые проблемы

### "Application-specific password required"
- Вы используете обычный пароль вместо пароля приложения
- Решение: создайте пароль приложения (см. выше)

### "Less secure app access"
- Gmail больше не поддерживает "менее безопасные приложения"
- Решение: используйте пароль приложения (см. выше)

### Письма попадают в спам
- Проверьте папку "Спам" в Gmail
- Добавьте отправителя в контакты

## Полезные ссылки

- Создание пароля приложения: https://myaccount.google.com/apppasswords
- Настройки безопасности: https://myaccount.google.com/security
- Помощь Gmail: https://support.google.com/mail/?p=InvalidSecondFactor

