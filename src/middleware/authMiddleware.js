const jwt = require('jsonwebtoken');

function authMiddleware(options = {}) {
  const {
    required = false,
    guestOnly = false
  } = options;

  return (req, res, next) => {
    const accesToken = req.cookies?.access_token;
    
    if (!accesToken) {
      if (required) return res.redirect('/login');      
      return next();
    }

    try {
      const payload = jwt.verify(accesToken, process.env.JWT_SECRET);

      if (guestOnly) {  
        return res.render('auth/me');
      }

      next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
          if (required) {
            return res.status(401).json({
              code: 'ACCESS_EXPIRED'
            });
          }
        }
        return next();
      } 
  };
}


module.exports = authMiddleware;
