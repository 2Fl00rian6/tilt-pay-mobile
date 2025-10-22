import { http } from './client';

export function getBalance(token) {
  return http.get('/wallet/balance', { token });
}

export function getWalletAddress(token) {
  return http.get('/wallet/address', { token });
}

export function transferByTag(token, { amount, tag }) {
  return http.post('/wallet/transfer-by-tag', { amount, tag }, { token });
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