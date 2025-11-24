const pool = require('../config/database');

// Скрипт для обновления координат столов 1-12
// Смещает правую границу рядов влево, чтобы столы не выходили за правый край office-map
// Создает правый отступ, аналогичный левому отступу (200px)
async function updateDeskRightMargin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Обновляем координаты x для правых столов (4, 8, 12)
    // Office-map: width=640px, border=2px (box-sizing: border-box), внутренняя ширина=636px
    // Правый border стола должен касаться внутренней части правого border office-map
    // Ширина стола=80px, поэтому x = 636 - 80 = 556px
    const updateQuery = `
      UPDATE desks 
      SET x = CASE 
        WHEN id = 'desk-4' THEN 556
        WHEN id = 'desk-8' THEN 556
        WHEN id = 'desk-12' THEN 556
        ELSE x
      END
      WHERE id IN ('desk-4', 'desk-8', 'desk-12')
    `;
    
    const result = await client.query(updateQuery);
    
    await client.query('COMMIT');
    console.log(`Координаты успешно обновлены для ${result.rowCount} столов`);
    console.log('Правые столы (4, 8, 12) установлены так, чтобы правый border касался внутренней части правого border office-map');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при обновлении координат:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

updateDeskRightMargin();

