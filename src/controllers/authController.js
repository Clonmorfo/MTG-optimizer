/**
 * AUTH CONTROLLER
 * Capa de control - Maneja peticiones HTTP y delega lógica al servicio
 */

const authService = require('../services/authService');
const usersRepository = require('../repositories/usersRepository');
const { sanitizeUsername, sanitizeEmail } = require('../utils/sanitize');
const AppError = require('../errors/AppError');

/**
 * GET /check-username
 * Verifica disponibilidad de username
 */
async function checkUsername(req, res) {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: 'Username requerido' });
  }

  try {
    const result = await authService.checkUsernameAvailability(username);
    res.json(result);
  } catch (error) {
    console.error('Error verificando username:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

/**
 * GET /me
 * Devuelve información mínima del usuario autenticado
 */
async function me(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });

  try {
    const user = await usersRepository.getAuthById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Mapear tipo (texto) a número según convención: user=0, operator=1, admin=2, owner=3
    const type = (user.type || 'user').toLowerCase();
    let role = 0;
    if (type === 'operator') role = 1;
    if (type === 'admin') role = 2;
    if (type === 'owner') role = 3;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role,
      roleName: type
    });
  } catch (err) {
    console.error('[ME ERROR]', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

/**
 * GET /check-email
 * Verifica disponibilidad de email
 */
async function checkEmail(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }

  try {
    const result = await authService.checkEmailAvailability(email);
    res.json(result);
  } catch (error) {
    console.error('Error verificando email:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

/**
 * POST /register
 * Registra un nuevo usuario
 */
async function register(req, res) {
  let { username, email, password, two_factor } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    // Sanitizar inputs
    username = sanitizeUsername(username);
    email = sanitizeEmail(email);

    // Llamar servicio de registro
    const result = await authService.registerUser({
      username,
      email,
      password,
      two_factor
    });

    res.status(201).json(result);
  } catch (error) {
    // Errores de aplicación con estatus personalizado
    if (error instanceof AppError) {
      console.error(`[REGISTER ERROR] ${error.name}: ${error.message}`);
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    // Errores de BD
    if (error.code === '23514') {
      console.error('[REGISTER ERROR] Violación de CHECK:', error.detail);
      return res.status(400).json({
        error: 'Datos inválidos'
      });
    }

    if (error.code === '23502') {
      console.error('[REGISTER ERROR] Violación de not-null constraint:', error.detail);
      return res.status(400).json({
        error: 'Error en base datos: campo requerido faltante. Contactar al soporte'
      });
    }

    if (error.code === '23505') {
      console.error('[REGISTER ERROR] Duplicado en BD:', error.detail);
      return res.status(409).json({
        error: 'El usuario o el mail no están disponibles'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      console.error('[REGISTER ERROR] BD no disponible');
      return res.status(503).json({
        error: 'Servicio de base de datos no disponible'
      });
    }

    // Fallback seguro
    console.error('[REGISTER ERROR] Error desconocido:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

/**
 * POST /login
 * Inicia sesión de un usuario
 */
async function login(req, res) {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  try {
    // Sanitizar email
    const sanitizedEmail = email.trim().toLowerCase();

    // Llamar servicio de login
    const result = await authService.loginUser({
      email: sanitizedEmail,
      password,
      remember_me: rememberMe,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Enviar refresh token en cookie HttpOnly
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
    });

    // Responder con acceso token (refresh token va en cookie)
    res.json({
      success: true,
      userId: result.userId,
      accessToken: result.accessToken
    });
  } catch (error) {
    // Errores de aplicación con estatus personalizado
    if (error instanceof AppError) {
      console.error(`[LOGIN ERROR] ${error.name}: ${error.message}`);
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    // Errores de BD
    if (error.code === 'ECONNREFUSED') {
      console.error('[LOGIN ERROR] BD no disponible');
      return res.status(503).json({
        success: false,
        error: 'Servicio de base de datos no disponible'
      });
    }

    // Fallback seguro
    console.error('[LOGIN ERROR] Error desconocido:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

module.exports = {
  checkUsername,
  checkEmail,
  register,
  login,
  me
};
