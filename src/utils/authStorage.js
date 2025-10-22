// src/utils/authStorage.js
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * On stocke le token par identifiant d'utilisateur (ici: phoneNumber en E.164 avec +).
 * Clés de stockage:
 *  - tp:currentUser -> phoneNumber courant (string, ex: +33123456789)
 *  - tp:token:<userId> -> access_token pour cet utilisateur
 */

const CURRENT_USER_KEY = 'tp:currentUser';
const tokenKey = (userId) => `tp:token:${String(userId || '').trim()}`;

// ---------- Helpers de stockage (SecureStore avec fallback AsyncStorage) ----------
async function sSet(key, value) {
  try {
    // SecureStore ne supporte que des strings
    await SecureStore.setItemAsync(key, String(value ?? ''));
  } catch {
    await AsyncStorage.setItem(key, String(value ?? ''));
  }
}
async function sGet(key) {
  try {
    const v = await SecureStore.getItemAsync(key);
    if (typeof v === 'string' && v.length) return v;
  } catch {}
  return AsyncStorage.getItem(key);
}
async function sDel(key) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

// ------------------------- API publique -------------------------

/** Définit l’utilisateur courant (ex: phoneNumber +33...) */
export async function setCurrentUsername(userId) {
  if (!userId) return;
  await sSet(CURRENT_USER_KEY, String(userId));
}

/** Récupère l’utilisateur courant (phoneNumber) */
export async function getCurrentUsername() {
  const v = await sGet(CURRENT_USER_KEY);
  return v || null;
}

/** Stocke le token pour un userId (phoneNumber) */
export async function setToken(userId, accessToken) {
  if (!userId) throw new Error('setToken: missing userId');
  if (!accessToken) throw new Error('setToken: missing token');
  await sSet(tokenKey(userId), accessToken);
}

/** Récupère le token pour un userId donné */
export async function getToken(userId) {
  if (!userId) return null;
  const v = await sGet(tokenKey(userId));
  return v || null;
}

/** Supprime le token d’un userId */
export async function deleteToken(userId) {
  if (!userId) return;
  await sDel(tokenKey(userId));
}

/** Efface l’utilisateur courant + son token */
export async function wipeAllLocalData() {
  const userId = await getCurrentUsername();
  try {
    if (userId) await deleteToken(userId);
  } finally {
    await sDel(CURRENT_USER_KEY);
  }
}