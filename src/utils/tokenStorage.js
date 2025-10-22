import * as SecureStore from 'expo-secure-store';

const KEY = 'tp_access_token';

export async function saveAccessToken(token) {
  if (!token) return;
  await SecureStore.setItemAsync(KEY, token);
}
export async function getAccessToken() {
  return SecureStore.getItemAsync(KEY);
}
export async function clearAccessToken() {
  await SecureStore.deleteItemAsync(KEY);
}