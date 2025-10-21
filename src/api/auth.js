import { http } from './client';

/**
 * Vérifie l’OTP SMS envoyé (4–6 digits selon le backend).
 * Body: { phoneNumber: string(10), token: string }
 * 200 -> { message }
 * 401/404/500 -> Error avec err.code + err.message
 */
export function verifyAccount({ phoneNumber, token }) {
  return http.post('/auth/verify-account', { phoneNumber, token });
}

/**
 * Crée le compte.
 * Body: {
 *  phoneNumber: string(10),
 *  fullName: string(>=2),
 *  tagName: string(>=3),
 *  code: string,              // PIN
 *  code_confirmation: string  // PIN confirmation
 * }
 * 201 -> { message }
 */
export function createAccount({ phoneNumber, fullName, tagName, pin }) {
  const code = String(pin);
  return http.post('/auth/create-account', {
    phoneNumber,
    fullName,
    tagName,
    code,
    code_confirmation: code,
  });
}

/**
 * Login avec téléphone + PIN.
 * Body: { phoneNumber: string(10), code: string } // 'code' = PIN côté API
 * 200 -> { access_token }
 */
export function login({ phoneNumber, pin }) {
  return http.post('/auth/login', {
    phoneNumber,
    code: String(pin),
  });
}

/**
 * Logout (token requis en header Authorization).
 * 200 -> { message }
 */
export function logout(token) {
  return http.post('/auth/logout', null, { token });
}