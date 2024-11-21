import { storageKeys } from '../../lib/storageKeys';
import { waitAtLeast } from '../../lib/waitAtLeast';
import { LocalStorage } from '../../shared/browser/LocalStorage';
import { refreshTokenIfNecessary } from '../auth/authNetwork';
import {
  isLoadingRandomAlbumCat,
  isLoadingTotalCountCat,
  latestAlbumsCat,
  randomAlbumCat,
  totalAlbumsCountCat,
} from './albumCats';

export async function fetchLatestAlbums() {
  const savedCount = LocalStorage.get(storageKeys.totalAlbumsCount);
  if (savedCount) {
    totalAlbumsCountCat.set(savedCount);
  }
  const savedLatestAlbums = LocalStorage.get(storageKeys.latestAlbums);
  if (savedLatestAlbums?.length) {
    latestAlbumsCat.set(savedLatestAlbums);
  }

  isLoadingTotalCountCat.set(true);
  await refreshTokenIfNecessary();

  try {
    const url1 = 'https://api.spotify.com/v1/me/albums?limit=10&offset=0';
    const response = await fetch(url1, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();

    totalAlbumsCountCat.set(data.total);
    LocalStorage.set(storageKeys.totalAlbumsCount, data.total);

    if (data?.items?.length) {
      LocalStorage.set(storageKeys.latestAlbums, data.items);
      latestAlbumsCat.set(data.items);
    }
  } catch (error) {
    console.log(error);
  }

  isLoadingTotalCountCat.set(false);
}

export async function fetchRandomAlbum(wait) {
  const total = totalAlbumsCountCat.get();
  if (!total) {
    return;
  }

  isLoadingRandomAlbumCat.set(true);

  const { data } = wait
    ? await waitAtLeast(1000, fetchRandomAlbumNetwork(total))
    : await fetchRandomAlbumNetwork(total);

  if (data) {
    randomAlbumCat.set(data);

    totalAlbumsCountCat.set(data.total);
    LocalStorage.set(storageKeys.totalAlbumsCount, data.total);
  }

  isLoadingRandomAlbumCat.set(false);
}

async function fetchRandomAlbumNetwork(total) {
  await refreshTokenIfNecessary();

  try {
    const offset = Math.floor(Math.random() * total);

    const url = `https://api.spotify.com/v1/me/albums?limit=1&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();

    const album = data?.items?.[0]?.album;
    const albumWithDate = album
      ? { ...album, added_at: data.items[0].added_at, total: data.total }
      : null;

    return { data: albumWithDate, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
