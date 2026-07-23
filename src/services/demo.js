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
  ['Sometimes I Might Be Introvert', 'GREY Area', 'No Thank You'],
  ['Mordechai', 'Con Todo El Mundo', 'A LA SALA'],
  ['Jubilee', 'Soft Sounds from Another Planet', 'For Melancholy Brunettes (& sad women)'],
  ['Lahai', 'Process', 'Dual'],
];
const counts = { albums: 286, artists: 94, songs: 1248, podcasts: 67 };
const failRandomPick = import.meta.env.DEV && new URLSearchParams(window.location.search).get('demo') === 'error';

function item(type, index) {
  return {
    id: `${type}-${index}`,
    title: names[type][index % names[type].length],
    subtitle: type === 'podcasts' ? 'A saved episode' : ['Tame Impala', 'Little Simz', 'Japanese Breakfast', 'Sampha'][index % 4],
    detail: type === 'artists' ? `${(index + 2) * 134}K followers` : 'Saved in your Spotify library',
    imageStyle: covers[index % covers.length],
    url: 'https://open.spotify.com/',
    addedAt: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

export const demoProfile = { display_name: 'Peng', images: [] };
export const demoService = {
  async loadCategory(type) {
    await new Promise(resolve => setTimeout(resolve, 220));
    return { count: counts[type], latest: Array.from({ length: 6 }, (_, index) => item(type, index)) };
  },
  async getRandomItem(type) {
    await new Promise(resolve => setTimeout(resolve, 420));
    if (failRandomPick) throw new Error('Spotify is temporarily unreachable. Please try again.');
    return item(type, Math.floor(Math.random() * 4));
  },
  async getRandomArtistAlbum(artistId) {
    await new Promise(resolve => setTimeout(resolve, 320));
    const artistIndex = Number(artistId?.split('-').at(-1)) || 0;
    const albums = artistAlbums[artistIndex % artistAlbums.length];
    const albumIndex = Math.floor(Math.random() * albums.length);
    return {
      ...item('albums', artistIndex),
      id: `${artistId}-album-${albumIndex}`,
      title: albums[albumIndex],
      subtitle: names.artists[artistIndex % names.artists.length],
      detail: `${2018 + albumIndex * 3} · ${10 + albumIndex} tracks`,
    };
  },
};
