import { storageKeys } from '../../lib/storageKeys';
import { waitAtLeast } from '../../lib/waitAtLeast';
import { LocalStorage } from '../../shared/browser/LocalStorage';
import { refreshTokenIfNecessary } from '../auth/authNetwork';
import {
  isLoadingRandomSongCat,
  isLoadingTotalSongsCountCat,
  latestSongsCat,
  randomSongCat,
  totalSongsCountCat,
} from './songCats';

export async function fetchLatestSongs() {
  const savedCount = LocalStorage.get(storageKeys.totalSongsCount);
  if (savedCount) {
    totalSongsCountCat.set(savedCount);
  }
  const savedLatestSongs = LocalStorage.get(storageKeys.latestSongs);
  if (savedLatestSongs?.length) {
    latestSongsCat.set(savedLatestSongs);
  }

  isLoadingTotalSongsCountCat.set(true);

  await refreshTokenIfNecessary();

  try {
    const url = 'https://api.spotify.com/v1/me/tracks?limit=10&offset=0';
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const res = await response.json();
    const total = res?.total || 0;

    totalSongsCountCat.set(total);
    LocalStorage.set(storageKeys.totalSongsCount, total);

    if (res?.items?.length) {
      LocalStorage.set(storageKeys.latestSongs, res.items);
      latestSongsCat.set(res.items);
    }
  } catch (error) {
    console.log(error);
  }

  isLoadingTotalSongsCountCat.set(false);
}

export async function fetchRandomSong(wait) {
  const total = totalSongsCountCat.get();
  if (!total) {
    return;
  }

  isLoadingRandomSongCat.set(true);

  const { data } = wait
    ? await waitAtLeast(1000, fetchRandomSongNetwork(total))
    : await fetchRandomSongNetwork(total);

  if (data) {
    randomSongCat.set(data);

    totalSongsCountCat.set(data.total);
    LocalStorage.set(storageKeys.totalSongsCount, data.total);
  }

  isLoadingRandomSongCat.set(false);
}

async function fetchRandomSongNetwork(total) {
  await refreshTokenIfNecessary();

  try {
    const offset = Math.floor(Math.random() * total);

    const url = `https://api.spotify.com/v1/me/tracks?limit=1&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();

    const song = data?.items?.[0];
    const songWithDate = song
      ? { ...song.track, added_at: song.added_at, total: data.total }
      : null;

    return { data: songWithDate, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
