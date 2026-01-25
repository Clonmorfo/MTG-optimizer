var express = require('express');
var router = express.Router();
const authController = require('../controllers/authController');

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

/**
 * POST /register
 * Registra un nuevo usuario
 */
router.post('/register', authController.register);

/**
 * POST /login
 * Inicia sesión de un usuario
 */
router.post('/login', authController.login);

module.exports = router;