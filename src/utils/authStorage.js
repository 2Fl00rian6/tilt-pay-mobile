import * as SecureStore from 'expo-secure-store';

const K_USER = 'current_username';
const K_PIN = (u) => `pin:${u}`;
const K_TOKEN = (u) => `token:${u}`;

export async function getCurrentUsername() { return SecureStore.getItemAsync(K_USER); }
export async function setCurrentUsername(u) {
  return u ? SecureStore.setItemAsync(K_USER, u) : SecureStore.deleteItemAsync(K_USER);
}

export async function getPin(u) { if (!u) return null; return SecureStore.getItemAsync(K_PIN(u)); }
export async function setPin(u, pin) { return SecureStore.setItemAsync(K_PIN(u), pin); }

export async function hasToken(u) { if (!u) return false; return !!(await SecureStore.getItemAsync(K_TOKEN(u))); }
export async function setToken(u, token='1') { return SecureStore.setItemAsync(K_TOKEN(u), token); }
export async function clearToken(u) { if (!u) return; return SecureStore.deleteItemAsync(K_TOKEN(u)); }