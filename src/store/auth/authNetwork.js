import { replaceTo } from 'react-baby-router';

import { storageKeys } from '../../lib/storageKeys';
import { eventEmitter, eventEmitterEvents } from '../../shared/browser/eventEmitter';
import { LocalStorage } from '../../shared/browser/LocalStorage';
import { isLoggedInCat } from './authCats';

const generateRandomString = length => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async plain => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = input => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const createCodeVerifier = () => {
  if (LocalStorage.get(storageKeys.codeVerifier)) {
    return LocalStorage.get(storageKeys.codeVerifier);
  }
  const codeVerifier = generateRandomString(64);
  LocalStorage.set(storageKeys.codeVerifier, codeVerifier);
  return codeVerifier;
};

createCodeVerifier();

const clientId = 'fd576a531dd842c6ab8549636279a775';
const redirectUri = import.meta.env.VITE_REDIRECT_URL;

export function checkTokens() {
  const refreshToken = LocalStorage.get(storageKeys.refreshToken);
  const accessToken = LocalStorage.get(storageKeys.accessToken);
  const isLoggedIn = !!refreshToken && !!accessToken;

  isLoggedInCat.set(isLoggedIn);

  return isLoggedIn;
}

export async function signIn() {
  const codeVerifier = LocalStorage.get(storageKeys.codeVerifier);
  if (!codeVerifier) {
    return;
  }

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const scope = 'user-library-read user-follow-read';
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  const params = {
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
}

export async function getTokens(code) {
  let codeVerifier = LocalStorage.get(storageKeys.codeVerifier);

  try {
    const url = 'https://accounts.spotify.com/api/token';
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    };

    const body = await fetch(url, payload);
    const response = await body.json();

    LocalStorage.set(storageKeys.accessToken, response.access_token);
    LocalStorage.set(storageKeys.refreshToken, response.refresh_token);
    LocalStorage.set(storageKeys.expiresAt, Date.now() + (response.expires_in - 60) * 1000);
    isLoggedInCat.set(true);

    replaceTo('/');
  } catch (error) {
    console.console(error);
  }
}

export async function refreshToken() {
  const refreshToken = LocalStorage.get(storageKeys.refreshToken);
  const url = 'https://accounts.spotify.com/api/token';
  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  };

  try {
    const body = await fetch(url, payload);
    const response = await body.json();

    LocalStorage.set(storageKeys.accessToken, response.access_token);
    LocalStorage.set(storageKeys.refreshToken, response.refresh_token);
    LocalStorage.set(storageKeys.expiresAt, Date.now() + (response.expires_in - 60) * 1000);

    eventEmitter.emit(eventEmitterEvents.refreshed);
  } catch (error) {
    console.console(error);
  }
}

let isRefreshing = false;
export async function refreshTokenIfNecessary() {
  if (isRefreshing) {
    await eventEmitter.once(eventEmitterEvents.refreshed);
    return;
  }

  isRefreshing = true;
  const expiresAt = LocalStorage.get(storageKeys.expiresAt);
  if (Date.now() > expiresAt) {
    await refreshToken();
  }
  isRefreshing = false;
}
