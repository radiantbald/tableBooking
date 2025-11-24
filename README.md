# Сервис бронирования мест в офисе

Веб-приложение для бронирования рабочих мест в офисе с авторизацией по корпоративной почте @rwb.ru.

## Технологии

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, TypeScript
- **Авторизация**: JWT токены, одноразовые коды подтверждения

## Установка и запуск

### Предварительные требования

- Node.js (v14 или выше)
- PostgreSQL (v12 или выше)
- npm или yarn

### 1. Установка зависимостей

```bash
# Установка всех зависимостей (root, server, client)
npm run install-all
```

Или по отдельности:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Установка и настройка PostgreSQL

#### Если PostgreSQL не установлен:

**Вариант 1: Установка через Homebrew (macOS)**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Вариант 2: Использование Docker**
```bash
docker run --name postgres-table-booking \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=table_booking \
  -p 5432:5432 \
  -d postgres:14
```

**Вариант 3: Скачайте с официального сайта**
https://www.postgresql.org/download/

#### Создание базы данных

После установки и запуска PostgreSQL создайте базу данных:

```bash
# Автоматически через скрипт
npm run create-db
```

Или вручную:
```sql
CREATE DATABASE table_booking;
```

#### Настройка .env файла

Создайте файл `.env` в папке `server`:

```bash
cd server
cp .env.example .env
```

Отредактируйте `.env` с вашими настройками:

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_booking
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Настройка отправки email (опционально):**

По умолчанию используется тестовый сервис Ethereal Email. Для реальной отправки на почту:

**Вариант 1: Интерактивная настройка (рекомендуется)**
```bash
cd server
npm run setup-smtp
```

**Вариант 2: Ручная настройка**

Отредактируйте `server/.env` и раскомментируйте/заполните настройки SMTP:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@rwb.ru
```

**Для Gmail:** нужен пароль приложения (см. https://myaccount.google.com/apppasswords)

**Отключить отправку email (только логирование в консоль):**
```
DISABLE_EMAIL=true
```

Подробная инструкция: см. `server/SMTP_SETUP.md`

### 3. Выполнение миграций и заполнение тестовыми данными

```bash
cd server
npm run migrate
npm run seed
```

Это создаст:
- Таблицы в базе данных
- 19 столов (схема офиса)
- 20 тестовых пользователей (user1@rwb.ru - user20@rwb.ru)

### 4. Запуск приложения

#### Вариант 1: Запуск всего приложения одной командой

```bash
npm run dev
```

#### Вариант 2: Запуск отдельно

В одном терминале (backend):
```bash
cd server
npm run dev
```

В другом терминале (frontend):
```bash
cd client
npm start
```

Backend будет доступен на `http://localhost:3001`
Frontend будет доступен на `http://localhost:3000`

## Использование

1. Откройте браузер и перейдите на `http://localhost:3000`
2. Введите email с доменом @rwb.ru (например, `user1@rwb.ru`)
3. Нажмите "Получить код"
4. В консоли сервера (в режиме разработки) будет выведен код подтверждения
5. Введите код и нажмите "Войти"
6. Выберите дату (только будние дни)
7. Кликните на свободный стол для бронирования

## Тестовые данные

После выполнения `npm run seed` создаются 20 тестовых пользователей:
- user1@rwb.ru
- user2@rwb.ru
- ...
- user20@rwb.ru

**Отправка кодов подтверждения:**
- По умолчанию используется тестовый сервис Ethereal Email
- В консоли сервера выводится ссылка для просмотра письма
- Для реальной отправки настройте SMTP в `.env` файле (см. раздел "Использование")

## API Endpoints

### Авторизация

- `POST /api/auth/request-code` - Запрос кода подтверждения
- `POST /api/auth/verify-code` - Проверка кода и получение токена

### Столы

- `GET /api/desks?date=YYYY-MM-DD` - Получить список столов на дату (требует авторизации)

### Бронирования

- `POST /api/bookings` - Создать бронирование (требует авторизации)
- `GET /api/bookings/me` - Получить свои бронирования (требует авторизации)

## Структура проекта

```
TableBooking/
├── server/                 # Backend
│   ├── config/            # Конфигурация БД
│   ├── controllers/       # Контроллеры
│   ├── middleware/        # Middleware (auth)
│   ├── routes/            # Маршруты
│   ├── scripts/           # Скрипты миграций и seed
│   └── index.js           # Точка входа
├── client/                # Frontend
│   ├── src/
│   │   ├── api/           # API клиент
│   │   ├── components/    # React компоненты
│   │   ├── context/       # React Context (Auth)
│   │   └── App.tsx        # Главный компонент
│   └── public/
└── README.md
```

## Особенности

- Авторизация только для email с доменом @rwb.ru
- Одноразовые коды подтверждения (6 цифр, действуют 15 минут)
- Календарь с выбором только будних дней
- Интерактивная карта офиса с 19 столами
- Визуальная индикация статуса столов (свободен/занят/мой)
- Защита от двойного бронирования на уровне БД
- Ограничение: один пользователь - один стол на дату

## Разработка

### Логирование кодов подтверждения

В режиме разработки (`NODE_ENV=development`) коды подтверждения выводятся в консоль сервера вместо отправки на email.

### Схема столов

Схема столов задаётся в `server/scripts/seed.js`. Можно легко изменить координаты и количество столов.

## Лицензия

ISC

