import { AuthRequiredError, getAccessToken } from './auth.js';
import { fetchWithRetry } from './request.js';
import { storage, storageKeys } from './storage.js';

const apiBase = 'https://api.spotify.com/v1';

async function spotifyFetch(path, options = {}, retry = true) {
  const token = await getAccessToken();
  const response = await fetchWithRetry(`${apiBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401 && retry) {
    const freshToken = await getAccessToken(true);
    const retried = await fetchWithRetry(`${apiBase}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${freshToken}` },
    });
    if (retried.status === 403) throw new AuthRequiredError();
    if (!retried.ok) throw spotifyError(retried);
    return readSpotifyResponse(retried);
  }
  if (response.status === 401) throw new AuthRequiredError();
  if (response.status === 403) throw new AuthRequiredError();
  if (!response.ok) throw spotifyError(response);
  return readSpotifyResponse(response);
}

function spotifyError(response) {
  const error = new Error('Spotify request failed.');
  error.status = response.status;
  return error;
}

async function readSpotifyResponse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const spotifyUrl = item => item?.external_urls?.spotify || null;
const imageUrl = item => item?.images?.[0]?.url || null;
const artistNames = (artists = []) => artists.map(artist => artist.name).filter(Boolean).join(', ');
const artistLinks = (artists = []) => artists
  .filter(artist => artist?.name)
  .map(artist => ({ id: artist.id, name: artist.name, url: spotifyUrl(artist) }));

function formatFollowers(value) {
  if (!Number.isFinite(value)) return null;
  return `${new Intl.NumberFormat('en', { notation: 'compact' }).format(value)} followers`;
}

function normalizeAlbum(item, addedAt) {
  return {
    id: item.id,
    title: item.name,
    subtitle: artistNames(item.artists),
    artistLinks: artistLinks(item.artists),
    albumTitle: item.name,
    detail: [item.release_date?.slice(0, 4), `${item.total_tracks || 0} tracks`]
      .filter(Boolean)
      .join(' · '),
    image: imageUrl(item),
    url: spotifyUrl(item),
    uri: item.uri,
    addedAt,
  };
}

function normalizeSong(item, addedAt) {
  return {
    id: item.id,
    title: item.name,
    subtitle: artistNames(item.artists),
    artistLinks: artistLinks(item.artists),
    albumTitle: item.album?.name,
    detail: item.album?.name,
    image: imageUrl(item.album),
    url: spotifyUrl(item),
    uri: item.uri,
    addedAt,
  };
}

function normalizeEpisode(item, addedAt) {
  return {
    id: item.id,
    title: item.name,
    subtitle: item.show?.name,
    detail: item.release_date,
    image: imageUrl(item) || imageUrl(item.show),
    url: spotifyUrl(item),
    uri: item.uri,
    addedAt,
  };
}

function normalizeArtist(item) {
  return {
    id: item.id,
    title: item.name,
    subtitle: item.genres?.slice(0, 2).join(' · ') || 'Artist',
    detail: formatFollowers(item.followers?.total),
    image: imageUrl(item),
    url: spotifyUrl(item),
    uri: item.uri,
  };
}

const categories = {
  albums: {
    listPath: '/me/albums?limit=8&offset=0',
    normalize: entry => normalizeAlbum(entry.album, entry.added_at),
    randomPath: offset => `/me/albums?limit=1&offset=${offset}`,
  },
  songs: {
    listPath: '/me/tracks?limit=8&offset=0',
    normalize: entry => normalizeSong(entry.track, entry.added_at),
    randomPath: offset => `/me/tracks?limit=1&offset=${offset}`,
  },
  podcasts: {
    listPath: '/me/episodes?limit=8&offset=0',
    normalize: entry => normalizeEpisode(entry.episode, entry.added_at),
    randomPath: offset => `/me/episodes?limit=1&offset=${offset}`,
  },
};

let followedArtists = null;

async function loadArtists() {
  if (followedArtists) return followedArtists;
  const artists = [];
  let after = null;
  do {
    const suffix = after ? `&after=${encodeURIComponent(after)}` : '';
    const data = await spotifyFetch(`/me/following?type=artist&limit=50${suffix}`);
    const batch = data.artists?.items || [];
    artists.push(...batch);
    after = data.artists?.next && batch.length ? batch[batch.length - 1].id : null;
  } while (after);
  followedArtists = artists;
  return artists;
}

export async function getProfile() {
  const cached = storage.get(storageKeys.account);
  try {
    const profile = await spotifyFetch('/me');
    storage.set(storageKeys.account, profile);
    return profile;
  } catch (error) {
    if (cached && !(error instanceof AuthRequiredError)) return cached;
    throw error;
  }
}

export async function loadCategory(type) {
  if (type === 'artists') {
    const artists = await loadArtists();
    return { count: artists.length, latest: artists.slice(0, 8).map(normalizeArtist) };
  }
  const category = categories[type];
  if (!category) throw new Error('Unknown library category.');
  const data = await spotifyFetch(category.listPath);
  return { count: data.total || 0, latest: (data.items || []).map(category.normalize) };
}

export async function getRandomItem(type, count) {
  if (!count) return null;
  if (type === 'artists') {
    const artists = await loadArtists();
    return normalizeArtist(artists[Math.floor(Math.random() * artists.length)]);
  }
  const category = categories[type];
  const offset = Math.floor(Math.random() * count);
  const data = await spotifyFetch(category.randomPath(offset));
  return data.items?.[0] ? category.normalize(data.items[0]) : null;
}

export async function getRandomArtistAlbum(artistId) {
  if (!artistId) return null;
  const path = `/artists/${encodeURIComponent(artistId)}/albums?include_groups=album&limit=1`;
  const firstPage = await spotifyFetch(`${path}&offset=0`);
  if (!firstPage.total) return null;

  const offset = Math.floor(Math.random() * firstPage.total);
  const data = offset ? await spotifyFetch(`${path}&offset=${offset}`) : firstPage;
  return data.items?.[0] ? normalizeAlbum(data.items[0]) : null;
}

export async function removeItem(type, item) {
  if (!item?.id) throw new Error('No Spotify item is selected.');
  if (type === 'artists') {
    await spotifyFetch(`/me/following?type=artist&ids=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    followedArtists = followedArtists?.filter(artist => artist.id !== item.id) || null;
    return;
  }
  if (!['albums', 'songs', 'podcasts'].includes(type) || !item.uri) throw new Error('Unknown library category.');
  await spotifyFetch(`/me/library?uris=${encodeURIComponent(item.uri)}`, { method: 'DELETE' });
}
