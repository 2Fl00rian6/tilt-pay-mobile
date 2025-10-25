const BASE_URL = 'https://tilt-pay-api.florianwarther.fr';

const DEBUG_HTTP = true;

export function normalizePhoneKeepPlus(input) {
  const s = String(input || '').trim();
  const keepPlus = s.startsWith('+');
  const digits = s.replace(/\D+/g, '');
  return (keepPlus ? '+' : '') + digits;
}

export function normalizePhoneDigits(input) {
  return String(input || '').replace(/\D+/g, '');
}

export function parseApiError(err) {
  if (err?.code === 'E_NETWORK') {
    return {
      status: 0,
      code: 'E_NETWORK',
      text: '[E_NETWORK] Network request failed (simulator offline, DNS, ATS, ou serveur injoignable)',
    };
  }

  const res = err?.response;
  const body = res?.data || err?.data || err;
  const status = res?.status ?? body?.status ?? err?.status ?? 0;
  const code = body?.code || `HTTP_${status || 'UNKNOWN'}`;
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

async function request(path, { method = 'GET', body, token, headers } = {}) {
  const url = `${BASE_URL}${path}`;
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  if (DEBUG_HTTP) {
    // Evite de logguer le PIN en entier si tu veux
    console.log('[HTTP]', method, url, body ? JSON.stringify(body) : '');
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const error = new Error('Network request failed');
    error.code = 'E_NETWORK';
    throw error;
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const error = new Error('HTTP Error');
    error.response = { status: res.status, data };
    if (DEBUG_HTTP) console.log('[HTTP] ERROR', res.status, data);
    throw error;
  }

  if (DEBUG_HTTP) console.log('[HTTP] OK', data);
  return data;
}

export const http = {
  get: (path, opts) => request(path, { method: 'GET', ...(opts || {}) }),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...(opts || {}) }),
};