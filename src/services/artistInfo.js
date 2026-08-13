function aiModeUrl(query) {
  const text = String(query || '').trim();
  if (!text) return null;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', text);
  url.searchParams.set('udm', '50');
  return url.href;
}

function artistList(artists) {
  if (Array.isArray(artists)) {
    return artists.map(artist => artist?.name || artist).filter(Boolean).join('、');
  }
  return String(artists || '').trim();
}

export function artistAiModeUrl(name) {
  const artist = String(name || '').trim();
  return artist ? aiModeUrl(`介绍这个歌手/乐队：${artist}。这个歌手/乐队有什么有意思的信息`) : null;
}

export function albumAiModeUrl(title, artists) {
  const album = String(title || '').trim();
  if (!album) return null;
  const who = artistList(artists);
  const intro = who ? `介绍这张专辑：${album}，这是${who}的专辑` : `介绍这张专辑：${album}`;
  return aiModeUrl(`${intro}。这张专辑有什么有意思的信息`);
}
