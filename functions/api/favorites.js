const ALLOWED_TYPES = new Set(['albums', 'artists', 'songs', 'podcasts']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function requestError(message, status = 400, headers = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function validateType(value) {
  return typeof value === 'string' && ALLOWED_TYPES.has(value) ? value : null;
}

function validateItem(item) {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || item.id.length > 256) {
    return null;
  }
  return item;
}

function serializeRow(row) {
  let item;
  try {
    item = JSON.parse(row.item_json);
  } catch {
    item = { id: row.item_id, title: 'Unavailable favorite' };
  }
  return { type: row.item_type, item, createdAt: row.created_at };
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function authenticateWithSpotify(request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return null;

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: authorization },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Spotify profile verification failed with HTTP ${response.status}.`);

  const profile = await response.json();
  const ids = [profile.account_id, profile.id]
    .filter(value => typeof value === 'string' && value.length > 0 && value.length <= 128)
    .filter((value, index, values) => values.indexOf(value) === index);
  if (!ids.length) return null;
  return { canonicalId: ids[0], ids };
}

function userPlaceholders(identity, startAt = 1) {
  return identity.ids.map((_, index) => `?${startAt + index}`).join(', ');
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return requestError('Favorites database is not configured.', 503);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  const url = new URL(request.url);
  let identity;
  try {
    identity = await authenticateWithSpotify(request);
  } catch {
    return requestError('Spotify could not verify this request.', 503);
  }
  if (!identity) {
    return requestError('A valid Spotify access token is required.', 401, {
      'WWW-Authenticate': 'Bearer',
    });
  }

  if (request.method === 'GET') {
    const type = url.searchParams.get('type');
    if (type && !validateType(type)) return requestError('Unknown favorite type.');

    const values = [...identity.ids];
    const userFilter = userPlaceholders(identity);
    let query = `SELECT item_type, item_id, item_json, created_at FROM favorites WHERE user_id IN (${userFilter})`;
    if (type) {
      query += ` AND item_type = ?${values.length + 1}`;
      values.push(type);
    }
    query += ' ORDER BY created_at DESC';
    const statement = env.DB.prepare(query).bind(...values);
    const result = await statement.all();
    return json({ favorites: (result.results || []).map(serializeRow) });
  }

  if (request.method === 'POST') {
    const body = await readBody(request);
    const type = validateType(body?.type);
    const item = validateItem(body?.item);
    if (!type || !item) return requestError('A valid favorite type and item are required.');

    await env.DB.prepare(
      `INSERT INTO favorites (user_id, item_type, item_id, item_json, created_at)
       VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, item_type, item_id) DO UPDATE SET item_json = excluded.item_json, created_at = CURRENT_TIMESTAMP`
    ).bind(identity.canonicalId, type, item.id, JSON.stringify(item)).run();
    return json({ favorite: { type, item } }, 201);
  }

  if (request.method === 'DELETE') {
    const body = await readBody(request);
    const type = validateType(body?.type);
    const itemId = typeof body?.itemId === 'string' && body.itemId.length <= 256 ? body.itemId : null;
    if (!type || !itemId) return requestError('A valid favorite type and item id are required.');
    const userFilter = userPlaceholders(identity);
    await env.DB.prepare(
      `DELETE FROM favorites WHERE user_id IN (${userFilter}) AND item_type = ?${identity.ids.length + 1} AND item_id = ?${identity.ids.length + 2}`
    )
      .bind(...identity.ids, type, itemId)
      .run();
    return new Response(null, { status: 204 });
  }

  return requestError('Method not allowed.', 405);
}
