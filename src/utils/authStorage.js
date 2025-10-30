// src/utils/authStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// --- clés (préfixées pour éviter les collisions)
const PREFIX = 'TP_';
const K_CURRENT_PHONE = `${PREFIX}CURRENT_PHONE`;
const K_USER = `${PREFIX}USER`;
const K_TOKEN = (phone) => `${PREFIX}TOKEN_${phone}`;

// --- helpers
const normalizePhoneKeepPlus = (p) => String(p ?? '').replace(/\s+/g, '');

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

/** Sauvegarde le user courant (unique) */
export async function setUser(user) {
  if (!user || !user.phoneNumber) throw new Error('User invalide');
  console.log(user);
  try {
    const data = JSON.stringify(user);
    await AsyncStorage.setItem(K_USER, data);
    await setCurrentPhone(user.phoneNumber);
  } catch (err) {
    console.warn('Erreur setUser:', err);
  }
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

/** Récupère le user courant (unique) */
export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(K_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Erreur getUser:', err);
    return null;
  }
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

/** Supprime complètement le user courant */
export async function removeUser() {
  try {
    await AsyncStorage.removeItem(K_USER);
  } catch (err) {
    console.warn('Erreur removeUser:', err);
  }
}

export async function wipeAllLocalData() {
  try {
    await AsyncStorage.clear();
    const keysToDelete = ['tp_access_token'];

    const phone = await getCurrentPhone();
    if (phone) keysToDelete.push(K_TOKEN(phone));

    for (const key of keysToDelete) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.warn('Erreur suppression clé SecureStore:', key, err);
      }
    }

    console.log('[wipeAllLocalData] tout effacé');
  } catch (err) {
    console.warn('Erreur wipeAllLocalData:', err);
  }
}