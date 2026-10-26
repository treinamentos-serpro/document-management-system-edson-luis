export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'same-origin',
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Não foi possível conectar ao servidor.', 0);
  }

  if (!response.ok) {
    let message = 'Não foi possível concluir a operação.';
    if (response.headers.get('content-type')?.includes('application/json')) {
      const body = await response.json();
      message = body.error?.message || message;
    }
    throw new ApiError(message, response.status);
  }
  return response;
}

export async function getSession(options) {
  const response = await request('/auth/session', options);
  return (await response.json()).user;
}

export async function login(username, password) {
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return (await response.json()).user;
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' });
}

export async function listDocuments(options) {
  const response = await request('/documents', options);
  return (await response.json()).documents;
}

export async function uploadDocument(file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}
