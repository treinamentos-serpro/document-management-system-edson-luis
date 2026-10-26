const service = require('../services/documents.service');
const { AppError } = require('../errors');

async function upload(req, res) {
  if (!req.file) {
    throw new AppError('INVALID_REQUEST', 'Envie um arquivo no campo file.');
  }
  let document;
  try {
    document = service.create(req.file, req.user.id);
  } catch (error) {
    await service.removeFile(req.file.filename);
    throw error;
  }
  res.status(201).json(document);
}

function list(req, res) {
  res.json({ documents: service.list(req.user.id) });
}

function download(req, res, next) {
  const document = service.download(req.params.id, req.user.id);
  res.set('X-Content-Type-Options', 'nosniff');
  res.download(document.path, document.originalName, error => {
    if (!error) return;
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return next(new AppError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.'));
    }
    next(error);
  });
}

function storageDestination(req, file, callback) {
  service.prepareStorage().then(directory => callback(null, directory), callback);
}

module.exports = { upload, list, download, storageDestination };
