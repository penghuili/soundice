const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
const retryDelays = [350, 900];

function wait(milliseconds) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get('Retry-After'));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 3000);
  }
  return retryDelays[attempt] || retryDelays.at(-1);
}

export async function fetchWithRetry(url, options) {
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!retryableStatuses.has(response.status) || attempt === retryDelays.length) {
        return response;
      }
      await wait(retryDelay(response, attempt));
    } catch (error) {
      if (attempt === retryDelays.length) {
        const networkError = new Error('Spotify is temporarily unreachable. Please try again.');
        networkError.cause = error;
        throw networkError;
      }
      await wait(retryDelays[attempt]);
    }
  }

  throw new Error('Spotify is temporarily unreachable. Please try again.');
}
