const jwt = require('jsonwebtoken');

// Genera JWT de acceso
function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId ,email}, // payload
    process.env.JWT_SECRET, // tu secreto
    { expiresIn: '15m' } // vida corta
  );
}

// Genera un token genérico con tiempo de expiración configurable
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn : '45d' }
  );
}



module.exports = { generateAccessToken, generateRefreshToken };