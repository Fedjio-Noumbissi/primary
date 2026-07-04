import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: '163.123.183.89',
    port: 17705,
    user: 'ecole',
    password: 'peda2026',
    database: 'ecole2026'
  });
  try {
    // Try to add idCycle column
    await pool.query('ALTER TABLE eleves ADD COLUMN idCycle INT NULL');
    console.log('idCycle column added to eleves');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('idCycle already exists');
    } else {
      console.error('Error adding column:', err.message);
    }
  }

  // Check cycles
  try {
    const [cycles] = await pool.query('SELECT * FROM Cycle');
    console.log('Cycles:', cycles);
  } catch (err) {
    console.error(err);
  }

  process.exit();
}
run();
