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
    const [eleves] = await pool.query('DESCRIBE eleves');
    console.log('Eleves:', JSON.stringify(eleves, null, 2));
    const [cycles] = await pool.query('SELECT * FROM Cycle');
    console.log('Cycles:', JSON.stringify(cycles, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
run();
