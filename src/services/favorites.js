const endpoint = '/api/favorites';

async function readResponse(response) {
  if (response.ok) return response.status === 204 ? null : response.json();
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

function requireUserId(userId) {
  if (!userId) throw new Error('Your Spotify profile is not ready yet.');
  return userId;
}

export async function list(userId) {
  const response = await fetch(`${endpoint}?${new URLSearchParams({ userId: requireUserId(userId) })}`);
  const data = await readResponse(response);
  return data.favorites || [];
}

export async function add(userId, type, item) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: requireUserId(userId), type, item }),
  });
  const data = await readResponse(response);
  return data.favorite;
}

export async function remove(userId, type, itemId) {
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: requireUserId(userId), type, itemId }),
  });
  await readResponse(response);
}
