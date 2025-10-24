// src/api/auth.js
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
      phoneNumber: phone,           // <- avec l’indicatif +XX
      fullName,
      tagName,
      code: String(pin),
      code_confirmation: String(pin),
    });
  } catch (raw) {
    const err = parseApiError(raw); // { status, code, text, messages?[] }
    // S'il existe déjà -> on veut afficher le message puis rediriger vers le login
    if (err?.status === 409 || err?.code === 'E_USER_ALREADY_EXISTS') {
      err.redirectTo = 'login';
    }
    throw err;
  }
}

// Login (NSN + PIN) -> { access_token }
export async function login({ phoneNumber, pin }) {
  const phone = normalizePhoneKeepPlus(phoneNumber);
  console.log(phoneNumber);
  try {
    return await http.post('/auth/login', {
      phoneNumber: phone,
      code: String(pin),
    });
  } catch (err) {
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