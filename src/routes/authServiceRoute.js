var express = require('express');
var router = express.Router();
const authController = require('../controllers/authServiceController');
const authMiddleware = require('../middleware/authMiddleware');
const {loginLimiter, registerLimiter } = require('../middleware/rateLimitMiddleware');

/*-------------RUTAS GET -----------*/

/**
 * GET /register
 * Renderiza la vista de inicio de sesión
 */
router.get('/register', authMiddleware({ guestOnly: true }), authController.registerRenderView);

/**
 * GET /login
 * Renderiza la vista de inicio de sesión
*/
router.get('/login', authMiddleware({ guestOnly: true }), authController.loginRenderView);

/**
 * GET /recovery
 * Renderiza la vista de recuperación de contraseña
 */
router.get('/recovery', authMiddleware({ guestOnly: true }), authController.recoveryRenderView);

/**
 * GET /me
 * Renderiza la vista de perfil del usuario
 */
router.get('/me', authMiddleware({ required: true }), authController.meRenderView);

/**
 * GET /check-username
 * Verifica disponibilidad de un username
 */
router.get('/check-username', authController.checkUsername);

/**
 * GET /check-email
 * Verifica disponibilidad de un email
 */
router.get('/check-email', authController.checkEmail);

/*-------------RUTAS POST -----------*/
/**
 * POST /register
 * Registra un nuevo usuario
 */
router.post('/register', registerLimiter, authController.register);
/**
 * POST /login
 * Inicia sesión de un usuario
 */
router.post('/login',loginLimiter, authController.login);

/**
 * POST /recovery
 * Envía instrucciones para recuperar contraseña
 */
router.post('/recovery', authController.recovery);

/**
 * POST /refresh
 * Refresca tokens de sesión
 */
//router.post('/refresh', authController.refreshTokens);



module.exports = router;