import { http, normalizePhoneKeepPlus, parseApiError } from './client';

// Vérifie l’OTP (6 digits) — envoie NSN (15 chiffres)
export async function verifyAccount({ phoneNumber, token }) {
  const phone = normalizePhoneKeepPlus(phoneNumber);
  try {
    return await http.post('/auth/verify-account', { phoneNumber: phone, token });
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function createAccount({ phoneNumber, fullName, tagName, pin }) {
  const phone = normalizePhoneKeepPlus(phoneNumber);

  if (!fullName || !tagName || !pin) {
    const e = new Error('Missing required fields');
    e.status = 422;
    e.code = 'E_VALIDATION_ERROR';
    throw e;
  }

  try {
    return await http.post('/auth/create-account', {
      phoneNumber: phone,
      fullName,
      tagName,
      code: String(pin),
      code_confirmation: String(pin),
    });
  } catch (raw) {
    const err = parseApiError(raw);
    if (err?.status === 409 || err?.code === 'E_USER_ALREADY_EXISTS') {
      err.redirectTo = 'login';
    }
    throw err;
  }
}

// Login (NSN + PIN) -> { access_token }
export async function login({ phoneNumber, pin }) {
  const phone = normalizePhoneKeepPlus(phoneNumber);

  // Garde le + et uniquement des digits ensuite
  if (!/^\+\d{6,15}$/.test(phone)) {
    const e = new Error('Invalid phone format (must be + and digits)');
    e.code = 'E_INVALID_PHONE';
    throw e;
  }
  if (!pin || String(pin).length < 4) {
    const e = new Error('Invalid PIN');
    e.code = 'E_INVALID_PIN';
    throw e;
  }

  try {
    console.log('[login] POST /auth/login', { phoneNumber: phone, code: String(pin) });
    const res = await http.post('/auth/login', {
      phoneNumber: phone,
      code: String(pin),
    });
    console.log(res);
    return res;
  } catch (err) {
    console.log('[login] fetch failed', { message: err?.message, code: err?.code, status: err?.status });
    throw parseApiError(err);
  }
}

export async function me(token) {
  try {
    const res = await http.get('/auth/me', { token });
    return res;
  } catch (err) {
    console.log('[me] fetch failed', { message: err?.message, code: err?.code, status: err?.status });
    throw parseApiError(err);
  }
}

// Logout (token requis)
export async function logout(token) {
  try {
    return await http.post('/auth/logout', null, { token });
  } catch (err) {
    throw parseApiError(err);
  }
}