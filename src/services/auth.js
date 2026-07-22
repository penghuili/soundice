import { storage, storageKeys } from './storage.js';
import { fetchWithRetry } from './request.js';

const clientId = 'fd576a531dd842c6ab8549636279a775';
const redirectUri = import.meta.env.VITE_REDIRECT_URL || window.location.origin;
const tokenUrl = 'https://accounts.spotify.com/api/token';
let refreshPromise = null;

export class AuthRequiredError extends Error {
  constructor(message = 'Your Spotify session has expired.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

function randomString(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, value => alphabet[value % alphabet.length]).join('');
}

async function createChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function readTokenResponse(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || fallbackMessage);
    error.code = data.error;
    throw error;
  }
  return data;
}

function saveTokens(tokens, preserveRefreshToken = false) {
  storage.set(storageKeys.accessToken, tokens.access_token);
  if (tokens.refresh_token || !preserveRefreshToken) {
    storage.set(storageKeys.refreshToken, tokens.refresh_token);
  }
  storage.set(storageKeys.expiresAt, Date.now() + Math.max(tokens.expires_in - 60, 0) * 1000);
}

export function hasSession() {
  return Boolean(storage.get(storageKeys.accessToken) && storage.get(storageKeys.refreshToken));
}

export async function beginSpotifyLogin() {
  const verifier = randomString(64);
  storage.set(storageKeys.codeVerifier, verifier);
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: 'user-library-read user-follow-read',
    code_challenge_method: 'S256',
    code_challenge: await createChallenge(verifier),
    redirect_uri: redirectUri,
  }).toString();
  window.location.assign(authUrl.toString());
}

export async function exchangeAuthorizationCode(code) {
  const verifier = storage.get(storageKeys.codeVerifier);
  if (!verifier) throw new Error('The sign-in request has expired. Please connect again.');
  const response = await fetchWithRetry(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  const tokens = await readTokenResponse(response, 'Could not connect to Spotify.');
  saveTokens(tokens);
  storage.remove(storageKeys.codeVerifier);
}

function clearSession() {
  Object.values(storageKeys).forEach(key => storage.remove(key));
}

async function refreshAccessToken() {
  const savedRefreshToken = storage.get(storageKeys.refreshToken);
  if (!savedRefreshToken) throw new AuthRequiredError();
  try {
    const response = await fetchWithRetry(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: savedRefreshToken,
      }),
    });
    const tokens = await readTokenResponse(response, 'Spotify could not refresh your session.');
    saveTokens(tokens, true);
    return tokens.access_token;
  } catch (error) {
    if (error.code === 'invalid_grant') {
      clearSession();
      throw new AuthRequiredError();
    }
    throw error;
  }
}

export async function getAccessToken(forceRefresh = false) {
  const accessToken = storage.get(storageKeys.accessToken);
  const expiresAt = storage.get(storageKeys.expiresAt);
  if (!accessToken || !storage.get(storageKeys.refreshToken)) throw new AuthRequiredError();
  if (!forceRefresh && expiresAt && Date.now() < expiresAt) return accessToken;
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function signOut() {
  clearSession();
}
