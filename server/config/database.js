const { Pool } = require('pg');
require('dotenv').config();

// В Homebrew установке PostgreSQL пользователь по умолчанию - это текущий пользователь системы
const defaultUser = process.env.USER || process.env.USERNAME || 'postgres';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_booking',
  user: process.env.DB_USER || defaultUser,
  password: process.env.DB_PASSWORD || '', // В Homebrew по умолчанию пароль не требуется
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

