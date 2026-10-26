const { randomBytes } = require('node:crypto');
const path = require('node:path');

const production = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;
if (production && (!sessionSecret || Buffer.byteLength(sessionSecret) < 32)) {
  throw new Error('SESSION_SECRET deve conter pelo menos 32 bytes em produção.');
}

const uploadMaxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? 10485760);
if (!Number.isSafeInteger(uploadMaxBytes + 1) || uploadMaxBytes <= 0) {
  throw new Error('UPLOAD_MAX_BYTES deve ser um inteiro positivo.');
}

const users = JSON.parse(process.env.DMS_USERS_JSON ?? '[]');
if (!Array.isArray(users) || users.some(user =>
  !user || typeof user.id !== 'string' || !user.id.trim() ||
  typeof user.username !== 'string' || !user.username.trim() ||
  typeof user.passwordHash !== 'string' ||
  !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(user.passwordHash)
) || new Set(users.map(user => user.id)).size !== users.length ||
  new Set(users.map(user => user.username)).size !== users.length) {
  throw new Error('DMS_USERS_JSON deve conter contas únicas com id, username e passwordHash scrypt válidos.');
}

module.exports = {
  users,
  production,
  sessionSecret: sessionSecret || randomBytes(32).toString('hex'),
  sessionMaxAge: 8 * 60 * 60 * 1000,
  uploadMaxBytes,
  storageDirectory: path.resolve(__dirname, '../storage'),
};
