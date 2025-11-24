const { Pool } = require('pg');
require('dotenv').config();

// Подключаемся к системной БД postgres для создания новой БД
// В Homebrew установке PostgreSQL пользователь по умолчанию - это текущий пользователь системы
const defaultUser = process.env.USER || process.env.USERNAME || 'postgres';
const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Подключаемся к системной БД
  user: process.env.DB_USER || defaultUser,
  password: process.env.DB_PASSWORD || '', // В Homebrew по умолчанию пароль не требуется
});

const dbName = process.env.DB_NAME || 'table_booking';

async function createDatabase() {
  const client = await adminPool.connect();
  
  try {
    // Проверяем, существует ли база данных
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`База данных "${dbName}" уже существует.`);
      return;
    }

    // Создаём базу данных
    // Примечание: CREATE DATABASE не может быть выполнен в транзакции
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`База данных "${dbName}" успешно создана!`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`База данных "${dbName}" уже существует.`);
    } else {
      console.error('Ошибка при создании базы данных:', error.message);
      console.error('\nУбедитесь, что:');
      console.error('1. PostgreSQL запущен');
      console.error('2. Пользователь имеет права на создание БД');
      console.error('3. Параметры подключения в .env файле корректны');
      console.error(`\nТекущий пользователь: ${defaultUser}`);
      process.exit(1);
    }
  } finally {
    client.release();
    await adminPool.end();
  }
}

createDatabase();
