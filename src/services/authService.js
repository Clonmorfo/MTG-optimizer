/**
 * AUTH SERVICE
 * Capa de lógica de negocio - Cero dependencias HTTP
 */

const userRepository = require('../repositories/usersRepository');
const passwordUtils = require('../utils/password');
const sanitize = require('../utils/sanitize');
const jwtAuth = require('../auth/jwt');
const AppError = require('../errors/AppError');

/**
 * Registra un nuevo usuario
 * @param {Object} userData - {username, email, password, remember_me}
 * @returns {Object} - {success: true, message, userId}
 */
async function registerUser(userData) {
  const { username, email, password, remember_me } = userData;

  // Validar que no exista usuario con ese username o email
  const existingUser = await userRepository.findByUsernameOrEmail(username, email);
  if (existingUser) {
    throw new AppError(
      'El nombre de usuario o email ya está registrado',
      409,
      'DUPLICATE_USER'
    );
  }

  // Hash de la contraseña
  const passwordHash = await passwordUtils.hashPassword(password);

  // Crear usuario en BD
  await userRepository.create(username, email, passwordHash, false);

  return {
    success: true,
    message: 'Usuario registrado exitosamente',
  };
}

/**
 * Inicia sesión de un usuario
 * @param {Object} credentials - {email, password, remember_me, ip, userAgent}
 * @returns {Object} - {success: true, userId, accessToken, refreshToken}
 */
async function loginUser(credentials) {
  const { email, password, remember_me, ip, userAgent } = credentials;

  // Validar que el email exista
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user) {
    throw new AppError(
      'Email o contraseña inválidos',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Verificar si la cuenta está temporalmente bloqueada (status 2)
  if (user.status === 2) {
    const user_full = await userRepository.findByEmail(email);
    if (user_full.lock_until && new Date(user_full.lock_until) > new Date()) {
      throw new AppError(
        'Cuenta temporalmente bloqueada. Intenta más tarde',
        403,
        'ACCOUNT_LOCKED'
      );
    } else {
      // El lock expiró, resetear a estado activo
      await userRepository.resetFailedLogin(user.id);
      user.status = 0;
    }
  }

  // Verificar si la cuenta está permanentemente cerrada (status 3)
  if (user.status === 3) {
    throw new AppError(
      'Esta cuenta ha sido cerrada permanentemente',
      403,
      'ACCOUNT_CLOSED'
    );
  }

  // Verificar si la cuenta está activa (solo 0 y 1 son válidas)
  if (user.status !== 0 && user.status !== 1 && user.status !== 2) {
    throw new AppError(
      'Esta cuenta ha sido desactivada',
      403,
      'ACCOUNT_DISABLED'
    );
  }

  // Verificar la contraseña
  const isPasswordValid = await passwordUtils.verifyPassword(user.password, password);
  if (!isPasswordValid) {
    // Incrementar intentos fallidos
    const updated = await userRepository.incrementFailedLogin(user.id);

    // Lógica de bloqueo progresivo con duplicación de tiempo
    if (updated.failed_login >= 5 && updated.failed_login < 10) {
      // Calcular minutos de bloqueo: 15, 30, 60, 120 (dobla cada vez)
      // Para el quinto intento: 15 * 2^(5-5) = 15 * 2^0 = 15
      // Para el sexto intento: 15 * 2^(6-5) = 15 * 2^1 = 30
      // Para el séptimo intento: 15 * 2^(7-5) = 15 * 2^2 = 60
      // Para el octavo intento: 15 * 2^(8-5) = 15 * 2^3 = 120
      const lockMinutes = 15 * Math.pow(2, updated.failed_login - 5);

      await userRepository.lockAccount(user.id, lockMinutes, 2); // status 2 = temp ban
      throw new AppError(
        `Demasiados intentos fallidos. Cuenta bloqueada por ${lockMinutes} minutos`,
        403,
        'ACCOUNT_LOCKED'
      );
    } else if (updated.failed_login >= 10) {
      // Cierre permanente
      await userRepository.lockAccount(user.id, 0, 3); // status 3 = permanent ban
      throw new AppError(
        'Cuenta cerrada permanentemente por exceso de intentos fallidos',
        403,
        'ACCOUNT_CLOSED'
      );
    }

    throw new AppError(
      'Email o contraseña inválidos',
      401,
      'INVALID_CREDENTIALS'
    );
  }

  // Login exitoso - resetear contador de intentos
  await userRepository.resetFailedLogin(user.id);

  // Crear tokens JWT
  const accessToken = jwtAuth.generateToken(user.id, '15m');
  const refreshToken = jwtAuth.generateToken(user.id, '7d');

  // Hash del refresh token para guardar en BD
  const refreshTokenHash = await passwordUtils.hashPassword(refreshToken);

  // Calcular expiración de la sesión
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Crear sesión en BD
  await userRepository.createSession(user.id, refreshTokenHash, ip, userAgent, expiresAt);

  // Actualizar último login
  await userRepository.updateLastLogin(user.id);

  return {
    success: true,
    userId: user.id,
    accessToken,
    refreshToken
  };
}

/**
 * Verifica disponibilidad de username
 * @param {string} username
 * @returns {Object} - {available: boolean}
 */
async function checkUsernameAvailability(username) {
  const user = await userRepository.findByUsername(username);
  return {
    available: !user
  };
}

/**
 * Verifica disponibilidad de email
 * @param {string} email
 * @returns {Object} - {available: boolean}
 */
async function checkEmailAvailability(email) {
  const user = await userRepository.findByEmail(email);
  return {
    available: !user
  };
}

module.exports = {
  registerUser,
  loginUser,
  checkUsernameAvailability,
  checkEmailAvailability
};
