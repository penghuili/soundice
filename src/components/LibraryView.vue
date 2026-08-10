<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { AuthRequiredError } from '../services/auth.js';
import AppHeader from './AppHeader.vue';
import MediaArtwork from './MediaArtwork.vue';

const props = defineProps({
  profile: { type: Object, default: null },
  service: { type: Object, required: true },
  favorites: { type: Object, required: true },
});
const emit = defineEmits(['logout', 'open-favorites']);

const libraryCategories = [
  { id: 'albums', label: 'Albums', singular: 'album', symbol: '◐', recent: 'Recently saved' },
  { id: 'artists', label: 'Artists', singular: 'artist', symbol: '✦', recent: 'Recently followed' },
  { id: 'songs', label: 'Songs', singular: 'song', symbol: '♪', recent: 'Recently liked' },
  { id: 'podcasts', label: 'Podcasts', singular: 'episode', symbol: '◉', recent: 'Recently saved' },
];
const categories = libraryCategories;
const removeLabels = {
  albums: 'Remove album',
  artists: 'Unfollow artist',
  songs: 'Remove song',
  podcasts: 'Remove episode',
};

const requestedTab = new URLSearchParams(window.location.search).get('tab');
const active = ref(categories.some(category => category.id === requestedTab) ? requestedTab : 'albums');
const artistAlbum = reactive({ current: null, previous: null, rolling: false, error: '', artistId: null });
const pendingRemoval = reactive({ type: null, item: null });
const randomizing = ref(false);
const favoriteError = ref('');
const favoriteState = reactive({ count: null, latest: [], loading: false, loaded: false, error: '' });
let favoritesLoadPromise = null;
const states = reactive(
  Object.fromEntries(
    libraryCategories.map(category => [
      category.id,
      {
        count: null,
        latest: [],
        current: null,
        previous: null,
        previousArtistAlbum: null,
        loading: false,
        rolling: false,
        removing: false,
        loaded: false,
        error: '',
        rollError: '',
        removeError: '',
      },
    ])
  )
);
const itemType = computed(() => active.value);
const meta = computed(() => categories.find(category => category.id === active.value));
const state = computed(() => states[active.value]);
const removalState = computed(() => states[pendingRemoval.type]);
const categoryLoadPromises = new Map();

function itemCategory(item) {
  return item?.categoryType || itemType.value;
}
function categoryCount(type) {
  return states[type].count;
}
const pendingRemovalLabel = computed(() => pendingRemoval.type ? removeLabels[pendingRemoval.type] : '');

watch(active, type => {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', type);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  load(type);
}, { immediate: true });

async function load(type = active.value, pick = true) {
  const target = states[type];
  if (target.loading) return categoryLoadPromises.get(type);
  if (target.loaded) {
    if (pick && target.count && !target.current) await roll(type, false);
    return;
  }
  target.loading = true;
  target.error = '';
  target.rollError = '';
  const promise = (async () => {
    try {
      const data = await props.service.loadCategory(type);
      target.count = data.count;
      target.latest = data.latest;
      target.loaded = true;
      target.removeError = '';
      if (data.count && pick) await roll(type, false);
    } catch (error) {
      handleError(error, target);
    } finally {
      target.loading = false;
      categoryLoadPromises.delete(type);
    }
  })();
  categoryLoadPromises.set(type, promise);
  return promise;
}

onMounted(() => {
  loadFavorites().catch(() => {});
});

async function loadFavorites(force = false) {
  if (favoriteState.loaded && !force) return favoriteState.latest;
  if (favoritesLoadPromise) return favoritesLoadPromise;

  favoriteState.loading = true;
  favoriteState.error = '';
  favoriteError.value = '';
  favoritesLoadPromise = props.favorites.list()
    .then(items => {
      favoriteState.latest = items.filter(item => item.type === 'albums');
      favoriteState.count = favoriteState.latest.length;
      favoriteState.loaded = true;
      return items;
    })
    .catch(error => {
      if (error instanceof AuthRequiredError) emit('logout');
      favoriteState.error = formatError(error, 'Soundice could not load your favorites.');
      favoriteError.value = favoriteState.error;
      throw error;
    })
    .finally(() => {
      favoriteState.loading = false;
      favoritesLoadPromise = null;
    });
  return favoritesLoadPromise;
}

function isFavorite(type, item) {
  return Boolean(item?.id && favoriteState.latest.some(favorite => favorite.type === type && favorite.item?.id === item.id));
}

