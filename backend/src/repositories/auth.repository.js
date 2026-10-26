const { users } = require('../config');

const sessions = new Map();

function findUserByUsername(username) {
  return users.find(user => user.username === username);
}

function saveSession(token, session) {
  const now = Date.now();
  for (const [key, value] of sessions) {
    if (value.expiresAt <= now) sessions.delete(key);
  }
  sessions.set(token, session);
}

function findSession(token) {
  const session = sessions.get(token);
  if (session && session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return undefined;
  }
  return session;
}

function deleteSession(token) {
  sessions.delete(token);
}

module.exports = { findUserByUsername, saveSession, findSession, deleteSession };
