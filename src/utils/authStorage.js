// src/utils/authStorage.js
import * as SecureStore from 'expo-secure-store';

// Sanitize: garde A-Z a-z 0-9 . _ -, remplace le reste par _
export function sanitizeUsername(u) {
  if (!u) return '';
  return String(u).trim().replace(/[^\w.-]/g, '_');
}

const K_USER = 'current_username';
const K_PIN   = (u) => `pin_${sanitizeUsername(u)}`;
const K_TOKEN = (u) => `token_${sanitizeUsername(u)}`;

export async function getCurrentUsername() {
  const u = await SecureStore.getItemAsync(K_USER);
  return u || ''; // jamais null
}

export async function setCurrentUsername(u) {
  const s = sanitizeUsername(u);
  if (!s) throw new Error('Invalid username'); // évite key vide
  return SecureStore.setItemAsync(K_USER, s);
}

export async function getPin(u) {
  const s = sanitizeUsername(u);
  if (!s) return null;
  return SecureStore.getItemAsync(K_PIN(s));
}

export async function setPin(u, pin) {
  const s = sanitizeUsername(u);
  if (!s) throw new Error('Invalid username');
  return SecureStore.setItemAsync(K_PIN(s), pin);
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
  return SecureStore.setItemAsync(K_TOKEN(s), token);
}

export async function clearToken(u) {
  const s = sanitizeUsername(u);
  if (!s) return;
  return SecureStore.deleteItemAsync(K_TOKEN(s));
}