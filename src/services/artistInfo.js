export function artistAiModeUrl(name) {
  const query = String(name || '').trim();
  if (!query) return null;
  const url = new URL('https://www.google.com/search');
  url.searchParams.set('q', query);
  url.searchParams.set('udm', '50');
  return url.href;
}