async function toggleFavorite(type, item) {
  if (type !== 'albums' || !item) return;
  try {
    await loadFavorites();
  } catch {
    return;
  }
  if (favoriteError.value) return;
  const target = favoriteState;
  const existing = target.latest.find(favorite => favorite.type === type && favorite.item?.id === item.id);
  favoriteError.value = '';
  try {
    if (existing) {
      await props.favorites.remove(type, item.id);
      target.latest = target.latest.filter(favorite => favorite !== existing);
    } else {
      const favorite = await props.favorites.add(type, item);
      target.latest = [favorite, ...target.latest];
    }
    target.count = target.latest.length;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      favoriteError.value = formatError(error, 'Could not update this favorite.');
    }
  }
}

async function roll(type = active.value, animate = true) {
  return rollCategory(type, states[type], animate);
}

async function rollCategory(type, target, animate = true) {
  if (!target.count || target.rolling) return;
  target.rolling = animate;
  target.rollError = '';
  target.removeError = '';
  try {
    const next = await props.service.getRandomItem(type, target.count);
    if (target.current) {
      target.previous = target.current;
      if (type === 'artists') target.previousArtistAlbum = artistAlbum.current;
    }
    target.current = next;
    if (type === 'artists' && target.current) {
      artistAlbum.previous = null;
      await rollArtistAlbum(target.current, animate);
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      target.rollError = formatError(error, 'Spotify could not pick something right now.');
    }
  } finally {
    target.rolling = false;
  }
}

async function randomize() {
  if (randomizing.value) return;
  randomizing.value = true;
  try {
    await Promise.all(libraryCategories.map(category => load(category.id, false)));
    const available = libraryCategories.filter(category => states[category.id].count);
    if (!available.length) return;
    const type = available[Math.floor(Math.random() * available.length)].id;
    await roll(type);
    active.value = type;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      state.value.rollError = formatError(error, 'Spotify could not pick something right now.');
    }
  } finally {
    randomizing.value = false;
  }
}

function goBack(type = active.value) {
  const target = states[type];
  if (!target.previous || target.rolling || target.removing) return;
  target.current = target.previous;
  target.previous = null;
  target.rollError = '';
  target.removeError = '';
  if (type === 'artists') {
    artistAlbum.current = target.previousArtistAlbum;
    target.previousArtistAlbum = null;
    artistAlbum.previous = null;
    artistAlbum.artistId = target.current?.id ?? null;
    artistAlbum.error = '';
    artistAlbum.rolling = false;
  }
}

function requestRemoval(type = itemType.value) {
  const target = states[type];
  const item = target.current;
  if (!item || target.removing) return;
  pendingRemoval.type = type;
  pendingRemoval.item = item;
}

function closeRemovalDialog() {
  if (pendingRemoval.type && states[pendingRemoval.type]?.removing) return;
  pendingRemoval.type = null;
  pendingRemoval.item = null;
}

async function confirmRemoval() {
  const type = pendingRemoval.type;
  const item = pendingRemoval.item;
  if (!type || !item) return;
  const target = states[type];
  if (target.removing) return;

  target.removing = true;
  target.removeError = '';
  target.rollError = '';
  try {
    await props.service.removeItem(type, item);
    target.count = Math.max((target.count || 1) - 1, 0);
    target.latest = target.latest.filter(latestItem => latestItem.id !== item.id);
    target.current = null;
    if (target.previous?.id === item.id) target.previous = null;
    if (type === 'artists') {
      if (target.previousArtistAlbum?.id === item.id) target.previousArtistAlbum = null;
      artistAlbum.current = null;
      artistAlbum.previous = null;
      artistAlbum.error = '';
      artistAlbum.artistId = null;
    }
    if (target.count) await roll(type, false);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      target.removeError = formatError(error, 'Spotify could not update your library right now.');
    }
  } finally {
    target.removing = false;
    pendingRemoval.type = null;
    pendingRemoval.item = null;
  }
}

async function rollArtistAlbum(artist = states.artists.current, animate = true) {
  if (!artist?.id || artistAlbum.rolling) return;
  const artistId = artist.id;
  const sameArtist = artistAlbum.artistId === artistId;
  artistAlbum.rolling = animate;
  artistAlbum.error = '';
  artistAlbum.artistId = artistId;
  try {
    const album = await props.service.getRandomArtistAlbum(artistId);
    if (artistAlbum.artistId !== artistId) return;
    if (sameArtist && artistAlbum.current) artistAlbum.previous = artistAlbum.current;
    else artistAlbum.previous = null;
    artistAlbum.current = album;
    if (!album) artistAlbum.error = `Spotify did not return an album for ${artist.title}.`;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else if (artistAlbum.artistId === artistId) {
      artistAlbum.error = formatError(error, 'Spotify could not pick an album right now.');
    }
  } finally {
    if (artistAlbum.artistId === artistId) artistAlbum.rolling = false;
  }
}

