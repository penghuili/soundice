<script setup>
import { onMounted, ref } from 'vue';

import FavoritesView from './components/FavoritesView.vue';
import LandingView from './components/LandingView.vue';
import LibraryView from './components/LibraryView.vue';
import {
  AuthRequiredError,
  beginSpotifyLogin,
  exchangeAuthorizationCode,
  hasSession,
  signOut,
} from './services/auth.js';
import { demoProfile, demoService } from './services/demo.js';
import * as favoritesService from './services/favorites.js';
import * as spotifyService from './services/spotify.js';

const demoMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');
const status = ref('loading');
const profile = ref(null);
const message = ref('');
const view = ref(window.location.pathname.replace(/\/+$/, '') === '/favorites' ? 'favorites' : 'library');
const libraryUrl = ref(view.value === 'library' ? `${window.location.pathname}${window.location.search}${window.location.hash}` : '/');

function setView(nextView, replace = false) {
  const path = nextView === 'favorites' ? '/favorites' : '/';
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', path);
  view.value = nextView;
}

function openFavorites() {
  libraryUrl.value = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  setView('favorites');
}

function openLibrary() {
  window.history.pushState({}, '', libraryUrl.value);
  view.value = 'library';
}

onMounted(async () => {
  if (view.value === 'library' && new URLSearchParams(window.location.search).get('tab') === 'favorites') {
    setView('favorites', true);
  }
  window.addEventListener('popstate', () => {
    view.value = window.location.pathname.replace(/\/+$/, '') === '/favorites' ? 'favorites' : 'library';
  });

  if (demoMode) {
    profile.value = demoProfile;
    status.value = 'ready';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const authError = params.get('error');

  try {
    if (authError) throw new Error('Spotify sign-in was cancelled.');
    if (code) {
      await exchangeAuthorizationCode(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (!hasSession()) {
      status.value = 'guest';
      return;
    }
    profile.value = await spotifyService.getProfile();
    status.value = 'ready';
  } catch (error) {
    if (error instanceof AuthRequiredError) signOut();
    message.value = error.message || 'Could not connect to Spotify.';
    status.value = 'guest';
  }
});

async function connect() {
  message.value = '';
  try {
    await beginSpotifyLogin();
  } catch (error) {
    message.value = error.message || 'Could not start Spotify sign-in.';
  }
}

function logout() {
  signOut();
  profile.value = null;
  status.value = 'guest';
}
</script>

<template>
  <main v-if="status === 'loading'" class="boot-screen" aria-label="Loading Soundice">
    <img class="boot-logo-mark" src="/soundice-mark.svg" alt="" width="54" height="54" />
    <div class="boot-line"><span /></div>
  </main>

  <LandingView v-else-if="status === 'guest'" :message="message" @connect="connect" />

  <FavoritesView
    v-else-if="view === 'favorites'"
    :profile="profile"
    :favorites="demoMode ? demoService : favoritesService"
    @open-library="openLibrary"
    @logout="logout"
  />

  <LibraryView
    v-else
    :profile="profile"
    :service="demoMode ? demoService : spotifyService"
    :favorites="demoMode ? demoService : favoritesService"
    @open-favorites="openFavorites"
    @logout="logout"
  />
</template>
