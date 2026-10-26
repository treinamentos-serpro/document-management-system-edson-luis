const { Router } = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const controller = require('../controllers/documents.controller');
const { requireSession } = require('../controllers/auth.controller');
const { uploadMaxBytes } = require('../config');
const { AppError } = require('../errors');

const storage = multer.diskStorage({
  destination: controller.storageDestination,
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});
const receiveFile = multer({
  storage,
  // O parser sinaliza o limite ao atingi-lo, mesmo sem bytes excedentes.
  limits: { fileSize: uploadMaxBytes + 1, files: 1, fields: 10, parts: 11 },
}).single('file');

function upload(req, res, next) {
  receiveFile(req, res, error => {
    if (error && !(error instanceof multer.MulterError) &&
        (error.message.startsWith('Multipart:') ||
         error.message.startsWith('Unexpected end of') ||
         error.message === 'Malformed part header')) {
      return next(new AppError('INVALID_REQUEST', 'Upload multipart inválido.'));
    }
    next(error);
  });
}

const router = Router();
router.post('/upload', requireSession, upload, controller.upload);
router.get('/documents', requireSession, controller.list);
router.get('/documents/:id/download', requireSession, controller.download);

module.exports = router;
