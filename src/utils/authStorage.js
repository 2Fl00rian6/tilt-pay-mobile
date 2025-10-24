// src/utils/authStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// --- clés (préfixées pour éviter les collisions)
const PREFIX = 'TP_';
const K_CURRENT_PHONE = `${PREFIX}CURRENT_PHONE`;
const K_TOKEN = (phone) => `${PREFIX}TOKEN_${phone}`;

// --- helpers
const normalizePhoneKeepPlus = (p) =>
  String(p ?? '').replace(/\s+/g, ''); // retire seulement les espaces, garde le "+"

/** Enregistre le numéro courant (E.164 conseillé, ex: +33123456789) */
export async function setCurrentPhone(phone) {
  const v = normalizePhoneKeepPlus(phone);
  await AsyncStorage.setItem(K_CURRENT_PHONE, v);
}

/** Récupère le numéro courant, ou null */
export async function getCurrentPhone() {
  const v = await AsyncStorage.getItem(K_CURRENT_PHONE);
  return v || null;
}

/** Stocke un token associé à un numéro (SecureStore si possible, sinon AsyncStorage) */
export async function setToken(phone, token) {
  const p = normalizePhoneKeepPlus(phone);
  const key = K_TOKEN(p);
  try {
    await SecureStore.setItemAsync(key, token);
  } catch {
    await AsyncStorage.setItem(key, token);
  }
  // on mémorise aussi le numéro courant pour la session
  await setCurrentPhone(p);
}

/** Lit le token pour un numéro (ou pour le numéro courant si non fourni) */
export async function getToken(phone) {
  const p = normalizePhoneKeepPlus(phone || (await getCurrentPhone()) || '');
  if (!p) return null;
  const key = K_TOKEN(p);
  try {
    const t = await SecureStore.getItemAsync(key);
    if (t != null) return t;
  } catch {}
  const t2 = await AsyncStorage.getItem(key);
  return t2 || null;
}

/** Supprime le token d’un numéro donné */
export async function removeToken(phone) {
  const p = normalizePhoneKeepPlus(phone);
  const key = K_TOKEN(p);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
  await AsyncStorage.removeItem(key);
}

/** Wipe des données locales de l’app (sans toucher aux clés d’autres libs) */
export async function wipeAllLocalData() {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((k) => k.startsWith(PREFIX));
  if (ours.length) await AsyncStorage.multiRemove(ours);
  // on tente aussi de supprimer le token courant côté SecureStore
  const phone = await getCurrentPhone();
  if (phone) {
    try { await SecureStore.deleteItemAsync(K_TOKEN(phone)); } catch {}
  }
}