function goBackArtistAlbum() {
  if (!artistAlbum.previous || artistAlbum.rolling) return;
  artistAlbum.current = artistAlbum.previous;
  artistAlbum.previous = null;
  artistAlbum.error = '';
}

function handleError(error, target) {
  if (error instanceof AuthRequiredError) {
    emit('logout');
    return;
  }
  target.error = formatError(error, 'Spotify did not respond. Please try again.');
}

function formatError(error, fallback) {
  const message = error.message || fallback;
  return error.status && !message.includes(String(error.status)) ? `${message} (HTTP ${error.status})` : message;
}

function savedDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
</script>

<template>
  <div class="app-shell">
    <AppHeader :favorite-count="favoriteState.count" show-randomize :randomizing="randomizing" @open-favorites="emit('open-favorites')" @randomize="randomize" @logout="emit('logout')" />

    <nav class="library-tabs" aria-label="Spotify library" role="tablist">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        role="tab"
        :aria-selected="active === category.id"
        :class="{ active: active === category.id }"
        @click="active = category.id"
      >
        <span class="tab-symbol">{{ category.symbol }}</span>
        <span>{{ category.label }}</span>
        <small v-if="categoryCount(category.id) !== null">{{ categoryCount(category.id).toLocaleString() }}</small>
      </button>
    </nav>

    <div v-if="state.loading" class="content-grid" aria-live="polite">
      <section class="feature-card skeleton-card"><div class="skeleton-art" /><div class="skeleton-lines"><i /><i /><i /></div></section>
      <section class="recent-panel"><div class="skeleton-title" /><div v-for="n in 5" :key="n" class="skeleton-row"><i /><span /></div></section>
    </div>

    <div v-else-if="state.error" class="error-panel" role="alert">
      <span>!</span><div><h2>That roll didn't land.</h2><p>{{ state.error }}</p></div>
      <button type="button" class="secondary-button" @click="state.loaded = false; load()">Try again</button>
    </div>

    <!-- Favorites moved to FavoritesView. -->
    <!--
      <div class="favorites-heading">
        <div>
          <p class="feature-kicker">Your personal shelf</p>
          <h1>Favorites</h1>
          <p>Keep the albums, artists, songs, and podcasts you want to find again.</p>
        </div>
        <div class="favorites-heading-actions">
          <button class="icon-button" type="button" aria-label="Refresh favorites" title="Refresh favorites" :disabled="state.loading" @click="loadFavorites(true)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.24L14 10h6V4l-2.35 2.35Z" /></svg>
          </button>
          <span class="favorites-count">{{ state.count }}</span>
        </div>
      </div>
      <div v-if="!state.latest.length" class="favorites-empty">
        <span>★</span>
        <h2>Nothing saved here yet</h2>
        <p>Tap the star on anything Soundice picks to build your shelf.</p>
      </div>
      <div v-else class="favorites-list">
        <article v-for="favorite in state.latest" :key="`${favorite.type}-${favorite.item.id}`" class="favorite-item">
          <MediaArtwork :item="favorite.item" small />
          <div class="favorite-item-copy">
            <span class="favorite-type">{{ favoriteTypeLabel(favorite.type) }}</span>
            <a v-if="favorite.item.url" class="recent-title-link" :href="favorite.item.url" target="_blank" rel="noreferrer"><strong>{{ favorite.item.title }}</strong></a>
            <strong v-else>{{ favorite.item.title }}</strong>
            <span>{{ favorite.item.subtitle || favorite.item.detail }}</span>
          </div>
          <button class="icon-button favorite-toggle favorite-toggle-small active" type="button" :aria-label="`Remove ${favorite.item.title} from favorites`" :title="`Remove ${favorite.item.title} from favorites`" @click="toggleFavorite(favorite.type, favorite.item)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
          </button>
        </article>
      </div>
      <p v-if="favoriteError" class="favorites-error" role="alert">{{ favoriteError }}</p>
    </section>
    -->

    <div v-else-if="state.loaded && !state.count" class="empty-panel">
      <span>{{ meta.symbol }}</span>
      <h2>No {{ meta.label.toLowerCase() }} yet</h2>
      <p>Save something in Spotify, then come back for a surprise.</p>
    </div>

    <div v-else class="content-grid">
      <div class="feature-stack">
        <section class="feature-card">
        <div class="feature-topline">
          <span>Random {{ meta.singular }}</span>
          <button
            v-if="state.previous"
            class="icon-button previous-button"
            type="button"
            aria-label="Undo"
            title="Undo"
            :disabled="state.rolling || state.removing"
            @click="goBack()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z" /></svg>
          </button>
        </div>

        <Transition name="swap" mode="out-in">
          <div v-if="state.current" :key="state.current.id" class="feature-content">
            <MediaArtwork :item="state.current" />
            <div class="feature-details">
              <div class="feature-copy">
                <p class="feature-kicker">Soundice picked</p>
                <h2>{{ state.current.title }}</h2>
                <p class="feature-subtitle">
                  <template v-if="itemType === 'albums' && state.current.artistLinks?.length">
                    <template v-for="(artist, index) in state.current.artistLinks" :key="artist.id || artist.name">
                      <span v-if="index">, </span><a v-if="artist.url" class="artist-link" :href="artist.url" target="_blank" rel="noreferrer">{{ artist.name }}</a><span v-else>{{ artist.name }}</span>
                    </template>
                  </template>
                  <template v-else>{{ state.current.subtitle }}</template>
                </p>
                <p v-if="state.current.detail" class="feature-meta">{{ state.current.detail }}</p>
                <p v-if="state.current.addedAt" class="feature-saved">Saved {{ savedDate(state.current.addedAt) }}</p>
              </div>
              <div class="feature-actions">
                <button class="primary-button roll-button" type="button" :disabled="state.rolling" @click="roll()">
                  <img :class="{ spinning: state.rolling }" class="roll-mark" src="/soundice-mark-inverted.svg" alt="" width="21" height="21" />
                  {{ state.rolling ? 'Rolling…' : 'Roll again' }}
                </button>
                <a v-if="state.current.url" class="spotify-link spotify-action" :href="state.current.url" target="_blank" rel="noreferrer">Open in Spotify ↗</a>
                <div class="feature-secondary-actions">
                  <button v-if="itemType === 'albums'" class="favorite-toggle favorite-toggle-compact" :class="{ active: isFavorite(itemType, state.current) }" type="button" :aria-pressed="isFavorite(itemType, state.current)" @click="toggleFavorite(itemType, state.current)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
                    {{ isFavorite(itemType, state.current) ? 'Favorited' : 'Favorite' }}
                  </button>
                  <button class="remove-button" type="button" :disabled="state.removing || state.rolling" @click="requestRemoval()">
                    {{ state.removing ? 'Removing…' : removeLabels[itemType] }}
                  </button>
                </div>
                <p v-if="state.rollError" class="roll-error" role="status">{{ state.rollError }}</p>
                <p v-if="state.removeError" class="roll-error" role="status">{{ state.removeError }}</p>
                <p v-if="favoriteError" class="roll-error" role="status">{{ favoriteError }}</p>
              </div>
            </div>
          </div>
          <div v-else class="feature-retry">
            <span>↻</span>
            <h2>One more roll?</h2>
            <p>{{ state.rollError || 'Spotify did not return a pick.' }}</p>
            <button class="primary-button roll-button" type="button" :disabled="state.rolling" @click="roll()">
              {{ state.rolling ? 'Trying again…' : 'Try again' }}
            </button>
          </div>
        </Transition>
        </section>

        <section v-if="itemType === 'artists'" class="artist-album-card">
          <div class="feature-topline">
            <span>Random album by {{ state.current?.title }}</span>
            <button
              v-if="artistAlbum.previous"
              class="icon-button previous-button"
              type="button"
              aria-label="Undo"
              title="Undo"
              :disabled="artistAlbum.rolling"
              @click="goBackArtistAlbum()"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8C9.85 8 7.45 8.99 5.6 10.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8Z" /></svg>
            </button>
            <span v-else class="album-symbol">◐</span>
          </div>
          <Transition name="swap" mode="out-in">
            <div v-if="artistAlbum.current" :key="artistAlbum.current.id" class="artist-album-content">
              <MediaArtwork :item="artistAlbum.current" />
              <div class="artist-album-details">
                <p class="feature-kicker">From their catalog</p>
                <h2>{{ artistAlbum.current.title }}</h2>
                <p class="feature-subtitle">
                  <template v-if="artistAlbum.current.artistLinks?.length">
                    <template v-for="(artist, index) in artistAlbum.current.artistLinks" :key="artist.id || artist.name">
                      <span v-if="index">, </span><a v-if="artist.url" class="artist-link" :href="artist.url" target="_blank" rel="noreferrer">{{ artist.name }}</a><span v-else>{{ artist.name }}</span>
                    </template>
                  </template>
                  <template v-else>{{ artistAlbum.current.subtitle }}</template>
                </p>
                <p v-if="artistAlbum.current.detail" class="feature-meta">{{ artistAlbum.current.detail }}</p>
                <button class="secondary-button artist-album-roll" type="button" :disabled="artistAlbum.rolling" @click="rollArtistAlbum()">
                  {{ artistAlbum.rolling ? 'Rolling…' : 'Roll another album' }}
                </button>
                <button class="favorite-toggle" :class="{ active: isFavorite('albums', artistAlbum.current) }" type="button" :aria-pressed="isFavorite('albums', artistAlbum.current)" @click="toggleFavorite('albums', artistAlbum.current)">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
                  {{ isFavorite('albums', artistAlbum.current) ? 'Saved to favorites' : 'Save album to favorites' }}
                </button>
                <a v-if="artistAlbum.current.url" class="spotify-link" :href="artistAlbum.current.url" target="_blank" rel="noreferrer">Open album in Spotify ↗</a>
              </div>
            </div>
            <div v-else class="artist-album-empty">
              <p>{{ artistAlbum.error || 'No album landed for this artist.' }}</p>
              <button class="secondary-button" type="button" :disabled="artistAlbum.rolling" @click="rollArtistAlbum()">
                {{ artistAlbum.rolling ? 'Trying…' : 'Try an album' }}
              </button>
            </div>
          </Transition>
          <p v-if="artistAlbum.error && artistAlbum.current" class="roll-error" role="status">{{ artistAlbum.error }}</p>
        </section>
      </div>

      <section class="recent-panel">
        <div class="panel-heading"><div><p>{{ meta.recent }}</p><h2>Your latest {{ meta.label.toLowerCase() }}</h2></div><span>{{ state.latest.length }}</span></div>
        <div class="recent-list">
          <div v-for="(item, index) in state.latest" :key="`${item.id}-${index}`" class="recent-item">
            <MediaArtwork :item="item" small />
            <div>
              <a v-if="item.url" class="recent-title-link" :href="item.url" target="_blank" rel="noreferrer"><strong>{{ item.title }}</strong></a>
              <strong v-else>{{ item.title }}</strong>
              <span v-if="itemCategory(item) === 'albums' && item.artistLinks?.length">
                <template v-for="(artist, artistIndex) in item.artistLinks" :key="artist.id || artist.name">
                  <span v-if="artistIndex">, </span><a v-if="artist.url" class="artist-link" :href="artist.url" target="_blank" rel="noreferrer">{{ artist.name }}</a><span v-else>{{ artist.name }}</span>
                </template>
              </span>
              <span v-else>{{ item.subtitle || item.detail }}</span>
            </div>
            <button v-if="itemCategory(item) === 'albums'" class="icon-button favorite-toggle favorite-toggle-small" :class="{ active: isFavorite(itemCategory(item), item) }" type="button" :aria-label="`${isFavorite(itemCategory(item), item) ? 'Remove' : 'Save'} ${item.title} album`" @click="toggleFavorite(itemCategory(item), item)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
            </button>
          </div>
        </div>
      </section>
    </div>

    <footer class="app-footer">
      <p><strong>Soundice</strong> picks from your Spotify library. Favorites are saved securely in Cloudflare.</p>
      <p class="footer-account"><span>Connected as</span><strong>{{ profile?.display_name || profile?.id || 'Spotify user' }}</strong></p>
      <div>
        <a class="status-link" href="https://x.com/SpotifyStatus" target="_blank" rel="noreferrer">Spotify Status</a>
        <a class="github-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer" title="View on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg></a>
      </div>
    </footer>

    <Transition name="dialog-fade">
      <div v-if="pendingRemoval.item" class="dialog-backdrop" role="presentation" @click.self="closeRemovalDialog">
        <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-dialog-title">
          <p class="feature-kicker">{{ pendingRemovalLabel }}</p>
          <h2 id="remove-dialog-title">{{ pendingRemoval.item.title }}</h2>
          <p>This will update your Spotify library.</p>
          <div class="dialog-actions">
            <button class="secondary-button" type="button" :disabled="removalState?.removing" @click="closeRemovalDialog">Cancel</button>
            <button class="primary-button confirm-remove-button" type="button" :disabled="removalState?.removing" @click="confirmRemoval">
              {{ removalState?.removing ? 'Removing…' : pendingRemovalLabel }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>
