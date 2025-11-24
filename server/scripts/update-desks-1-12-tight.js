const pool = require('../config/database');

// Скрипт для обновления координат столов 1-12
// Располагает столы в каждом ряду (1-4, 5-8, 9-12) вплотную друг к другу
// Правый border правого стола в каждом ряду касается внутренней части правого border office-map
// Office-map: width=640px, border=2px (box-sizing: border-box)
// Внутренняя ширина = 640px - 4px = 636px (по 2px с каждой стороны)
// Ширина стола = 90px
// x правого стола = 636 - 90 = 546px
// x третьего стола = 546 - 90 = 456px
// x второго стола = 456 - 90 = 366px
// x первого стола = 366 - 90 = 276px
async function updateDesks1to12Tight() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Обновляем координаты x для всех столов верхней секции (1-12)
    // В каждом ряду столы должны стоять вплотную, правый border правого стола касается внутренней части правого border office-map
    const updateQuery = `
      UPDATE desks 
      SET x = CASE 
        -- Первый ряд (1-4)
        WHEN id = 'desk-1' THEN 276
        WHEN id = 'desk-2' THEN 366
        WHEN id = 'desk-3' THEN 456
        WHEN id = 'desk-4' THEN 546
        -- Второй ряд (5-8)
        WHEN id = 'desk-5' THEN 276
        WHEN id = 'desk-6' THEN 366
        WHEN id = 'desk-7' THEN 456
        WHEN id = 'desk-8' THEN 546
        -- Третий ряд (9-12)
        WHEN id = 'desk-9' THEN 276
        WHEN id = 'desk-10' THEN 366
        WHEN id = 'desk-11' THEN 456
        WHEN id = 'desk-12' THEN 546
        ELSE x
      END
      WHERE id IN ('desk-1', 'desk-2', 'desk-3', 'desk-4', 'desk-5', 'desk-6', 'desk-7', 'desk-8', 'desk-9', 'desk-10', 'desk-11', 'desk-12')
    `;
    
    const result = await client.query(updateQuery);
    
    await client.query('COMMIT');
    console.log(`Координаты успешно обновлены для ${result.rowCount} столов`);
    console.log('Столы 1-12 расположены вплотную друг к другу в каждом ряду');
    console.log('Правый border правого стола в каждом ряду касается внутренней части правого border office-map');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при обновлении координат:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

updateDesks1to12Tight();

