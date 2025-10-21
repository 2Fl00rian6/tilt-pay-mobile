const BASE_URL = 'http://ec2-35-180-103-125.eu-west-3.compute.amazonaws.com';

function safeJsonParse(txt) {
  try { return txt ? JSON.parse(txt) : null; } catch { return null; }
}

function toFieldErrors(messages) {
  // Transforme [{field, message, rule}] -> { fieldName: ["msg1","msg2"] }
  const map = {};
  (messages || []).forEach((m) => {
    const k = m?.field || '_global';
    if (!map[k]) map[k] = [];
    map[k].push(m?.message || m?.rule || 'Invalid value');
  });
  return map;
}

/**
 * Appelle l’API et renvoie le JSON parsé, ou lève une Error enrichie.
 * err.shape =
 *  {
 *    status: number,               // ex: 422
 *    code: string,                 // ex: "E_VALIDATION_ERROR" ou "HTTP_422"
 *    message: string,              // premier message lisible si dispo
 *    payload: any,                 // body complet
 *    fieldErrors: { [field]: string[] } // dérivé de payload.messages
 *  }
 */
export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  const data = safeJsonParse(raw) ?? (raw ? { message: raw } : null);

  if (!res.ok) {
    // On tente d’extraire un message lisible
    const primaryMsg =
      data?.message ||
      (Array.isArray(data?.messages) && data.messages[0]?.message) ||
      res.statusText ||
      'Request failed';

    const err = new Error(primaryMsg);
    err.status = data?.status ?? res.status;
    err.code = data?.code || `HTTP_${res.status}`;
    err.payload = data;
    // Map de messages par champ si présent (cas 422)
    if (Array.isArray(data?.messages)) {
      err.fieldErrors = toFieldErrors(data.messages);
    }
    throw err;
  }

  return data;
}

export const http = {
  get: (path, opts = {}) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body = null, opts = {}) => apiRequest(path, { ...opts, method: 'POST', body }),
  put: (path, body = null, opts = {}) => apiRequest(path, { ...opts, method: 'PUT', body }),
  del: (path, opts = {}) => apiRequest(path, { ...opts, method: 'DELETE' }),
};

/** 
 * Texte court pour toast : "Message (code: E_VALIDATION_ERROR)".
 * Si 422 avec messages[], on prend le 1er message lisible.
 */
export function formatApiError(err, fallback = 'Unexpected error') {
  const base =
    err?.message ||
    err?.payload?.message ||
    (Array.isArray(err?.payload?.messages) && err.payload.messages[0]?.message) ||
    fallback;
  const code = err?.code || (err?.status ? `HTTP_${err.status}` : 'UNKNOWN');
  return `${base} (code: ${code})`;
}

/**
 * Récupère les erreurs champ-par-champ (utile pour afficher sous les inputs).
 * Retourne: { [field]: "msg1 · msg2" }
 */
export function getFieldErrorTexts(err) {
  const fe = err?.fieldErrors;
  if (!fe) return {};
  const out = {};
  for (const k of Object.keys(fe)) {
    out[k] = fe[k].filter(Boolean).join(' · ');
  }
  return out;
}