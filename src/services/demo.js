const covers = [
  'linear-gradient(145deg, #ec5a36, #6e1739)',
  'linear-gradient(145deg, #72d6a5, #163f51)',
  'linear-gradient(145deg, #8b7cf6, #2a164f)',
  'linear-gradient(145deg, #f3b852, #6b2d1c)',
];
const names = {
  albums: ['Currents', 'Sometimes I Might Be Introvert', 'Jubilee', 'Awaken, My Love!'],
  artists: ['Little Simz', 'Khruangbin', 'Japanese Breakfast', 'Sampha'],
  songs: ['Borderline', 'Woman', 'Paprika', 'Spirit 2.0'],
  podcasts: ['The Memory Palace', '99% Invisible', 'Search Engine', 'Twenty Thousand Hertz'],
};
const artistAlbums = [
  [
    { title: 'Sometimes I Might Be Introvert', year: 2021, tracks: 19 },
    { title: 'GREY Area', year: 2019, tracks: 11 },
    { title: 'Drop 6', year: 2022, tracks: 5, kind: 'EP' },
  ],
  [
    { title: 'Mordechai', year: 2020, tracks: 10 },
    { title: 'Con Todo El Mundo', year: 2018, tracks: 10 },
    { title: 'Texas Sun', year: 2020, tracks: 4, kind: 'EP' },
  ],
  [
    { title: 'Jubilee', year: 2021, tracks: 10 },
    { title: 'Soft Sounds from Another Planet', year: 2017, tracks: 10 },
    { title: 'June', year: 2016, tracks: 5, kind: 'EP' },
  ],
  [
    { title: 'Lahai', year: 2023, tracks: 14 },
    { title: 'Process', year: 2017, tracks: 9 },
    { title: 'Dual', year: 2013, tracks: 6, kind: 'EP' },
  ],
];
const counts = { albums: 286, artists: 94, songs: 1248, podcasts: 67 };
const failRandomPick = import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === 'error';

function item(type, index) {
  const artistName = ['Tame Impala', 'Little Simz', 'Japanese Breakfast', 'Sampha'][index % 4];
  return {
    id: `${type}-${index}`,
    title: names[type][index % names[type].length],
    subtitle: type === 'podcasts' ? 'A saved episode' : artistName,
    artistLinks: ['albums', 'songs'].includes(type) ? [{ id: `artist-${index}`, name: artistName, url: 'https://open.spotify.com/' }] : [],
    albumTitle: type === 'albums' ? names.albums[index % names.albums.length] : type === 'songs' ? names.albums[index % names.albums.length] : null,
    detail: type === 'artists' ? `${(index + 2) * 134}K followers` : type === 'songs' ? names.albums[index % names.albums.length] : 'Saved in your Spotify library',
    imageStyle: covers[index % covers.length],
    url: 'https://open.spotify.com/',
    uri: `spotify:${type}:${index}`,
    addedAt: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

export const demoProfile = { display_name: 'Peng', images: [] };
const demoFavorites = [];
export const demoService = {
  async loadCategory(type) {
    await new Promise(resolve => setTimeout(resolve, 220));
    return { count: counts[type], latest: Array.from({ length: 6 }, (_, index) => item(type, index)) };
  },
  async getRandomItem(type) {
    await new Promise(resolve => setTimeout(resolve, 420));
    if (failRandomPick) {
      const error = new Error('Spotify is temporarily unreachable. Please try again.');
      error.status = 503;
      throw error;
    }
    return item(type, Math.floor(Math.random() * 4));
  },
  async getRandomArtistAlbum(artistId) {
    await new Promise(resolve => setTimeout(resolve, 320));
    const artistIndex = Number(artistId?.split('-').at(-1)) || 0;
    const albums = artistAlbums[artistIndex % artistAlbums.length];
    const albumIndex = Math.floor(Math.random() * albums.length);
    const album = albums[albumIndex];
    return {
      ...item('albums', artistIndex),
      id: `${artistId}-album-${albumIndex}`,
      title: album.title,
      subtitle: names.artists[artistIndex % names.artists.length],
      artistLinks: [{ id: artistId, name: names.artists[artistIndex % names.artists.length], url: 'https://open.spotify.com/' }],
      albumTitle: album.title,
      detail: [album.year, album.kind, `${album.tracks} tracks`].filter(Boolean).join(' · '),
    };
  },
  async removeItem() {
    await new Promise(resolve => setTimeout(resolve, 260));
  },
  async list() {
    await new Promise(resolve => setTimeout(resolve, 180));
    return demoFavorites.filter(favorite => favorite.type === 'albums').map(favorite => ({ ...favorite, item: { ...favorite.item } }));
  },
  async add(type, favoriteItem) {
    if (type !== 'albums') throw new Error('Only albums can be favorited.');
    await new Promise(resolve => setTimeout(resolve, 180));
    const favorite = { type, item: { ...favoriteItem }, createdAt: new Date().toISOString() };
    const existingIndex = demoFavorites.findIndex(item => item.type === type && item.item.id === favoriteItem.id);
    if (existingIndex >= 0) demoFavorites.splice(existingIndex, 1);
    demoFavorites.unshift(favorite);
    return favorite;
  },
  async remove(type, itemId) {
    if (type !== 'albums') throw new Error('Only albums can be favorited.');
    await new Promise(resolve => setTimeout(resolve, 180));
    const index = demoFavorites.findIndex(item => item.type === type && item.item.id === itemId);
    if (index >= 0) demoFavorites.splice(index, 1);
  },
};
