import { createCat } from 'usecat';

export const isLoadingTotalCountCat = createCat(false);
export const isLoadingRandomAlbumCat = createCat(false);
export const totalAlbumsCountCat = createCat(null);
export const latestAlbumsCat = createCat([]);
export const randomAlbumCat = createCat(null);
