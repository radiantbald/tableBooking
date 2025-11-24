# Установка и настройка базы данных PostgreSQL

## Вариант 1: Установка через Homebrew (macOS)

```bash
# Установка PostgreSQL
brew install postgresql@14

# Запуск PostgreSQL
brew services start postgresql@14

# Или запуск вручную (без автозапуска)
pg_ctl -D /usr/local/var/postgresql@14 start
```

## Вариант 2: Установка через официальный установщик

1. Скачайте PostgreSQL с официального сайта: https://www.postgresql.org/download/macosx/
2. Установите через установщик
3. PostgreSQL будет запущен автоматически

## Вариант 3: Использование Docker

```bash
# Запуск PostgreSQL в Docker
docker run --name postgres-table-booking \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=table_booking \
  -p 5432:5432 \
  -d postgres:14

# Или если база уже создана
docker run --name postgres-table-booking \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14
```

## Проверка установки

После установки проверьте, что PostgreSQL запущен:

```bash
# Проверка статуса (Homebrew)
brew services list | grep postgresql

# Или проверка через psql
psql --version
```

## Создание базы данных

После того как PostgreSQL запущен, выполните:

```bash
# Из корневой директории проекта
npm run create-db
```

Или вручную через psql:

```bash
# Подключение к PostgreSQL
psql -U postgres

# В консоли PostgreSQL выполните:
CREATE DATABASE table_booking;

# Выход
\q
```

## Настройка .env файла

Убедитесь, что файл `server/.env` содержит правильные параметры подключения:

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_booking
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Важно:** Измените `DB_PASSWORD` на ваш реальный пароль PostgreSQL, если он отличается от `postgres`.

## Выполнение миграций

После создания базы данных выполните миграции:

```bash
npm run migrate
npm run seed
```

## Устранение проблем

### Ошибка "ECONNREFUSED"
- Убедитесь, что PostgreSQL запущен
- Проверьте, что порт 5432 не занят другим приложением
- Проверьте параметры подключения в `.env` файле

### Ошибка "password authentication failed"
- Проверьте пароль в `.env` файле
- Убедитесь, что пользователь `postgres` существует и имеет нужные права

### Ошибка "database does not exist"
- Выполните `npm run create-db` для создания базы данных

