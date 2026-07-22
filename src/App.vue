<script setup>
import { onMounted, ref } from 'vue';

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
import * as spotifyService from './services/spotify.js';

const demoMode = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');
const status = ref('loading');
const profile = ref(null);
const message = ref('');

onMounted(async () => {
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
    <img class="brand-logo boot-logo-mark" src="/soundice-mark.svg" alt="" width="54" height="54" />
    <div class="boot-line"><span /></div>
  </main>

  <LandingView v-else-if="status === 'guest'" :message="message" @connect="connect" />

  <LibraryView
    v-else
    :profile="profile"
    :service="demoMode ? demoService : spotifyService"
    @logout="logout"
  />
</template>
