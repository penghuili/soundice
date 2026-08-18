<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

import { AuthRequiredError } from '../services/auth.js';
import { albumAiModeUrl } from '../services/artistInfo.js';
import AiLookupLink from './AiLookupLink.vue';
import AppHeader from './AppHeader.vue';
import ArtistNames from './ArtistNames.vue';
import MediaArtwork from './MediaArtwork.vue';

const PAGE_SIZE = 20;

const props = defineProps({
  profile: { type: Object, default: null },
  service: { type: Object, required: true },
  favorites: { type: Object, required: true },
});
const emit = defineEmits(['logout', 'open-library']);

const types = {
  albums: 'album',
};
const state = reactive({
  items: [],
  total: 0,
  loading: false,
  loadingMore: false,
  loaded: false,
  hasMore: false,
  error: '',
});
const rollState = reactive({ current: null, previous: null, rolling: false });
const search = reactive({
  query: '',
  results: [],
  loading: false,
  searched: false,
  error: '',
});
const favoriteError = ref('');
const knownIds = reactive({});
const listEl = ref(null);
const sentinelEl = ref(null);
let observer = null;
let searchTimer = null;
let searchSeq = 0;
let loadMorePromise = null;

onMounted(() => loadFavorites());
onBeforeUnmount(() => {
  observer?.disconnect();
  clearTimeout(searchTimer);
});

watch([listEl, sentinelEl], () => {
  nextTick(updateObserver);
});

watch(() => search.query, value => {
  clearTimeout(searchTimer);
  const query = value.trim();
  if (!query) {
    search.results = [];
    search.error = '';
    search.searched = false;
    search.loading = false;
    nextTick(updateObserver);
    return;
  }
  searchTimer = setTimeout(() => runSearch(query), 300);
});

function rememberId(id, saved = true) {
  if (!id) return;
  if (saved) knownIds[id] = true;
  else delete knownIds[id];
}

function isKnownFavorite(id) {
  return Boolean(id && knownIds[id]);
}

async function loadFavorites() {
  if (state.loading) return;
  state.loading = true;
  state.error = '';
  favoriteError.value = '';
  try {
    const page = await props.favorites.list({ limit: PAGE_SIZE, offset: 0 });
    state.items = page.favorites;
    state.total = page.total;
    state.hasMore = state.items.length < state.total;
    state.loaded = true;
    Object.keys(knownIds).forEach(id => delete knownIds[id]);
    state.items.forEach(favorite => rememberId(favorite.item?.id));
    if (state.total) await roll(false);
    else {
      rollState.current = null;
      rollState.previous = null;
    }
    await nextTick();
    updateObserver();
  } catch (error) {
    if (error instanceof AuthRequiredError) emit('logout');
    state.error = formatError(error, 'Soundice could not load your favorites.');
    favoriteError.value = state.error;
  } finally {
    state.loading = false;
  }
}

async function loadMore() {
  if (!state.loaded || state.loadingMore || !state.hasMore || search.query.trim() || loadMorePromise) return;
  state.loadingMore = true;
  loadMorePromise = (async () => {
    try {
      const page = await props.favorites.list({ limit: PAGE_SIZE, offset: state.items.length });
      const incoming = page.favorites.filter(favorite => !state.items.some(existing => sameFavorite(existing, favorite)));
      incoming.forEach(favorite => rememberId(favorite.item?.id));
      state.items = [...state.items, ...incoming];
      state.total = page.total;
      state.hasMore = state.items.length < state.total;
    } catch (error) {
      if (error instanceof AuthRequiredError) emit('logout');
      else favoriteError.value = formatError(error, 'Could not load more favorites.');
    } finally {
      state.loadingMore = false;
      loadMorePromise = null;
    }
  })();
  return loadMorePromise;
}

function updateObserver() {
  observer?.disconnect();
  observer = null;
  if (!listEl.value || !sentinelEl.value || search.query.trim()) return;
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) loadMore();
  }, { root: listEl.value, rootMargin: '160px' });
  observer.observe(sentinelEl.value);
}

async function runSearch(query) {
  const seq = ++searchSeq;
  search.loading = true;
  search.error = '';
  try {
    const results = await props.service.searchAlbums(query);
    if (seq !== searchSeq) return;
    search.results = results;
    search.searched = true;
    if (props.favorites.existingIds) {
      const ids = await props.favorites.existingIds(results.map(item => item.id));
      if (seq !== searchSeq) return;
      ids.forEach(id => rememberId(id));
    }
  } catch (error) {
    if (seq !== searchSeq) return;
    if (error instanceof AuthRequiredError) emit('logout');
    search.error = formatError(error, 'Spotify could not search albums right now.');
    search.results = [];
    search.searched = true;
  } finally {
    if (seq === searchSeq) search.loading = false;
  }
}

