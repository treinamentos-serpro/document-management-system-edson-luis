import DownloadButton from './DownloadButton.jsx';

export default function DocumentList({
  documents,
  loading,
  error,
  onRefresh,
  onError,
  disabled = false,
}) {
  return (
    <section aria-labelledby="documents-heading" aria-busy={loading}>
      <h2 id="documents-heading">Meus documentos</h2>
      <button type="button" onClick={onRefresh} disabled={disabled || loading}>
        Atualizar lista
      </button>
      {loading && <p role="status">Carregando documentos...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p>Nenhum documento enviado.</p>
      )}
      {documents.length > 0 && (
        <table>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Tamanho (bytes)</th>
              <th scope="col">Data de envio</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(document => (
              <tr key={document.id}>
                <td>{document.originalName}</td>
                <td>{document.size.toLocaleString('pt-BR')}</td>
                <td>
                  <time dateTime={document.uploadedAt}>
                    {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                  </time>
                </td>
                <td>
                  <DownloadButton document={document} onError={onError} disabled={disabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
