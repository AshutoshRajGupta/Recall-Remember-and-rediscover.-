const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // fetch() itself throws when the server can't be reached at all (down, wrong port, CORS, offline).
    throw new Error('Could not reach the server. Please check that the backend is running.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function ingestItem(payload) {
  return request('/ingest', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchItems() {
  return request('/items');
}

export function queryKnowledge(question) {
  return request('/query', { method: 'POST', body: JSON.stringify({ question }) });
}
