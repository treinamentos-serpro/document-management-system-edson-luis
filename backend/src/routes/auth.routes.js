const { Router } = require('express');
const controller = require('../controllers/auth.controller');

const router = Router();
router.post('/auth/login', controller.login);
router.get('/auth/session', controller.requireSession, controller.session);
router.post('/auth/logout', controller.logout);

module.exports = router;
