/**
 * AUTH CONTROLLER
 * Capa de control - Maneja peticiones HTTP y delega lógica al servicio
 */

const authService = require('../services/authService');
const usersRepository = require('../repositories/authServiceRepository');
const { sanitizeUsername, sanitizeEmail } = require('../utils/sanitize');
const AppError = require('../errors/AppError');

/*-------------RENDERS DE VISTAS-------------*/
/**
 * GET /register
 * Renderiza la vista de registro
 */
async function registerRenderView(req, res) {
  res.render('authService/register');
}

/**
 * GET /login
 * Renderiza la vista de inicio de sesión
 */
async function loginRenderView(req, res) {
  res.render('authService/login');
}
/**
 * GET /me
 * Renderiza la vista de perfil del usuario
 */
async function meRenderView(req, res) {
  res.render('authService/me');
}

/**
 * GET /recovery
 * Renderiza la vista de recuperación de contraseña
 */
async function recoveryRenderView(req, res) {
  res.render('authService/recovery');
}

/*------------ACCIONES------------*/
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
  
  const { email, password, remember_me } = req.body;

  
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
      remember_me: remember_me,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    });

    if (remember_me) {
      
      res.cookie('refresh_token', result.refreshTokenHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh', // 🔒 clave
        maxAge: 30 * 24 * 60 * 60 * 1000
      } );
      
    }else {

      res.cookie('refresh_token', result.refreshTokenHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth/refresh' // 🔒 clave
      } );
    }

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

/**
 * POST /recovery
 * Envía instrucciones para recuperar contraseña
 */
async function recovery(req, res) {
  res.render('auth/recovery');
}

/**
 * POST /auth/refresh
 * Refresca el token de acceso
 */
async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const { accessToken, refreshToken: newRefreshToken, expiresAt } =
      await authService.refreshSession(
        refreshToken,
        req.ip,
        req.headers['user-agent']
      );   

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh'
    };

    if (expiresAt) {
      cookieOptions.expires = expiresAt;
    }

    res.cookie('refresh_token', newRefreshToken, cookieOptions);

    return res.json({ accessToken });

  } catch (error) {
    console.error('[REFRESH ERROR]', error);

    res.clearCookie('refresh_token', {
      path: '/auth/refresh'
    });

    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}


/*------------CHECKEO DATOS------------*/
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

module.exports = {
  /*-------------RENDERS DE VISTAS-------------*/
  loginRenderView,
  registerRenderView,
  recoveryRenderView,
  meRenderView,
  /*------------ACCIONES------------*/
  register,
  login,
  recovery,
  refreshToken,
  /*------------CHECKEO DATOS------------*/
  checkUsername,
  checkEmail
};
