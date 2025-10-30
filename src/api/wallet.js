import { http } from './client';
import { getToken } from '../utils/authStorage';

export const transferByTag = async ({ tag, amount }) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('Non authentifié - connecte-toi d\'abord');
  }
  
  const res = await http.post(
    '/wallet/transfer-by-tag',
    { tag, amount },
    { token }
  );
  
  return res;
};

export function getBalance(token) {
  return http.get('/wallet/balance', { token });
}

export function getWalletAddress(token) {
  return http.get('/wallet/address', { token });
}

export function requestVirtualAccount(token, currency) {
  return http.post('/wallet/virtual-account?currency=' + encodeURIComponent(currency), null, { token });
}

export function getVirtualAccounts(token, currency) {
  return http.get('/wallet/virtual-account?currency=' + encodeURIComponent(currency), { token });
}

export function requestKycLink(token) {
  return http.post('/wallet/kyc', null, { token });
}

export function getKycStatus(token, kycId) {
  return http.get('/wallet/kyc/' + encodeURIComponent(kycId), { token });
}