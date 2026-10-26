import { useState } from 'react';
import { downloadDocument } from '../services/api.js';

export default function DownloadButton({ document, onError, disabled = false }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    setSuccess(false);
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      try {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.originalName;
        window.document.body.appendChild(link);
        try {
          link.click();
        } finally {
          link.remove();
        }
      } finally {
        // Aguarda o navegador iniciar o download antes de liberar o arquivo.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setSuccess(true);
    } catch (error) {
      setError(error.message);
      onError(error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || downloading}
        aria-label={`Baixar ${document.originalName}`}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">Download iniciado.</p>}
    </>
  );
}
