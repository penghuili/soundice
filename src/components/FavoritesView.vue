<script setup>
import { onMounted, reactive, ref } from 'vue';

import { AuthRequiredError } from '../services/auth.js';
import AppHeader from './AppHeader.vue';
import MediaArtwork from './MediaArtwork.vue';

const props = defineProps({
  profile: { type: Object, default: null },
  favorites: { type: Object, required: true },
});
const emit = defineEmits(['logout', 'open-library']);

const types = {
  albums: 'album',
  artists: 'artist',
  songs: 'song',
  podcasts: 'episode',
};
const state = reactive({ items: [], loading: false, loaded: false, error: '' });
const favoriteError = ref('');

onMounted(() => loadFavorites());

async function loadFavorites(force = false) {
  if (state.loaded && !force) return;
  state.loading = true;
  state.error = '';
  favoriteError.value = '';
  try {
    state.items = await props.favorites.list();
    state.loaded = true;
  } catch (error) {
    if (error instanceof AuthRequiredError) emit('logout');
    state.error = formatError(error, 'Soundice could not load your favorites.');
    favoriteError.value = state.error;
  } finally {
    state.loading = false;
  }
}

async function removeFavorite(favorite) {
  favoriteError.value = '';
  try {
    await props.favorites.remove(favorite.type, favorite.item.id);
    state.items = state.items.filter(item => item !== favorite);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      favoriteError.value = formatError(error, 'Could not update favorites.');
    }
  }
}

function formatError(error, fallback) {
  const message = error.message || fallback;
  return error.status && !message.includes(String(error.status)) ? `${message} (HTTP ${error.status})` : message;
}
</script>

<template>
  <div class="app-shell">
    <AppHeader
      :profile="profile"
      :favorite-count="state.loaded ? state.items.length : null"
      favorites-active
      @logout="$emit('logout')"
    />

    <section class="favorites-page">
      <div class="favorites-heading">
        <div>
          <p class="feature-kicker">Your personal shelf</p>
          <h1>Favorites</h1>
          <p>Keep the albums, artists, songs, and podcasts you want to find again.</p>
        </div>
        <div class="favorites-heading-actions">
          <button class="secondary-button favorites-back-button" type="button" @click="$emit('open-library')">Back to library</button>
          <button class="icon-button" type="button" aria-label="Refresh favorites" title="Refresh favorites" :disabled="state.loading" @click="loadFavorites(true)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.24L14 10h6V4l-2.35 2.35Z" /></svg>
          </button>
          <span class="favorites-count">{{ state.loaded ? state.items.length : '—' }}</span>
        </div>
      </div>

      <div v-if="state.loading" class="favorites-empty" aria-live="polite">
        <span>↻</span>
        <h2>Loading your shelf</h2>
        <p>Soundice is fetching your saved items.</p>
      </div>
      <div v-else-if="state.error" class="favorites-empty" role="alert">
        <span>!</span>
        <h2>Favorites could not load</h2>
        <p>{{ state.error }}</p>
        <button class="secondary-button" type="button" @click="loadFavorites(true)">Try again</button>
      </div>
      <div v-else-if="!state.items.length" class="favorites-empty">
        <span>★</span>
        <h2>Nothing saved here yet</h2>
        <p>Tap the star on anything Soundice picks to build your shelf.</p>
      </div>
      <div v-else class="favorites-list">
        <article v-for="favorite in state.items" :key="`${favorite.type}-${favorite.item.id}`" class="favorite-item">
          <MediaArtwork :item="favorite.item" small />
          <div class="favorite-item-copy">
            <span class="favorite-type">{{ types[favorite.type] || favorite.type }}</span>
            <a v-if="favorite.item.url" class="recent-title-link" :href="favorite.item.url" target="_blank" rel="noreferrer"><strong>{{ favorite.item.title }}</strong></a>
            <strong v-else>{{ favorite.item.title }}</strong>
            <span>{{ favorite.item.subtitle || favorite.item.detail }}</span>
          </div>
          <button class="icon-button favorite-toggle favorite-toggle-small active" type="button" :aria-label="`Remove ${favorite.item.title} from favorites`" :title="`Remove ${favorite.item.title} from favorites`" @click="removeFavorite(favorite)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
          </button>
        </article>
      </div>
      <p v-if="favoriteError" class="favorites-error" role="alert">{{ favoriteError }}</p>
    </section>

    <footer class="app-footer">
      <p><strong>Soundice</strong> picks from your Spotify library. Favorites are saved securely in Cloudflare.</p>
      <div>
        <a class="status-link" href="https://x.com/SpotifyStatus" target="_blank" rel="noreferrer">Spotify Status</a>
        <a class="github-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer" title="View on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.605.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg></a>
      </div>
    </footer>
  </div>
</template>
