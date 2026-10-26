const { randomBytes, scrypt, createHmac, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const repository = require('../repositories/auth.repository');
const { sessionSecret, sessionMaxAge } = require('../config');
const { AppError } = require('../errors');

const deriveKey = promisify(scrypt);
const dummyHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

function sign(token) {
  return createHmac('sha256', sessionSecret).update(token).digest('hex');
}

function readToken(value) {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(value)) return undefined;
  const [token, signature] = value.split('.');
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(token), 'hex'))
    ? token : undefined;
}

async function login(username, password, previousCookie) {
  const user = repository.findUserByUsername(username);
  const [, salt, hash] = (user ? user.passwordHash : dummyHash).split('$');
  const actual = await deriveKey(password, salt, 64);
  if (!timingSafeEqual(actual, Buffer.from(hash, 'hex')) || !user) {
    throw new AppError('UNAUTHENTICATED', 'Credenciais inválidas.');
  }

  logout(previousCookie);
  const token = randomBytes(32).toString('hex');
  const publicUser = { id: user.id, username: user.username };
  repository.saveSession(token, { user: publicUser, expiresAt: Date.now() + sessionMaxAge });
  return { user: publicUser, cookie: `${token}.${sign(token)}` };
}

function authenticate(cookie) {
  const token = readToken(cookie);
  const session = token && repository.findSession(token);
  if (!session) {
    throw new AppError('UNAUTHENTICATED', 'Sessão ausente ou expirada.');
  }
  return session.user;
}

function logout(cookie) {
  const token = readToken(cookie);
  if (token) repository.deleteSession(token);
}

module.exports = { login, authenticate, logout };
