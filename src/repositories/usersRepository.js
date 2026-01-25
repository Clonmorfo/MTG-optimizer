
/**
 * USERS REPOSITORY - Unificado
 * Gestiona datos de autenticación y perfil de usuarios
 * Soporta múltiples pools según el dominio
 */

const { getPool } = require('../config/database');

// Pools
const getAuthPool = () => getPool('auth');
const getUsersPool = () => getPool('users');

// --- AUTH ---
async function findByUsernameOrEmail(username, email) {
  const pool = getAuthPool();
  const result = await pool.query(
    'SELECT id, username, email FROM ua_user WHERE username = $1 OR email = $2 LIMIT 1',
    [username, email]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

async function findByUsername(username) {
  const pool = getAuthPool();
  const result = await pool.query(
    'SELECT id, username, email FROM ua_user WHERE username = $1 LIMIT 1',
    [username]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

async function findByEmail(email) {
  const pool = getAuthPool();
  const result = await pool.query(
    'SELECT id, email FROM ua_user WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

async function findByEmailWithPassword(email) {
  const pool = getAuthPool();
  const result = await pool.query(
    'SELECT id, password, status FROM ua_user WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

async function create(username, email, passwordHash, two_factor) {
  const pool = getAuthPool();
  const result = await pool.query(
    `INSERT INTO ua_user 
     (username, password, email, two_factor, created_at, failed_login, status, type)
     VALUES ($1, $2, $3, $4, NOW(), 0, 0, 'user')
     RETURNING id, username, email, created_at`,
    [username, passwordHash, email, two_factor]
  );
  return result.rows[0];
}

async function createSession(userId, refreshTokenHash, ip, userAgent, expiresAt) {
  const pool = getAuthPool();
  const result = await pool.query(
    `INSERT INTO ua_session 
     (user_id, refresh_token, ip_request, user_agent, expires_at, used)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING id`,
    [userId, refreshTokenHash, ip, userAgent, expiresAt]
  );
  return result.rows[0];
}

async function updateLastLogin(userId) {
  const pool = getAuthPool();
  const result = await pool.query(
    'UPDATE ua_user SET last_login = NOW() WHERE id = $1 RETURNING id',
    [userId]
  );
  return result.rowCount > 0;
}

async function incrementFailedLogin(userId) {
  const pool = getAuthPool();
  const result = await pool.query(
    'UPDATE ua_user SET failed_login = failed_login + 1 WHERE id = $1 RETURNING failed_login, status, lock_until',
    [userId]
  );
  return result.rows[0];
}

async function lockAccount(userId, lockMinutes, newStatus) {
  const pool = getAuthPool();
  const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
  const result = await pool.query(
    'UPDATE ua_user SET status = $2, lock_until = $3 WHERE id = $1 RETURNING id, status, lock_until',
    [userId, newStatus, lockUntil]
  );
  return result.rows[0];
}

async function resetFailedLogin(userId) {
  const pool = getAuthPool();
  const result = await pool.query(
    'UPDATE ua_user SET failed_login = 0, lock_until = NULL WHERE id = $1 RETURNING id',
    [userId]
  );
  return result.rows[0];
}

// --- USERS PROFILE ---
async function getProfileById(userId) {
  const pool = getUsersPool();
  const result = await pool.query(
    `SELECT id, username, email, first_name, last_name, avatar, bio, \
            created_at, updated_at FROM users_profile WHERE user_id = $1`,
    [userId]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

async function updateProfile(userId, profileData) {
  const pool = getUsersPool();
  const { firstName, lastName, avatar, bio } = profileData;
  const result = await pool.query(
    `UPDATE users_profile 
     SET first_name = $2, last_name = $3, avatar = $4, bio = $5, updated_at = NOW()
     WHERE user_id = $1
     RETURNING *`,
    [userId, firstName, lastName, avatar, bio]
  );
  return result.rowCount > 0 ? result.rows[0] : null;
}

module.exports = {
  // Auth
  findByUsernameOrEmail,
  findByUsername,
  findByEmail,
  create,
  findByEmailWithPassword,
  createSession,
  updateLastLogin,
  incrementFailedLogin,
  lockAccount,
  resetFailedLogin,
  // Users
  getProfileById,
  updateProfile
};
