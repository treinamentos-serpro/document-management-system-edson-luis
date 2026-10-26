import { useState } from 'react';
import { uploadDocument } from '../services/api.js';

export default function UploadComponent({ onUploaded, onError, disabled = false }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const document = await uploadDocument(file);
      form.reset();
      setFile(null);
      setSuccess(`Documento "${document.originalName}" enviado com sucesso.`);
      onUploaded(document);
    } catch (error) {
      setError(error.message);
      onError(error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="document-file">Arquivo </label>
        <input
          id="document-file"
          name="file"
          type="file"
          required
          disabled={disabled || uploading}
          onChange={event => {
            setFile(event.target.files[0] || null);
            setError('');
            setSuccess('');
          }}
        />
        <button type="submit" disabled={disabled || uploading || !file}>
          {uploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
    </section>
  );
}
