// src/utils/authStorage.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** ======================
 *  Helpers & Key schema
 *  ====================== */
export function sanitizeUsername(u) {
  if (!u) return '';
  return String(u).trim().replace(/[^\w.-]/g, '_');
}

// Registre des clés écrites (pour pouvoir tout effacer ensuite)
const KEY_REG = 'app_kv_index';

async function readRegistry() {
  try {
    const raw = await SecureStore.getItemAsync(KEY_REG);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function writeRegistry(keys) {
  try {
    await SecureStore.setItemAsync(KEY_REG, JSON.stringify(Array.from(new Set(keys))));
  } catch {}
}
async function registerKey(k) {
  const reg = await readRegistry();
  if (!reg.includes(k)) { reg.push(k); await writeRegistry(reg); }
}
async function unregisterKey(k) {
  const reg = await readRegistry();
  const next = reg.filter(x => x !== k);
  await writeRegistry(next);
}

const K_USER   = 'current_username';
const K_PHONE  = 'current_phone_e164';
const K_PIN    = (u) => `pin_${sanitizeUsername(u)}`;
const K_TOKEN  = (u) => `token_${sanitizeUsername(u)}`;
const K_USER_BY_PHONE = (e164) => `user_by_phone_${String(e164 || '').replace(/[^\d+]/g, '')}`;

/** ======================
 *  Username session
 *  ====================== */
export async function getCurrentUsername() {
  const u = await SecureStore.getItemAsync(K_USER);
  return u || '';
}
export async function setCurrentUsername(u) {
  const s = sanitizeUsername(u);
  if (!s) throw new Error('Invalid username');
  await SecureStore.setItemAsync(K_USER, s);
  await registerKey(K_USER);
}

/** ======================
 *  Phone session
 *  ====================== */
export async function getCurrentPhone() {
  return (await SecureStore.getItemAsync(K_PHONE)) || '';
}
export async function setCurrentPhone(e164) {
  const v = String(e164 || '').replace(/[^\d+]/g, '');
  if (!v) throw new Error('Invalid phone');
  await SecureStore.setItemAsync(K_PHONE, v);
  await registerKey(K_PHONE);
}

/** ======================
 *  PIN / TOKEN
 *  ====================== */
export async function getPin(u) {
  const s = sanitizeUsername(u);
  if (!s) return null;
  return SecureStore.getItemAsync(K_PIN(s));
}
export async function setPin(u, pin) {
  const s = sanitizeUsername(u);
  if (!s) throw new Error('Invalid username');
  const key = K_PIN(s);
  await SecureStore.setItemAsync(key, pin);
  await registerKey(key);
}
export async function hasToken(u) {
  const s = sanitizeUsername(u);
  if (!s) return false;
  const t = await SecureStore.getItemAsync(K_TOKEN(s));
  return !!t;
}
export async function setToken(u, token = '1') {
  const s = sanitizeUsername(u);
  if (!s) throw new Error('Invalid username');
  const key = K_TOKEN(s);
  await SecureStore.setItemAsync(key, token);
  await registerKey(key);
}
export async function clearToken(u) {
  const s = sanitizeUsername(u);
  if (!s) return;
  const key = K_TOKEN(s);
  await SecureStore.deleteItemAsync(key);
  await unregisterKey(key);
}

/** ======================
 *  Phone ↔ Username mapping
 *  ====================== */
export async function getUserForPhone(e164) {
  const key = K_USER_BY_PHONE(e164);
  return (await SecureStore.getItemAsync(key)) || '';
}
export async function setUserForPhone(e164, username) {
  const v = String(e164 || '').replace(/[^\d+]/g, '');
  const u = sanitizeUsername(username);
  if (!v || !u) throw new Error('Invalid phone/username');
  const key = K_USER_BY_PHONE(v);
  await SecureStore.setItemAsync(key, u);
  await registerKey(key);
}

/** ======================
 *  Full wipe (logout total)
 *  ====================== */
export async function wipeAllLocalData() {
  // 1) Supprime toutes les clés connues via registre
  const reg = await readRegistry();
  await Promise.allSettled(reg.map(k => SecureStore.deleteItemAsync(k)));
  await SecureStore.deleteItemAsync(KEY_REG);

  // 2) Défensif: supprime aussi les clés “fixes”
  await Promise.allSettled([
    SecureStore.deleteItemAsync(K_USER),
    SecureStore.deleteItemAsync(K_PHONE),
  ]);

  // 3) AsyncStorage (cache, prefs, etc.)
  try { await AsyncStorage.clear(); } catch {}

  // 4) Cookies (si lib présente)
  try {
    const Cookies = (await import('@react-native-cookies/cookies')).default;
    await Cookies.clearAll(true);
  } catch {
    // lib non installée : ignorer
  }
}