const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      // Send the HTTP-only auth cookie with API requests.
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Could not reach the server. Please check that the backend is running.",
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.error || data.message || `Request failed with status ${res.status}`,
    );
  }

  return data;
}

// Authentication APIs
export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutUser() {
  return request("/auth/logout", {
    method: "POST",
  });
}

export function fetchCurrentUser() {
  return request("/auth/me");
}

// Knowledge Inbox APIs
export function ingestItem(payload) {
  return request("/ingest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchItems() {
  return request("/items");
}

export function queryKnowledge(question) {
  return request("/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export function sendChatMessage(message) {
  return request("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
