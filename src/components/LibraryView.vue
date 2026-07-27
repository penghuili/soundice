<script setup>
import { computed, reactive, ref, watch } from 'vue';

import { AuthRequiredError } from '../services/auth.js';
import BrandMark from './BrandMark.vue';
import MediaArtwork from './MediaArtwork.vue';

const props = defineProps({
  profile: { type: Object, default: null },
  service: { type: Object, required: true },
});
const emit = defineEmits(['logout']);

const categories = [
  { id: 'albums', label: 'Albums', singular: 'album', symbol: '◐', recent: 'Recently saved' },
  { id: 'artists', label: 'Artists', singular: 'artist', symbol: '✦', recent: 'Recently followed' },
  { id: 'songs', label: 'Songs', singular: 'song', symbol: '♪', recent: 'Recently liked' },
  { id: 'podcasts', label: 'Podcasts', singular: 'episode', symbol: '◉', recent: 'Recently saved' },
];
const removeLabels = {
  albums: 'Remove album',
  artists: 'Unfollow artist',
  songs: 'Remove song',
  podcasts: 'Remove episode',
};

const requestedTab = new URLSearchParams(window.location.search).get('tab');
const active = ref(categories.some(category => category.id === requestedTab) ? requestedTab : 'albums');
const artistAlbum = reactive({ current: null, rolling: false, error: '', artistId: null });
const pendingRemoval = reactive({ type: null, item: null });
const states = reactive(
  Object.fromEntries(
    categories.map(category => [
      category.id,
      {
        count: null,
        latest: [],
        current: null,
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

const meta = computed(() => categories.find(category => category.id === active.value));
const state = computed(() => states[active.value]);
const displayName = computed(() => props.profile?.display_name || props.profile?.id || 'Spotify user');
const pendingRemovalLabel = computed(() => pendingRemoval.type ? removeLabels[pendingRemoval.type] : '');

watch(active, type => {
  const url = new URL(window.location.href);
  url.searchParams.set('tab', type);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  load();
}, { immediate: true });

async function load() {
  const type = active.value;
  const target = states[type];
  if (target.loaded || target.loading) return;
  target.loading = true;
  target.error = '';
  target.rollError = '';
  try {
    const data = await props.service.loadCategory(type);
    target.count = data.count;
    target.latest = data.latest;
    target.loaded = true;
    target.removeError = '';
    if (data.count) await roll(type, false);
  } catch (error) {
    handleError(error, target);
  } finally {
    target.loading = false;
  }
}

async function roll(type = active.value, animate = true) {
  const target = states[type];
  if (!target.count || target.rolling) return;
  target.rolling = animate;
  target.rollError = '';
  target.removeError = '';
  try {
    target.current = await props.service.getRandomItem(type, target.count);
    if (type === 'artists' && target.current) await rollArtistAlbum(target.current, animate);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else {
      target.rollError = error.message || 'Spotify could not pick something right now.';
    }
  } finally {
    target.rolling = false;
  }
}

function requestRemoval(type = active.value) {
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
    if (type === 'artists') {
      artistAlbum.current = null;
      artistAlbum.error = '';
      artistAlbum.artistId = null;
    }
    if (target.count) await roll(type, false);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else if (error.status === 403) {
      target.removeError = 'Reconnect Spotify to allow library changes.';
    } else {
      target.removeError = error.message || 'Spotify could not update your library right now.';
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
  artistAlbum.rolling = animate;
  artistAlbum.error = '';
  artistAlbum.artistId = artistId;
  try {
    const album = await props.service.getRandomArtistAlbum(artistId);
    if (artistAlbum.artistId === artistId) artistAlbum.current = album;
    if (!album) artistAlbum.error = `Spotify did not return an album for ${artist.title}.`;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      emit('logout');
    } else if (artistAlbum.artistId === artistId) {
      artistAlbum.error = error.message || 'Spotify could not pick an album right now.';
    }
  } finally {
    if (artistAlbum.artistId === artistId) artistAlbum.rolling = false;
  }
}

function handleError(error, target) {
  if (error instanceof AuthRequiredError) {
    emit('logout');
    return;
  }
  target.error = error.message || 'Spotify did not respond. Please try again.';
}

function savedDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <BrandMark />
      <div class="account-menu">
        <div class="account-copy"><small>Connected as</small><strong>{{ displayName }}</strong></div>
        <button class="icon-button" type="button" aria-label="Log out" title="Log out" @click="$emit('logout')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5v2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5v2Zm5.59 2.59L20 12l-4.41 4.41L14.17 15l2-2H8v-2h8.17l-2-2 1.42-1.41Z" /></svg>
        </button>
      </div>
    </header>

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
        <small v-if="states[category.id].count !== null">{{ states[category.id].count.toLocaleString() }}</small>
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
          <span class="library-count">1 of {{ state.count?.toLocaleString() }}</span>
        </div>

        <Transition name="swap" mode="out-in">
          <div v-if="state.current" :key="state.current.id" class="feature-content">
            <MediaArtwork :item="state.current" />
            <div class="feature-details">
              <p class="feature-kicker">Soundice picked</p>
              <h2>{{ state.current.title }}</h2>
              <p class="feature-subtitle">{{ state.current.subtitle }}</p>
              <p v-if="state.current.detail" class="feature-meta">{{ state.current.detail }}</p>
              <p v-if="state.current.addedAt" class="feature-saved">Saved {{ savedDate(state.current.addedAt) }}</p>
              <div class="feature-actions">
                <button class="primary-button roll-button" type="button" :disabled="state.rolling" @click="roll()">
                  <img :class="{ spinning: state.rolling }" class="roll-mark" src="/soundice-mark-inverted.svg" alt="" width="21" height="21" />
                  {{ state.rolling ? 'Rolling…' : 'Roll again' }}
                </button>
                <button class="secondary-button remove-button" type="button" :disabled="state.removing || state.rolling" @click="requestRemoval()">
                  {{ state.removing ? 'Removing…' : removeLabels[active] }}
                </button>
                <a v-if="state.current.url" class="spotify-link" :href="state.current.url" target="_blank" rel="noreferrer">Open in Spotify ↗</a>
              </div>
              <p v-if="state.rollError" class="roll-error" role="status">{{ state.rollError }}</p>
              <p v-if="state.removeError" class="roll-error" role="status">{{ state.removeError }}</p>
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

        <section v-if="active === 'artists'" class="artist-album-card">
          <div class="feature-topline">
            <span>Random album by {{ state.current?.title }}</span>
            <span class="album-symbol">◐</span>
          </div>
          <Transition name="swap" mode="out-in">
            <div v-if="artistAlbum.current" :key="artistAlbum.current.id" class="artist-album-content">
              <MediaArtwork :item="artistAlbum.current" />
              <div class="artist-album-details">
                <p class="feature-kicker">From their catalog</p>
                <h2>{{ artistAlbum.current.title }}</h2>
                <p class="feature-subtitle">{{ artistAlbum.current.subtitle }}</p>
                <p v-if="artistAlbum.current.detail" class="feature-meta">{{ artistAlbum.current.detail }}</p>
                <button class="secondary-button artist-album-roll" type="button" :disabled="artistAlbum.rolling" @click="rollArtistAlbum()">
                  {{ artistAlbum.rolling ? 'Rolling…' : 'Roll another album' }}
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
          <a v-for="(item, index) in state.latest" :key="`${item.id}-${index}`" :href="item.url || undefined" target="_blank" rel="noreferrer" class="recent-item">
            <MediaArtwork :item="item" small />
            <div><strong>{{ item.title }}</strong><span>{{ item.subtitle || item.detail }}</span></div>
            <span class="recent-arrow">↗</span>
          </a>
        </div>
      </section>
    </div>

    <footer class="app-footer">
      <p><strong>Soundice</strong> picks from your Spotify library. Nothing is stored on our servers.</p>
      <a class="github-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer" title="View on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg></a>
    </footer>

    <Transition name="dialog-fade">
      <div v-if="pendingRemoval.item" class="dialog-backdrop" role="presentation" @click.self="closeRemovalDialog">
        <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-dialog-title">
          <p class="feature-kicker">{{ pendingRemovalLabel }}</p>
          <h2 id="remove-dialog-title">{{ pendingRemoval.item.title }}</h2>
          <p>This will update your Spotify library.</p>
          <div class="dialog-actions">
            <button class="secondary-button" type="button" :disabled="states[pendingRemoval.type]?.removing" @click="closeRemovalDialog">Cancel</button>
            <button class="primary-button confirm-remove-button" type="button" :disabled="states[pendingRemoval.type]?.removing" @click="confirmRemoval">
              {{ states[pendingRemoval.type]?.removing ? 'Removing…' : pendingRemovalLabel }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </div>
</template>

