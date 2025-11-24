const pool = require('../config/database');

// Схема столов на основе описания изображения
// Верхняя секция: 12 столов (1-12) в 3 ряда по 4 стола (горизонтальные овалы)
// Нижняя секция: 7 столов (13-19)
// - Столы 13-16: сетка 2x2 справа (вертикальные овалы)
// - Столы 17-18: два вертикальных овала слева
// - Стол 19: большой горизонтальный овал справа внизу
//
// ВАЖНО: Координаты заданы в базовых единицах помещения (640x650)
// Эти координаты будут масштабироваться пропорционально в клиентской части
// для сохранения соотношения сторон помещения и размеров столов
const desksConfig = [
  // Верхняя секция - 12 столов (1-12) - 3 ряда по 4 стола
  // Верхний ряд (горизонтальные овалы, столы 1-4 стоят вплотную друг к другу)
  // Office-map: width=640px, border=2px (box-sizing: border-box), внутренняя ширина=636px
  // Ширина стола=90px, правый border стола 4 касается внутренней части правого border office-map
  // x стола 4 = 636 - 90 = 546px
  // x стола 3 = 546 - 90 = 456px
  // x стола 2 = 456 - 90 = 366px
  // x стола 1 = 366 - 90 = 276px
  { id: 'desk-1', label: 'Стол 1', x: 276, y: 0, zone: 'upper' },
  { id: 'desk-2', label: 'Стол 2', x: 366, y: 0, zone: 'upper' },
  { id: 'desk-3', label: 'Стол 3', x: 456, y: 0, zone: 'upper' },
  { id: 'desk-4', label: 'Стол 4', x: 546, y: 0, zone: 'upper' },
  // Средний ряд (горизонтальные овалы, столы 5-8 стоят вплотную друг к другу)
  // Office-map: width=640px, border=2px (box-sizing: border-box), внутренняя ширина=636px
  // Ширина стола=90px, правый border стола 8 касается внутренней части правого border office-map
  // x стола 8 = 636 - 90 = 546px
  // x стола 7 = 546 - 90 = 456px
  // x стола 6 = 456 - 90 = 366px
  // x стола 5 = 366 - 90 = 276px
  { id: 'desk-5', label: 'Стол 5', x: 276, y: 140, zone: 'upper' },
  { id: 'desk-6', label: 'Стол 6', x: 366, y: 140, zone: 'upper' },
  { id: 'desk-7', label: 'Стол 7', x: 456, y: 140, zone: 'upper' },
  { id: 'desk-8', label: 'Стол 8', x: 546, y: 140, zone: 'upper' },
  // Нижний ряд верхней секции (горизонтальные овалы, столы 9-12 стоят вплотную друг к другу)
  // Верхняя граница ряда вплотную к нижней границе ряда 5-8 (y: 140 + высота 60 = 200)
  // Office-map: width=640px, border=2px (box-sizing: border-box), внутренняя ширина=636px
  // Ширина стола=90px, правый border стола 12 касается внутренней части правого border office-map
  // x стола 12 = 636 - 90 = 546px
  // x стола 11 = 546 - 90 = 456px
  // x стола 10 = 456 - 90 = 366px
  // x стола 9 = 366 - 90 = 276px
  { id: 'desk-9', label: 'Стол 9', x: 276, y: 200, zone: 'upper' },
  { id: 'desk-10', label: 'Стол 10', x: 366, y: 200, zone: 'upper' },
  { id: 'desk-11', label: 'Стол 11', x: 456, y: 200, zone: 'upper' },
  { id: 'desk-12', label: 'Стол 12', x: 546, y: 200, zone: 'upper' },
  
  // Нижняя секция - 7 столов (13-19)
  // Сетка 2x2 справа в центре (вертикальные овалы)
  // Верхний ряд сетки: 13 (слева), 14 (справа)
  // Нижний ряд сетки: 15 (слева), 16 (справа)
  { id: 'desk-13', label: 'Стол 13', x: 360, y: 390, zone: 'lower' },
  { id: 'desk-14', label: 'Стол 14', x: 480, y: 390, zone: 'lower' },
  { id: 'desk-15', label: 'Стол 15', x: 360, y: 490, zone: 'lower' },
  { id: 'desk-16', label: 'Стол 16', x: 480, y: 490, zone: 'lower' },
  // Два стола слева вертикально (средняя левая часть)
  { id: 'desk-17', label: 'Стол 17', x: 120, y: 400, zone: 'lower' },
  { id: 'desk-18', label: 'Стол 18', x: 120, y: 500, zone: 'lower' },
  // Большой стол справа внизу (горизонтальный овал)
  { id: 'desk-19', label: 'Стол 19', x: 520, y: 580, zone: 'lower' },
];

// 20 тестовых пользователей (n+1 от 19 столов)
const testUsers = Array.from({ length: 20 }, (_, i) => ({
  email: `user${i + 1}@rwb.ru`
}));

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Очищаем таблицы
    await client.query('TRUNCATE TABLE bookings CASCADE');
    await client.query('TRUNCATE TABLE desks CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');
    await client.query('TRUNCATE TABLE auth_codes CASCADE');
    await client.query('TRUNCATE TABLE auth_attempts CASCADE');

    // Добавляем столы
    for (const desk of desksConfig) {
      await client.query(
        'INSERT INTO desks (id, label, x, y, zone, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
        [desk.id, desk.label, desk.x, desk.y, desk.zone, true]
      );
    }

    // Добавляем тестовых пользователей
    for (const user of testUsers) {
      await client.query(
        'INSERT INTO users (email) VALUES ($1)',
        [user.email]
      );
    }

    await client.query('COMMIT');
    console.log('Тестовые данные созданы успешно');
    console.log(`Создано столов: ${desksConfig.length}`);
    console.log(`Создано пользователей: ${testUsers.length}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при создании тестовых данных:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

