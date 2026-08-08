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
const rollState = reactive({ current: null, previous: null, rolling: false });
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
    if (state.items.length) {
      await roll(false);
    } else {
      rollState.current = null;
      rollState.previous = null;
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) emit('logout');
    state.error = formatError(error, 'Soundice could not load your favorites.');
    favoriteError.value = state.error;
  } finally {
    state.loading = false;
  }
}

function favoriteKey(favorite) {
  return favorite ? `${favorite.type}:${favorite.item?.id}` : '';
}

function sameFavorite(a, b) {
  return Boolean(a && b && a.type === b.type && a.item?.id === b.item?.id);
}

async function roll(animate = true) {
  if (!state.items.length || rollState.rolling) return;
  rollState.rolling = animate;
  try {
    if (animate) await new Promise(resolve => setTimeout(resolve, 280));
    const pool = state.items.length > 1 && rollState.current
      ? state.items.filter(item => !sameFavorite(item, rollState.current))
      : state.items;
    const next = pool[Math.floor(Math.random() * pool.length)];
    if (rollState.current) rollState.previous = rollState.current;
    rollState.current = next;
  } finally {
    rollState.rolling = false;
  }
}

function goBack() {
  if (!rollState.previous || rollState.rolling) return;
  rollState.current = rollState.previous;
  rollState.previous = null;
}

async function removeFavorite(favorite) {
  if (!favorite?.item?.id) return;
  favoriteError.value = '';
  try {
    await props.favorites.remove(favorite.type, favorite.item.id);
    state.items = state.items.filter(item => !sameFavorite(item, favorite));
    if (sameFavorite(rollState.previous, favorite)) rollState.previous = null;
    if (sameFavorite(rollState.current, favorite)) {
      rollState.current = null;
      if (state.items.length) await roll(false);
    }
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
      <div v-else class="favorites-body">
        <section class="feature-card favorites-random-card">
          <div class="feature-topline">
            <span>Random favorite</span>
            <button
              v-if="rollState.previous"
              class="icon-button previous-button"
              type="button"
              aria-label="Undo"
              title="Undo"
              :disabled="rollState.rolling"
              @click="goBack"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z" /></svg>
            </button>
          </div>

          <Transition name="swap" mode="out-in">
            <div v-if="rollState.current" :key="favoriteKey(rollState.current)" class="feature-content">
              <MediaArtwork :item="rollState.current.item" />
              <div class="feature-details">
                <p class="feature-kicker">Soundice picked</p>
                <p class="favorite-type-badge">{{ types[rollState.current.type] || rollState.current.type }}</p>
                <h2>{{ rollState.current.item.title }}</h2>
                <p class="feature-subtitle">
                  <template v-if="rollState.current.type === 'albums' && rollState.current.item.artistLinks?.length">
                    <template v-for="(artist, index) in rollState.current.item.artistLinks" :key="artist.id || artist.name">
                      <span v-if="index">, </span><a v-if="artist.url" class="artist-link" :href="artist.url" target="_blank" rel="noreferrer">{{ artist.name }}</a><span v-else>{{ artist.name }}</span>
                    </template>
                  </template>
                  <template v-else>{{ rollState.current.item.subtitle }}</template>
                </p>
                <p v-if="rollState.current.item.detail" class="feature-meta">{{ rollState.current.item.detail }}</p>
                <div class="feature-actions">
                  <button class="primary-button roll-button" type="button" :disabled="rollState.rolling" @click="roll()">
                    <img :class="{ spinning: rollState.rolling }" class="roll-mark" src="/soundice-mark-inverted.svg" alt="" width="21" height="21" />
                    {{ rollState.rolling ? 'Rolling…' : 'Roll again' }}
                  </button>
                  <a v-if="rollState.current.item.url" class="spotify-link spotify-action" :href="rollState.current.item.url" target="_blank" rel="noreferrer">Open in Spotify ↗</a>
                  <button class="favorite-toggle favorite-toggle-compact active" type="button" aria-pressed="true" @click="removeFavorite(rollState.current)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
                    Favorited
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="feature-retry">
              <span>↻</span>
              <h2>One more roll?</h2>
              <p>Pick another favorite from your shelf.</p>
              <button class="primary-button roll-button" type="button" :disabled="rollState.rolling" @click="roll()">
                {{ rollState.rolling ? 'Trying again…' : 'Try again' }}
              </button>
            </div>
          </Transition>
        </section>

        <section class="favorites-list-panel">
          <div class="panel-heading">
            <div>
              <p>Your shelf</p>
              <h2>All favorites</h2>
            </div>
            <span>{{ state.items.length }}</span>
          </div>
          <div class="favorites-list">
            <article v-for="favorite in state.items" :key="favoriteKey(favorite)" class="favorite-item">
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
        </section>
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
