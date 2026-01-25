const xss = require('xss');

function sanitizeString(value) {
  if (!value) return null;

  return xss(value)
    .trim()
    .replace(/\s+/g, ' ')            // espacios multiples
    .replace(/['"`;]/g, '')          // comillas peligrosas
    .replace(/--/g, '')              // comentarios SQL
    .replace(/\/\*|\*\//g, '')       // /* */
    .replace(/[\x00-\x1F\x7F]/g, ''); // chars invisibles
}

function sanitizeEmail(email) {
  return sanitizeString(email).toLowerCase();
}

function sanitizeUsername(username) {
  return sanitizeString(username).toLowerCase();
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeUsername
};
