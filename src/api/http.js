const BASE_URL = 'https://tilt-pay-api.florianwarther.fr';

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  const data = safeJsonParse(raw) ?? { message: raw || undefined };

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.code = data?.code || `HTTP_${res.status}`;
    err.payload = data;
    throw err;
  }

  return data;
}

/** Formate un message lisible: "Message lisible (CODE: ERROR_XYZ)" */
export function formatApiError(err, fallback = 'Unexpected error') {
  const msg = err?.message || err?.payload?.message || fallback;
  const code = err?.code || (err?.status ? `HTTP_${err.status}` : 'UNKNOWN');
  return `${msg} (code: ${code})`;
}