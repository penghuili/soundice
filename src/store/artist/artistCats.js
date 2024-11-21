import { createCat, useCat } from 'usecat';

export const isLoadingTotalArtistsCountCat = createCat(false);
export const isLoadingAllArtistsCat = createCat(false);
export const isLoadingRandomArtistCat = createCat(false);
export const totalArtistsCountCat = createCat(null);
export const randomArtistCat = createCat(null);
export const allArtistsCat = createCat([]);

export function useLatestArtists() {
  const all = useCat(allArtistsCat);
  return all.slice(0, 10);
}
