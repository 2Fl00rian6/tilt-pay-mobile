import AsyncStorage from '@react-native-async-storage/async-storage';
import { http } from './client'; // ← Ajuste selon l'emplacement réel de client.js
import { getToken } from '../utils/authStorage';

/**
 * Récupérer tous les utilisateurs
 */
export const getUsers = async () => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Non authentifié');
  }
  
  const res = await http.get('/user/users', { token });
  return res;
};

/**
 * Rechercher des utilisateurs par tag/nom
 */
export const searchUsers = async (query) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Non authentifié');
  }
  
  const res = await http.get(`/users/search?q=${encodeURIComponent(query)}`, { token });
  return res;
};