const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documents.repository');
const { AppError } = require('../errors');

function metadata({ id, originalName, size, uploadedAt, owner }) {
  return { id, originalName, size, uploadedAt, owner };
}

function create(file, owner) {
  const document = repository.save({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    filename: file.filename,
  });
  return metadata(document);
}

function list(owner) {
  return repository.findByOwner(owner).map(metadata);
}

function download(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) {
    throw new AppError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }
  return { path: repository.filePath(document.filename), originalName: document.originalName };
}

module.exports = {
  create,
  list,
  download,
  prepareStorage: repository.prepareStorage,
  removeFile: repository.removeFile,
};
