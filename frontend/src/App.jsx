import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { getSession, listDocuments, login, logout } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [revision, setRevision] = useState(0);

  const handleError = useCallback(error => {
    if (error.status === 401) {
      setUser(null);
      setDocuments([]);
      setAuthError('Sua sessão expirou. Entre novamente.');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getSession({ signal: controller.signal })
      .then(user => {
        if (!controller.signal.aborted) setUser(user);
      })
      .catch(error => {
        if (!controller.signal.aborted && error.name !== 'AbortError' && error.status !== 401) {
          setAuthError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckingSession(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    listDocuments({ signal: controller.signal })
      .then(documents => {
        if (!controller.signal.aborted) setDocuments(documents);
      })
      .catch(error => {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setListError(error.message);
          handleError(error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user, revision, handleError]);

  async function handleLogin(event) {
    event.preventDefault();
    if (authBusy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setAuthBusy(true);
    setAuthError('');
    try {
      const user = await login(data.get('username'), data.get('password'));
      setLoading(true);
      setUser(user);
      form.reset();
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthBusy(true);
    setAuthError('');
    try {
      await logout();
      setUser(null);
      setDocuments([]);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  function refreshDocuments() {
    setRevision(value => value + 1);
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>
      {authError && <p role="alert">{authError}</p>}
      {checkingSession ? (
        <p role="status">Verificando sessão...</p>
      ) : user ? (
        <>
          <p>Usuário: {user.username}</p>
          <button type="button" onClick={handleLogout} disabled={authBusy}>
            {authBusy ? 'Saindo...' : 'Sair'}
          </button>
          <UploadComponent
            onUploaded={refreshDocuments}
            onError={handleError}
            disabled={authBusy}
          />
          <DocumentList
            documents={documents}
            loading={loading}
            error={listError}
            onRefresh={refreshDocuments}
            onError={handleError}
            disabled={authBusy}
          />
        </>
      ) : (
        <section aria-labelledby="login-heading">
          <h2 id="login-heading">Entrar</h2>
          <form onSubmit={handleLogin}>
            <label htmlFor="username">Usuário </label>
            <input id="username" name="username" autoComplete="username" required disabled={authBusy} />
            <label htmlFor="password">Senha </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={authBusy}
            />
            <button type="submit" disabled={authBusy}>
              {authBusy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
