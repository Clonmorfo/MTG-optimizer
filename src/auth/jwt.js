const jwt = require('jsonwebtoken');

// Genera JWT de acceso
function generateAccessToken(userId) {
  return jwt.sign(
    { userId }, // payload
    process.env.JWT_SECRET, // tu secreto
    { expiresIn: '15m' } // vida corta
  );
}

// Genera un token genérico con tiempo de expiración configurable
function generateToken(userId, expiresIn = '15m') {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

// Verifica JWT (para middleware)
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateAccessToken, generateToken, verifyAccessToken };