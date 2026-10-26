const service = require('../services/auth.service');
const { production, sessionMaxAge } = require('../config');
const { AppError } = require('../errors');

const cookieName = 'dms_session';
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: production, path: '/' };

function sessionCookie(req) {
  const cookie = (req.headers.cookie || '').split(';')
    .map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
  return cookie && cookie.slice(cookieName.length + 1);
}

async function login(req, res) {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || username.length > 256 ||
      typeof password !== 'string' || !password || password.length > 1024) {
    throw new AppError('INVALID_REQUEST', 'Informe usuário e senha válidos.');
  }
  const session = await service.login(username, password, sessionCookie(req));
  res.cookie(cookieName, session.cookie, { ...cookieOptions, maxAge: sessionMaxAge });
  res.set('Cache-Control', 'no-store').json({ user: session.user });
}

function requireSession(req, res, next) {
  req.user = service.authenticate(sessionCookie(req));
  res.set('Cache-Control', 'no-store');
  next();
}

function session(req, res) {
  res.json({ user: req.user });
}

function logout(req, res) {
  service.logout(sessionCookie(req));
  res.clearCookie(cookieName, cookieOptions);
  res.set('Cache-Control', 'no-store').status(204).end();
}

module.exports = { login, requireSession, session, logout };
