const pool = require('../config/database');

async function migrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Таблица users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица desks
    await client.query(`
      CREATE TABLE IF NOT EXISTS desks (
        id VARCHAR(50) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        zone VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        desk_id VARCHAR(50) NOT NULL REFERENCES desks(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(desk_id, date),
        UNIQUE(user_id, date)
      )
    `);

    // Таблица auth_codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Индексы
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_desk_id ON bookings(desk_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email)
    `);

    await client.query('COMMIT');
    console.log('Миграции выполнены успешно');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при выполнении миграций:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

