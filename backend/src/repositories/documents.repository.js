const path = require('node:path');
const { mkdir, unlink } = require('node:fs/promises');
const { storageDirectory } = require('../config');

const documents = new Map();

async function prepareStorage() {
  await mkdir(storageDirectory, { recursive: true });
  return storageDirectory;
}

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findByOwner(owner) {
  return [...documents.values()].filter(document => document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

function filePath(filename) {
  return path.join(storageDirectory, filename);
}

async function removeFile(filename) {
  await unlink(filePath(filename));
}

module.exports = { prepareStorage, save, findByOwner, findById, filePath, removeFile };
