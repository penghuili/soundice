export function artistAiModeUrl(name) {
  const artist = String(name || '').trim();
  if (!artist) return null;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', `介绍这个歌手：${artist}`);
  url.searchParams.set('udm', '50');
  return url.href;
}
