const pool = require('../config/database');

// Скрипт для обновления координат столов 9-12
// Перемещает ряд столов 9-12 так, чтобы верхняя граница ряда была вплотную
// к нижней границе ряда столов 5-8
async function updateDeskPositions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Обновляем координаты y для столов 9-12
    // Ряд 5-8 находится на y: 140, высота стола: 60
    // Нижняя граница ряда 5-8: 140 + 60 = 200
    // Верхняя граница ряда 9-12 должна быть на y: 200
    const updateQuery = `
      UPDATE desks 
      SET y = 200 
      WHERE id IN ('desk-9', 'desk-10', 'desk-11', 'desk-12')
    `;
    
    const result = await client.query(updateQuery);
    
    await client.query('COMMIT');
    console.log(`Координаты успешно обновлены для ${result.rowCount} столов`);
    console.log('Столы 9-12 перемещены вплотную к нижней границе ряда 5-8');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при обновлении координат:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

updateDeskPositions();

