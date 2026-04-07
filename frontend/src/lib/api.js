const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchProperties() {
  const res = await fetch(`${BASE}/properties`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function fetchProperty(id) {
  const res = await fetch(`${BASE}/properties/${id}`);
  if (!res.ok) throw new Error('Property not found');
  return res.json();
}

export async function buyTokens(propertyId, walletAddress, amount) {
  const res = await fetch(`${BASE}/properties/${propertyId}/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress, amount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Purchase failed');
  }
  return res.json();
}

export async function fetchPortfolio(walletAddress) {
  const res = await fetch(`${BASE}/portfolio/${walletAddress}`);
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}