function favoriteKey(favorite) {
  return favorite ? `${favorite.type}:${favorite.item?.id}` : '';
}

function sameFavorite(a, b) {
  return Boolean(a && b && a.type === b.type && a.item?.id === b.item?.id);
}

async function pickRandomFavorite(except) {
  if (!state.total) return null;
  if (state.total <= state.items.length && state.items.length) {
    const pool = except && state.items.length > 1
      ? state.items.filter(item => !sameFavorite(item, except))
      : state.items;
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const page = await props.favorites.list({ limit: 1, offset: Math.floor(Math.random() * state.total) });
    const candidate = page.favorites[0];
    if (!candidate) break;
    if (!except || !sameFavorite(candidate, except) || state.total === 1) return candidate;
  }
  return state.items.find(item => !sameFavorite(item, except)) || state.items[0] || null;
}

async function roll(animate = true) {
  if (!state.total || rollState.rolling) return;
  rollState.rolling = animate;
  try {
    if (animate) await new Promise(resolve => setTimeout(resolve, 280));
    const next = await pickRandomFavorite(rollState.current);
    if (!next) return;
    if (rollState.current) rollState.previous = rollState.current;
    rollState.current = next;
  } catch (error) {
    if (error instanceof AuthRequiredError) emit('logout');
    else favoriteError.value = formatError(error, 'Could not pick a favorite.');
  } finally {
    rollState.rolling = false;
  }
}

function goBack() {
  if (!rollState.previous || rollState.rolling) return;
  rollState.current = rollState.previous;
  rollState.previous = null;
}

async function addFavorite(item) {
  if (!item?.id) return;
  favoriteError.value = '';
  const existed = isKnownFavorite(item.id);
  try {
    const favorite = await props.favorites.add('albums', item);
    rememberId(item.id);
    state.items = [favorite, ...state.items.filter(existing => !sameFavorite(existing, favorite))];
    if (!existed) state.total += 1;
    state.hasMore = state.items.length < state.total;
    if (!rollState.current) await roll(false);
  } catch (error) {
    if (error instanceof AuthRequiredError) emit('logout');
    else favoriteError.value = formatError(error, 'Could not update favorites.');
  }
}

async function removeFavorite(favorite) {
  if (!favorite?.item?.id) return;
  favoriteError.value = '';
  try {
    await props.favorites.remove(favorite.type, favorite.item.id);
    const existed = isKnownFavorite(favorite.item.id);
    rememberId(favorite.item.id, false);
    state.items = state.items.filter(item => !sameFavorite(item, favorite));
    if (existed && state.total > 0) state.total -= 1;
    state.hasMore = state.items.length < state.total;
    if (sameFavorite(rollState.previous, favorite)) rollState.previous = null;
    if (sameFavorite(rollState.current, favorite)) {
      rollState.current = null;
      if (state.total) await roll(false);
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      favoriteError.value = formatError(error, 'Could not update favorites.');
    }
  }
}

async function toggleSearchFavorite(item) {
  if (isKnownFavorite(item.id)) {
    await removeFavorite({ type: 'albums', item });
    return;
  }
  await addFavorite(item);
}

function formatError(error, fallback) {
  const message = error.message || fallback;
  return error.status && !message.includes(String(error.status)) ? `${message} (HTTP ${error.status})` : message;
}
</script>

