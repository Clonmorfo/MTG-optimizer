const pool = require('./pool'); // o como se llame tu archivo de conexión

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conectado a la BD:', res.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error de conexión a la BD:', error);
    process.exit(1);
  }
})();