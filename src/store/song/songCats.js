import { createCat } from 'usecat';

export const isLoadingTotalSongsCountCat = createCat(false);
export const isLoadingRandomSongCat = createCat(false);
export const totalSongsCountCat = createCat(null);
export const latestSongsCat = createCat([]);
export const randomSongCat = createCat(null);
