const argon2 = require('argon2');

async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id, // el más seguro hoy
    memoryCost: 2 ** 16,   // 64 MB
    timeCost: 3,
    parallelism: 1
  });
}

async function verifyPassword(hash, password) {

  return await argon2.verify(hash, password);
}

module.exports = { hashPassword, verifyPassword };