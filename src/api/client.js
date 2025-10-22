const BASE_URL = 'http://ec2-35-180-103-125.eu-west-3.compute.amazonaws.com';

export function normalizePhoneKeepPlus(input) {
  return String(input || '').replace(/\s+/g, '');
}

export function normalizePhoneDigits(input) {
  return String(input || '').replace(/\D+/g, '');
}

export function parseApiError(err) {
  const res = err?.response;
  const body = res?.data || err?.data || err;
  const status = res?.status ?? body?.status ?? err?.status ?? 0;
  const code = body?.code || 'E_UNKNOWN';
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  let details = '';
  if (messages.length) {
    details = messages
      .map(m => m?.message || `${m?.field || 'field'}: ${m?.rule || 'invalid'}`)
      .join('\n');
  } else if (body?.message) {
    details = body.message;
  } else if (err?.message && typeof err.message === 'string') {
    details = err.message;
  } else {
    details = 'An unexpected error occurred';
  }

  return { status, code, text: `[${code}] ${details}` };
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const error = new Error('HTTP Error');
    error.response = { status: res.status, data };
    throw error;
  }
  return data;
}

export const http = {
  get: (path, opts) => request(path, { method: 'GET', ...(opts || {}) }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...(opts || {}) }),
};