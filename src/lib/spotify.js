export function getImageUrl(item) {
  return item?.images?.[0]?.url || null;
}

export function getAlbumImageUrl(song) {
  return getImageUrl(song?.album);
}

export function getSpotifyUrl(item) {
  return item?.external_urls?.spotify || null;
}
