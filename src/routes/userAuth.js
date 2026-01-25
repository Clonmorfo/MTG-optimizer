var express = require('express');
const argon2 = require('argon2');
var router = express.Router();
const pool = require('../db/pool');
const { sanitizeUsername, sanitizeEmail } = require('../utils/sanitize');
const { hashPassword } = require('../utils/password');
const { generateAccessToken } = require('../auth/jwt');
const crypto = require('crypto');

router.get('/check-username', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username requerido' });
  }

  try {
    const result = await pool.query(
      'SELECT 1 FROM ua_user WHERE username = $1 LIMIT 1',
      [username]
    );

    res.json({ available: result.rowCount === 0 });

  } catch (error) {
    console.error('Error verificando username:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/check-email', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const result = await pool.query(
      'SELECT 1 FROM ua_user WHERE email = $1 LIMIT 1',
      [email]
    );

    res.json({ available: result.rowCount === 0 });

  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

router.post('/register', async (req, res) => {
  let { username, email, password, two_factor } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  
  // Sanitizar inputs
  username = sanitizeUsername(username);
  email    = sanitizeEmail(email);
  try {
    // 1. Verificar duplicados
    const exists = await pool.query(
      'SELECT 1 FROM ua_user WHERE username = $1 OR email = $2 LIMIT 1',
      [username, email]
    );

    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'El usuario o el mail no estan disponibles' });
    }

    // 2. Hash de password
    const passwordHash = await hashPassword(password);

    // 3. Insert
    await pool.query(
      `INSERT INTO ua_user 
       (username, email, password, two_factor, status, created_at)
       VALUES ($1, $2, $3, $4, 0, NOW())`,
      [username, email, passwordHash, two_factor]
    );

    res.status(201).json({ success: true });

  } catch (error) {
    console.error('[REGISTER ERROR]', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });

    // Violación de UNIQUE (username o email duplicado)
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'El usuario o el mail no estan disponibles'
      });
    }

    // Violación de CHECK (status fuera de rango, etc.)
    if (error.code === '23514') {
      return res.status(400).json({
        error: 'Datos inválidos'
      });
    }

    // Error de conexión a BD
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Servicio de base de datos no disponible'
      });
    }

    // Fallback seguro
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }
 
  try {
     // Sanitizar inputs
    const sanitizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      'SELECT id, password, status FROM ua_user WHERE email = $1 LIMIT 1',
      [sanitizedEmail]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos' });
    }
    if (result.rows[0].status === 2) {
      return res.status(400).json({ success: false, error: 'El usuario está temporalmente desactivado' });
    }
    if (result.rows[0].status === 3) {
      return res.status(400).json({ success: false, error: 'El usuario está permanentemente desactivado' });
    }

    const user = result.rows[0];
    
    // Verificar password
    const isValid = await argon2.verify(user.password, password);

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Usuario o contraseña incorrectos' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = crypto.randomBytes(64).toString('hex'); // token seguro
    const refreshTokenHash = await argon2.hash(refreshToken);

     await pool.query(
      `INSERT INTO ua_session 
        (user_id, refresh_token, ip_request, user_agent, expires_at, used)
       VALUES ($1,$2,$3,$4,NOW() + interval '${rememberMe ? '90 days' : '30 days'}', false)`,
      [user.id, refreshTokenHash, req.ip, req.headers['user-agent']]
    );
    

    // Enviamos refresh token en cookie HttpOnly
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // solo HTTPS en producción
      sameSite: 'strict',
      maxAge: rememberMe ? 90*24*60*60*1000 : 30*24*60*60*1000
    });

    // Auditoria de log in
    await pool.query(
      `UPDATE ua_user 
       SET last_login = NOW() 
       WHERE id = $1`,
      [user.id]
    );

    res.json({ success: true, userId: user.id, accessToken, refreshToken });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}); 

module.exports = router;