<template>
  <div class="app-shell">
    <AppHeader
      favorites-active
      @open-library="$emit('open-library')"
      @logout="$emit('logout')"
    />

    <section class="favorites-page">
      <div v-if="state.loading && !state.loaded" class="favorites-empty" aria-live="polite">
        <span>↻</span>
        <h2>Loading your shelf</h2>
        <p>Soundice is fetching your saved items.</p>
      </div>
      <div v-else-if="state.error && !state.loaded" class="favorites-empty" role="alert">
        <span>!</span>
        <h2>Favorites could not load</h2>
        <p>{{ state.error }}</p>
        <button class="secondary-button" type="button" @click="loadFavorites()">Try again</button>
      </div>
      <div v-else class="favorites-body">
        <section class="feature-card favorites-random-card">
          <template v-if="state.total">
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
                  <h2>
                    <AiLookupLink heading :href="albumAiModeUrl(rollState.current.item.title, rollState.current.item.artistLinks)" :label="rollState.current.item.title" />
                  </h2>
                  <p class="feature-subtitle">
                    <ArtistNames
                      v-if="rollState.current.item.artistLinks?.length"
                      :artists="rollState.current.item.artistLinks"
                      :fallback="rollState.current.item.subtitle"
                    />
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
          </template>
          <div v-else class="feature-retry">
            <span>★</span>
            <h2>Nothing saved here yet</h2>
            <p>Search an album on the right and star it to start your shelf.</p>
          </div>
        </section>

        <section class="favorites-list-panel">
          <div class="panel-heading">
            <div>
              <p>Your shelf</p>
              <h2>{{ search.query.trim() ? 'Add album' : 'All favorites' }}</h2>
            </div>
            <span>{{ state.total }}</span>
          </div>
          <div class="favorites-search">
            <input
              v-model="search.query"
              type="search"
              placeholder="Search albums to add"
              autocomplete="off"
              spellcheck="false"
              aria-label="Search albums to add"
            />
          </div>
          <div ref="listEl" class="favorites-list-scroll">
            <template v-if="search.query.trim()">
              <div v-if="search.loading" class="favorites-list-status" aria-live="polite">Searching albums…</div>
              <div v-else-if="search.error" class="favorites-list-status" role="alert">{{ search.error }}</div>
              <div v-else-if="search.searched && !search.results.length" class="favorites-list-status">No albums matched that search.</div>
              <div v-else class="favorites-list">
                <article v-for="item in search.results" :key="item.id" class="favorite-item">
                  <MediaArtwork :item="item" small />
                  <div class="favorite-item-copy">
                    <span class="favorite-type">album</span>
                    <div class="recent-title-row">
                      <a v-if="item.url" class="recent-title-link" :href="item.url" target="_blank" rel="noreferrer" :aria-label="`Open ${item.title} on Spotify`" :title="`Open ${item.title} on Spotify`"><strong>{{ item.title }}</strong> ↗</a>
                      <strong v-else>{{ item.title }}</strong>
                      <AiLookupLink compact icon-only :href="albumAiModeUrl(item.title, item.artistLinks)" :label="item.title" />
                    </div>
                    <span class="recent-artist-line">{{ item.subtitle || item.detail }}</span>
                  </div>
                  <button
                    class="icon-button favorite-toggle favorite-toggle-small"
                    :class="{ active: isKnownFavorite(item.id) }"
                    type="button"
                    :aria-label="`${isKnownFavorite(item.id) ? 'Remove' : 'Save'} ${item.title} album`"
                    :title="`${isKnownFavorite(item.id) ? 'Remove' : 'Save'} ${item.title}`"
                    :aria-pressed="isKnownFavorite(item.id)"
                    @click="toggleSearchFavorite(item)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
                  </button>
                </article>
              </div>
            </template>
            <template v-else>
              <div v-if="!state.items.length" class="favorites-list-status">Star an album to keep it on this shelf.</div>
              <div v-else class="favorites-list">
                <article v-for="favorite in state.items" :key="favoriteKey(favorite)" class="favorite-item">
                  <MediaArtwork :item="favorite.item" small />
                  <div class="favorite-item-copy">
                    <span class="favorite-type">{{ types[favorite.type] || favorite.type }}</span>
                    <div class="recent-title-row">
                      <a v-if="favorite.item.url" class="recent-title-link" :href="favorite.item.url" target="_blank" rel="noreferrer" :aria-label="`Open ${favorite.item.title} on Spotify`" :title="`Open ${favorite.item.title} on Spotify`"><strong>{{ favorite.item.title }}</strong> ↗</a>
                      <strong v-else>{{ favorite.item.title }}</strong>
                      <AiLookupLink compact icon-only :href="albumAiModeUrl(favorite.item.title, favorite.item.artistLinks)" :label="favorite.item.title" />
                    </div>
                    <span class="recent-artist-line">{{ favorite.item.subtitle || favorite.item.detail }}</span>
                  </div>
                  <button class="icon-button favorite-toggle favorite-toggle-small active" type="button" :aria-label="`Remove ${favorite.item.title} from favorites`" :title="`Remove ${favorite.item.title} from favorites`" @click="removeFavorite(favorite)">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
                  </button>
                </article>
              </div>
              <div v-if="state.loadingMore" class="favorites-list-status" aria-live="polite">Loading more…</div>
              <div v-else-if="state.hasMore" ref="sentinelEl" class="favorites-scroll-sentinel" aria-hidden="true"></div>
            </template>
          </div>
        </section>
      </div>
      <p v-if="favoriteError" class="favorites-error" role="alert">{{ favoriteError }}</p>
    </section>

    <footer class="app-footer">
      <a class="status-link" href="https://x.com/SpotifyStatus" target="_blank" rel="noreferrer">Spotify Status</a>
      <a class="github-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer" title="View on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg></a>
      <button class="icon-button footer-logout" type="button" aria-label="Log out" title="Log out" @click="emit('logout')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5v2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5v2Zm5.59 2.59L20 12l-4.41 4.41L14.17 15l2-2H8v-2h8.17l-2-2 1.42-1.41Z" /></svg>
      </button>
    </footer>
  </div>
</template>
