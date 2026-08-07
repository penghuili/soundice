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

function requestError(message, status = 400) {
  return json({ error: message }, status);
}

function validateUserId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
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

export async function onRequest(context) {
  const { request, env } = context;
  if (!env.DB) return requestError('Favorites database is not configured.', 503);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const userId = validateUserId(url.searchParams.get('userId'));
    const type = url.searchParams.get('type');
    if (!userId) return requestError('A Spotify user id is required.');
    if (type && !validateType(type)) return requestError('Unknown favorite type.');

    const statement = type
      ? env.DB.prepare(
          'SELECT item_type, item_id, item_json, created_at FROM favorites WHERE user_id = ?1 AND item_type = ?2 ORDER BY created_at DESC'
        ).bind(userId, type)
      : env.DB.prepare(
          'SELECT item_type, item_id, item_json, created_at FROM favorites WHERE user_id = ?1 ORDER BY created_at DESC'
        ).bind(userId);
    const result = await statement.all();
    return json({ favorites: (result.results || []).map(serializeRow) });
  }

  if (request.method === 'POST') {
    const body = await readBody(request);
    const userId = validateUserId(body?.userId);
    const type = validateType(body?.type);
    const item = validateItem(body?.item);
    if (!userId || !type || !item) return requestError('A valid user, favorite type, and item are required.');

    await env.DB.prepare(
      `INSERT INTO favorites (user_id, item_type, item_id, item_json, created_at)
       VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, item_type, item_id) DO UPDATE SET item_json = excluded.item_json, created_at = CURRENT_TIMESTAMP`
    ).bind(userId, type, item.id, JSON.stringify(item)).run();
    return json({ favorite: { type, item } }, 201);
  }

  if (request.method === 'DELETE') {
    const body = await readBody(request);
    const userId = validateUserId(body?.userId);
    const type = validateType(body?.type);
    const itemId = typeof body?.itemId === 'string' && body.itemId.length <= 256 ? body.itemId : null;
    if (!userId || !type || !itemId) return requestError('A valid user, favorite type, and item id are required.');
    await env.DB.prepare('DELETE FROM favorites WHERE user_id = ?1 AND item_type = ?2 AND item_id = ?3')
      .bind(userId, type, itemId)
      .run();
    return new Response(null, { status: 204 });
  }

  return requestError('Method not allowed.', 405);
}
