import { AuthRequiredError, getAccessToken } from './auth.js';

const endpoint = '/api/favorites';

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

export async function list() {
  const response = await authorizedFetch(endpoint);
  const data = await readResponse(response);
  return data.favorites || [];
}

export async function add(type, item) {
  const response = await authorizedFetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, item }),
  });
  const data = await readResponse(response);
  return data.favorite;
}

export async function remove(type, itemId) {
  const response = await authorizedFetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, itemId }),
  });
  await readResponse(response);
}
