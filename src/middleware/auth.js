const { verifyAccessToken } = require('../auth/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) return res.status(401).json({ error: 'Token inválido o expirado' });

  req.userId = payload.userId;
  next();
}

module.exports = authMiddleware;