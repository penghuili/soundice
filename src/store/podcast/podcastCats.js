import { createCat } from 'usecat';

export const isLoadingTotalPodcastsCountCat = createCat(false);
export const isLoadingRandomPodcastCat = createCat(false);
export const totalPodcastsCountCat = createCat(null);
export const latestPodcastsCat = createCat([]);
export const randomPodcastCat = createCat(null);
