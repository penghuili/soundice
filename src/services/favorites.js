import { AuthRequiredError, getAccessToken } from './auth.js';

const endpoint = '/api/favorites';
const favoriteType = 'albums';

function assertAlbum(type) {
  if (type !== favoriteType) throw new Error('Only albums can be favorited.');
}

async function authorizedFetch(url, options = {}, retry = true) {
  const accessToken = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status === 401 && retry) {
    const freshToken = await getAccessToken(true);
    return authorizedFetchWithToken(url, options, freshToken);
  }
  return response;
}

function authorizedFetchWithToken(url, options, accessToken) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function readResponse(response) {
  if (response.ok) return response.status === 204 ? null : response.json();
  if (response.status === 401) throw new AuthRequiredError();
  let message = 'Could not update favorites.';
  try {
    const data = await response.json();
    message = data.error || message;
  } catch {
    // Keep the friendly fallback when the API did not return JSON.
  }
  const error = new Error(message);
  error.status = response.status;
  throw error;
}

export async function list({ limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const url = params.toString() ? `${endpoint}?${params}` : endpoint;
  const response = await authorizedFetch(url);
  const data = await readResponse(response);
  const favorites = (data.favorites || []).filter(favorite => favorite.type === favoriteType);
  return {
    favorites,
    total: Number.isFinite(data.total) ? data.total : favorites.length,
  };
}

export async function existingIds(ids) {
  const unique = [...new Set((ids || []).filter(id => typeof id === 'string' && id && id.length <= 256))].slice(0, 20);
  if (!unique.length) return [];
  const response = await authorizedFetch(`${endpoint}?check=${unique.map(encodeURIComponent).join(',')}`);
  const data = await readResponse(response);
  return data.ids || [];
}

export async function add(type, item) {
  assertAlbum(type);
  const response = await authorizedFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, item }),
  });
  const data = await readResponse(response);
  return data.favorite;
}

export async function remove(type, itemId) {
  assertAlbum(type);
  const response = await authorizedFetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, itemId }),
  });
  await readResponse(response);
}
