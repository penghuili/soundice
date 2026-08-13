const wikiApi = 'https://en.wikipedia.org/w/api.php';
const cache = new Map();

const skipTitle = /\b(discography|filmography|song|album|soundtrack|single|ep|film|movie|tour|concert)\b/i;
const titleQualifier = /\((musician|band|singer|rapper|group|artist|dj|duo|trio|quartet|producer|composer)\)$/i;
const musicWords = /musician|singer|rapper|band|songwriter|\bdj\b|composer|vocalist|record producer|hip[ -]?hop|musical (?:project|group|duo|ensemble)|music project/i;

function cacheKey(artist) {
  return (artist?.name || artist?.id || '').trim().toLowerCase();
}

function stripTags(html = '') {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&');
}

async function wikiJson(params) {
  const url = `${wikiApi}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('Wikipedia request failed.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function searchWiki(query) {
  const data = await wikiJson({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '8',
    srprop: 'snippet',
  });
  return data.query?.search || [];
}

function scoreHit(hit, name) {
  const title = hit.title || '';
  const lower = title.toLowerCase();
  const nameLower = name.toLowerCase();
  if (skipTitle.test(title) && lower !== nameLower) return -1;

  let score = 0;
  if (lower === nameLower) score += 80;
  if (lower.startsWith(`${nameLower} (`)) score += 50;
  if (titleQualifier.test(title)) score += 40;
  if (
    lower === `${nameLower} (musician)`
    || lower === `${nameLower} (band)`
    || lower === `${nameLower} (singer)`
    || lower === `${nameLower} (rapper)`
  ) {
    score += 30;
  }
  if (musicWords.test(stripTags(hit.snippet || ''))) score += 15;
  if (lower.includes(nameLower)) score += 5;
  return score;
}

function isDisambiguation(page, extract) {
  if (page.pageprops?.disambiguation != null) return true;
  const firstLine = extract.split('\n')[0] || '';
  return / may refer to:?$/i.test(firstLine);
}

async function fetchSummary(title) {
  const data = await wikiJson({
    action: 'query',
    prop: 'extracts|pageimages|description|info|pageprops',
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    piprop: 'thumbnail',
    pithumbsize: '360',
    inprop: 'url',
    ppprop: 'disambiguation',
    titles: title,
  });
  const page = data.query?.pages?.[0];
  if (!page || page.missing || page.invalid) return null;
  const extract = (page.extract || '').trim();
  if (!extract || isDisambiguation(page, extract)) return null;
  return {
    title: page.title,
    description: page.description || '',
    extract: extract.replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n'),
    thumbnail: page.thumbnail?.source || null,
    url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
  };
}

function isMusicPage(summary) {
  if (!summary) return false;
  if (titleQualifier.test(summary.title)) return true;
  return musicWords.test(`${summary.description} ${summary.extract}`);
}

async function fetchWikipediaBio(name) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const queries = [trimmed, `${trimmed} (musician OR band OR singer OR rapper)`];
  const seen = new Set();
  const candidates = [];

  for (const query of queries) {
    const hits = await searchWiki(query);
    for (const hit of hits) {
      if (seen.has(hit.title)) continue;
      seen.add(hit.title);
      const score = scoreHit(hit, trimmed);
      if (score >= 0) candidates.push({ title: hit.title, score });
    }
    if (candidates.some(candidate => candidate.score >= 90)) break;
  }

  candidates.sort((a, b) => b.score - a.score);

  for (const candidate of candidates.slice(0, 4)) {
    const summary = await fetchSummary(candidate.title);
    if (isMusicPage(summary)) return summary;
  }

  for (const suffix of ['(musician)', '(band)', '(singer)', '(rapper)', '(group)']) {
    const summary = await fetchSummary(`${trimmed} ${suffix}`);
    if (isMusicPage(summary)) return summary;
  }

  return null;
}

export async function getArtistIntro(artist) {
  const key = cacheKey(artist);
  if (key && cache.has(key)) return cache.get(key);

  let wiki = null;
  try {
    wiki = await fetchWikipediaBio(artist?.name);
  } catch {
    wiki = null;
  }

  const intro = {
    name: artist?.name || wiki?.title || 'Artist',
    image: artist?.image || wiki?.thumbnail || null,
    description: wiki?.description || '',
    extract: wiki?.extract || '',
    wikipediaUrl: wiki?.url || null,
    spotifyUrl: artist?.url || null,
  };

  if (key && wiki) cache.set(key, intro);
  return intro;
}
