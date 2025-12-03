# Инструкция по запуску проекта на удаленной виртуальной машине

## Предварительные требования

Убедитесь, что на виртуальной машине установлены:
- Node.js (v14 или выше)
- PostgreSQL (v12 или выше)
- npm или yarn
- Git

Проверьте версии:
```bash
node --version
npm --version
psql --version
```

## Шаг 1: Установка зависимостей

Из корневой директории проекта выполните:

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

## Шаг 2: Установка PostgreSQL (если не установлен)

### На Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### На CentOS/RHEL:
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Через Docker (универсальный вариант):
```bash
docker run --name postgres-table-booking \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=table_booking \
  -p 5432:5432 \
  -d postgres:14
```

## Шаг 3: Настройка PostgreSQL

### Вариант 1: С использованием пароля

1. Переключитесь на пользователя postgres:
```bash
sudo -u postgres psql
```

2. Создайте базу данных и пользователя:
```sql
CREATE DATABASE table_booking;
CREATE USER table_booking_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE table_booking TO table_booking_user;
\q
```

3. Обновите настройки аутентификации (если необходимо):
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Измените метод аутентификации на `md5` или `scram-sha-256`:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

4. Перезапустите PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Вариант 2: Использование текущего пользователя системы

Если вы вошли в систему как пользователь, который может подключаться к PostgreSQL:
```bash
createdb table_booking
```

## Шаг 4: Создание файла .env

Создайте файл `.env` в папке `server`:

```bash
cd server
nano .env
```

Скопируйте следующий контент и измените значения на свои:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_booking
DB_USER=table_booking_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your-very-secure-secret-key-change-in-production-min-32-chars
NODE_ENV=production

# URL клиента (важно для CORS)
CLIENT_URL=http://your-server-ip:3000

# Настройка отправки email (опционально)
# По умолчанию коды подтверждения будут только в логах
DISABLE_EMAIL=true

# Или настройте реальную отправку:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@rwb.ru
```

**Важные моменты:**
- Замените `your_secure_password` на пароль, который вы задали для пользователя БД
- Замените `your-very-secure-secret-key-change-in-production-min-32-chars` на случайную строку минимум 32 символа
- Замените `your-server-ip` на IP-адрес или домен вашего сервера
- Если используете текущего пользователя системы, оставьте `DB_USER` пустым или укажите ваше имя пользователя

## Шаг 5: Создание базы данных

Если база данных еще не создана, выполните:

```bash
# Из корневой директории проекта
npm run create-db
```

Или вручную:
```bash
createdb table_booking
# или
sudo -u postgres createdb table_booking
```

## Шаг 6: Выполнение миграций

Создайте структуру таблиц и заполните тестовыми данными:

```bash
npm run migrate
npm run seed
```

Это создаст:
- Таблицы в базе данных
- 19 столов (схема офиса)
- 20 тестовых пользователей (user1@rwb.ru - user20@rwb.ru)

## Шаг 7: Запуск приложения

### Вариант 1: Запуск в режиме разработки (для тестирования)

В одном терминале:
```bash
npm run dev
```

Это запустит и backend, и frontend одновременно.

### Вариант 2: Запуск через process manager (рекомендуется для production)

#### Использование PM2:

1. Установите PM2:
```bash
npm install -g pm2
```

2. Соберите frontend:
```bash
cd client
npm run build
cd ..
```

3. Создайте файл `ecosystem.config.js` в корне проекта:
```javascript
module.exports = {
  apps: [
    {
      name: 'table-booking-server',
      script: './server/index.js',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

4. Запустите сервер через PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. Настройте nginx для раздачи статики и проксирования API:
```bash
sudo apt install nginx
```

Создайте конфигурацию `/etc/nginx/sites-available/table-booking`:
```nginx
server {
    listen 80;
    server_name your-server-ip;

    # Раздача статического контента frontend
    location / {
        root /path/to/TableBooking/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API запросов
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/table-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Альтернатива: Запуск через systemd

Создайте файл `/etc/systemd/system/table-booking.service`:
```ini
[Unit]
Description=Table Booking Server
After=network.target postgresql.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/TableBooking/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Запустите сервис:
```bash
sudo systemctl daemon-reload
sudo systemctl enable table-booking
sudo systemctl start table-booking
sudo systemctl status table-booking
```

## Шаг 8: Настройка файрвола (если используется)

Откройте необходимые порты:
```bash
# Для Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (если используете SSL)
sudo ufw enable

# Для CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Шаг 9: Проверка работы

1. Проверьте, что сервер запущен:
```bash
curl http://localhost:3001/api/health
```

Должен вернуться: `{"status":"ok"}`

2. Проверьте, что frontend доступен:
```bash
curl http://localhost:3000
```

3. Откройте в браузере: `http://your-server-ip`

## Полезные команды

### Просмотр логов сервера (PM2):
```bash
pm2 logs table-booking-server
```

### Перезапуск сервера (PM2):
```bash
pm2 restart table-booking-server
```

### Просмотр логов (systemd):
```bash
sudo journalctl -u table-booking -f
```

### Проверка подключения к БД:
```bash
psql -U table_booking_user -d table_booking -h localhost
```

### Обновление проекта:
```bash
git pull
cd server && npm install
cd ../client && npm install && npm run build
pm2 restart table-booking-server
# или
sudo systemctl restart table-booking
```

## Устранение проблем

### Ошибка подключения к БД:
- Проверьте, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте параметры в `server/.env`
- Проверьте, что пользователь БД существует и имеет права: `psql -U postgres -c "\du"`

### Ошибка "EADDRINUSE" (порт занят):
- Найдите процесс: `sudo lsof -i :3001`
- Убейте процесс: `sudo kill -9 <PID>`
- Или измените PORT в `.env`

### CORS ошибки:
- Проверьте, что `CLIENT_URL` в `.env` соответствует реальному URL
- Убедитесь, что frontend и backend используют правильные адреса

### Проблемы с правами доступа:
- Убедитесь, что пользователь, под которым запускается приложение, имеет права на чтение файлов проекта
- Проверьте права на директорию логов (если используете PM2): `mkdir -p logs && chmod 755 logs`

## Настройка SSL (опционально, для production)

Рекомендуется использовать Let's Encrypt для получения бесплатного SSL-сертификата:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

После этого обновите `CLIENT_URL` в `.env` на `https://your-domain.com`.

