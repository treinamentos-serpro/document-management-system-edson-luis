const express = require('express');
const multer = require('multer');
const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/documents.routes');
const { AppError } = require('./errors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(authRoutes);
app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Não foi possível concluir a operação.';

  if (error instanceof AppError) {
    ({ code, message } = error);
    status = {
      INVALID_REQUEST: 400,
      UNAUTHENTICATED: 401,
      DOCUMENT_NOT_FOUND: 404,
    }[code] || 500;
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = status === 413 ? 'FILE_TOO_LARGE' : 'INVALID_REQUEST';
    message = status === 413 ? 'O arquivo excede o limite permitido.' : 'Upload inválido.';
  } else if (error.type === 'entity.parse.failed' || error.status === 400) {
    status = 400;
    code = 'INVALID_REQUEST';
    message = 'Requisição inválida.';
  } else if (error.type === 'entity.too.large') {
    status = 413;
    code = 'INVALID_REQUEST';
    message = 'A requisição excede o limite permitido.';
  }

  if (status === 500) console.error('Falha no backend DMS:', error);
  res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
