const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : `http://${window.location.hostname}:4000`);

function getToken() {
  return localStorage.getItem('perkpay_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  // shops
  nearbyShops: (lat, lng, radius = 5) => request(`/api/shops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, { auth: false }),
  getShop: (id) => request(`/api/shops/${id}`, { auth: false }),
  myShopPoints: (id) => request(`/api/shops/${id}/my-points`),
  listShops: () => request('/api/shops'),
  createShop: (payload) => request('/api/shops', { method: 'POST', body: payload }),
  updateShop: (id, payload) => request(`/api/shops/${id}`, { method: 'PATCH', body: payload }),
  deleteShop: (id) => request(`/api/shops/${id}`, { method: 'DELETE' }),
  myShopSummary: () => request('/api/shops/my/summary'),
  myShopTransactions: () => request('/api/shops/my/transactions'),
  onboardShopToRoute: (shopId, payload) => request(`/api/shops/${shopId}/onboard-route`, { method: 'POST', body: payload }),
  routeStatus: (shopId) => request(`/api/shops/${shopId}/route-status`),

  // offers
  listOffers: (shopId) => request(`/api/offers${shopId ? `?shop_id=${shopId}` : ''}`, { auth: false }),
  createOffer: (payload) => request('/api/offers', { method: 'POST', body: payload }),
  updateOffer: (id, payload) => request(`/api/offers/${id}`, { method: 'PATCH', body: payload }),
  deleteOffer: (id) => request(`/api/offers/${id}`, { method: 'DELETE' }),
  saveOffer: (id) => request(`/api/offers/${id}/save`, { method: 'POST' }),

  // payments
  generateQr: (amount) => request('/api/payments/generate-qr', { method: 'POST', body: { amount } }),
  initiateOrder: (orderId) => request(`/api/payments/initiate/${orderId}`),
  lockAmount: (orderId, applyRewards) => request('/api/payments/lock-amount', { method: 'POST', body: { orderId, applyRewards } }),
  paymentStatus: (orderId) => request(`/api/payments/status/${orderId}`),
  shopkeeperConfirm: (orderId) => request('/api/payments/shopkeeper-confirm', { method: 'POST', body: { orderId } }),

  // user
  myTransactions: () => request('/api/user/transactions'),
  myFavorites: () => request('/api/user/favorites'),
  addFavorite: (shopId) => request(`/api/user/favorites/${shopId}`, { method: 'POST' }),
  removeFavorite: (shopId) => request(`/api/user/favorites/${shopId}`, { method: 'DELETE' }),
  mySavedOffers: () => request('/api/user/saved-offers'),
  myShopPointsList: () => request('/api/user/shop-points'),

  // admin
  listShopkeepers: () => request('/api/admin/shopkeepers'),
  createShopkeeper: (payload) => request('/api/admin/shopkeepers', { method: 'POST', body: payload }),
  updateShopkeeper: (id, payload) => request(`/api/admin/shopkeepers/${id}`, { method: 'PATCH', body: payload }),
  deleteShopkeeper: (id) => request(`/api/admin/shopkeepers/${id}`, { method: 'DELETE' }),
  listUsers: (role) => request(`/api/admin/users${role ? `?role=${role}` : ''}`),
  allTransactions: () => request('/api/admin/transactions'),
  listPayouts: () => request('/api/admin/payouts'),
  settlePayout: (shopId, payload) => request(`/api/admin/payouts/${shopId}/settle`, { method: 'POST', body: payload }),
  payoutHistory: (shopId) => request(`/api/admin/payouts/${shopId}/history`),
};

export { getToken, API_BASE };

// Points can now be decimals (e.g. a ₹1 payment earns 0.10 pts). Shows
// up to 2 decimal places, but drops them for whole numbers (50, not 50.00).
export function formatPoints(value) {
  const n = Number(value) || 0;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}
