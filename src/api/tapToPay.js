import { apiRequest } from './http';
import { getToken } from '../utils/authStorage';

// Create a Tap-to-Pay request (sender chooses amount/currency)
export async function createTapToPayRequest({ amount, currency }) {
  const token = await getToken(); // current user token
  return apiRequest('/wallet/tap-to-pay/request', {
    method: 'POST',
    token,
    body: { amount, currency }, // matches CreateTapToPayRequest
  });
}

// Create the authorization “secret” for a given requestId (sender generates secret)
export async function createTapToPayAuthorization({ requestId }) {
  const token = await getToken();
  return apiRequest('/wallet/tap-to-pay/authorize', {
    method: 'POST',
    token,
    body: { requestId }, // server returns { secret }
  });
}

// Approve (receiver side) with requestId + secret to actually move funds
export async function approveTapToPayRequest({ requestId, secret }) {
  const token = await getToken();
  return apiRequest('/wallet/tap-to-pay/approve', {
    method: 'POST',
    token,
    body: { requestId, secret }, // matches ApproveTapToPayRequest
  });
}