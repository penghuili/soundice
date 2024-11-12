import { storageKeys } from '../../lib/storageKeys';
import { LocalStorage } from '../../shared/browser/LocalStorage';
import { asyncForEach } from '../../shared/js/asyncForEach';
import { refreshTokenIfNecessary } from '../auth/authNetwork';
import {
  allArtistsCat,
  isLoadingAllArtistsCat,
  isLoadingTotalArtistsCountCat,
  randomArtistCat,
  totalArtistsCountCat,
} from './artistCats';

export async function fetchTotalArtistsCount() {
  const savedCount = LocalStorage.get(storageKeys.totalArtistsCount);
  if (savedCount) {
    totalArtistsCountCat.set(savedCount);
  }

  isLoadingTotalArtistsCountCat.set(true);

  await refreshTokenIfNecessary();

  try {
    const url = 'https://api.spotify.com/v1/me/following?type=artist&limit=1';
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
      },
    });
    const data = await response.json();
    const total = data?.artists?.total || 0;
    const id = data?.artists?.items?.[0]?.id;

    totalArtistsCountCat.set(total);

    if (total !== savedCount || id !== LocalStorage.get(storageKeys.latestArtistId)) {
      LocalStorage.set(storageKeys.totalArtistsCount, total);
      LocalStorage.set(storageKeys.latestArtistId, id);

      LocalStorage.set(storageKeys.allArtists, []);
      allArtistsCat.set([]);
    }
  } catch (error) {
    console.log(error);
  }

  isLoadingTotalArtistsCountCat.set(false);
}

export async function fetchAllArtists() {
  const allArtists = allArtistsCat.get();
  if (allArtists?.length) {
    return;
  }
  const savedArtists = LocalStorage.get(storageKeys.allArtists);
  if (savedArtists?.length) {
    allArtistsCat.set(savedArtists);
    return;
  }

  isLoadingAllArtistsCat.set(true);

  let afterKey = null;
  let artists = [];
  const total = totalArtistsCountCat.get();
  await asyncForEach(Array.from({ length: Math.ceil(total / 49) }).fill(null), async () => {
    const { afterKey: nextAfterKey, artists: nextArtists } = await fetchBatchArtists(afterKey);
    afterKey = nextAfterKey;
    console.log(afterKey);
    artists = artists.concat(nextArtists);
  });

  allArtistsCat.set(artists);
  LocalStorage.set(storageKeys.allArtists, artists);

  isLoadingAllArtistsCat.set(false);
}

export function getRandomArtist() {
  const artists = allArtistsCat.get();
  const artist = artists[Math.floor(Math.random() * artists.length)];
  randomArtistCat.set(artist);
}

async function fetchBatchArtists(afterKey) {
  await refreshTokenIfNecessary();

  const url = afterKey
    ? `https://api.spotify.com/v1/me/following?type=artist&limit=49&after=${afterKey}`
    : `https://api.spotify.com/v1/me/following?type=artist&limit=49`;
  const response2 = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LocalStorage.get(storageKeys.accessToken)}`,
    },
  });
  const res = await response2.json();

  return {
    afterKey: res.artists.next ? res.artists.items[res.artists.items.length - 1].id : null,
    artists: res.artists.items,
  };
}
