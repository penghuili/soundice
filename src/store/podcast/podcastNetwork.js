import { storageKeys } from '../../lib/storageKeys';
import { LocalStorage } from '../../shared/browser/LocalStorage';
import { refreshTokenIfNecessary } from '../auth/authNetwork';
import {
  isLoadingRandomPodcastCat,
  isLoadingTotalPodcastsCountCat,
  randomPodcastCat,
  totalPodcastsCountCat,
} from './podcastCats';

export async function fetchTotalPodcastsCount() {
  const savedCount = LocalStorage.get(storageKeys.totalPodcastsCount);
  if (savedCount) {
    totalPodcastsCountCat.set(savedCount);
  }

  isLoadingTotalPodcastsCountCat.set(true);

  await refreshTokenIfNecessary();

  try {
    const url = 'https://api.spotify.com/v1/me/episodes?limit=1&offset=0';
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();
    const total = data?.total || 0;

    totalPodcastsCountCat.set(total);
    LocalStorage.set(storageKeys.totalPodcastsCount, total);
  } catch (error) {
    console.log(error);
  }

  isLoadingTotalPodcastsCountCat.set(false);
}

export async function fetchRandomPodcast() {
  const total = totalPodcastsCountCat.get();
  if (!total) {
    return;
  }

  isLoadingRandomPodcastCat.set(true);

  await refreshTokenIfNecessary();

  try {
    const offset = Math.floor(Math.random() * total);

    const url = `https://api.spotify.com/v1/me/episodes?limit=1&offset=${offset}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();

    const episode = data?.items?.[0];
    if (episode) {
      randomPodcastCat.set({ ...episode.episode, added_at: episode.added_at });

      totalPodcastsCountCat.set(data.total);
      LocalStorage.set(storageKeys.totalPodcastsCount, data.total);
    }
  } catch (error) {
    console.log(error);
  }

  isLoadingRandomPodcastCat.set(false);
}
