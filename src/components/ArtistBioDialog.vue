<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';

import { getArtistIntro } from '../services/artistInfo.js';

const props = defineProps({
  artist: { type: Object, required: true },
});
const emit = defineEmits(['close']);

const loading = ref(true);
const intro = ref(null);
let requestId = 0;

async function load() {
  const id = requestId += 1;
  loading.value = true;
  intro.value = {
    name: props.artist.name,
    image: props.artist.image || null,
    description: '',
    extract: '',
    wikipediaUrl: null,
    spotifyUrl: props.artist.url || null,
  };
  try {
    const next = await getArtistIntro(props.artist);
    if (id === requestId) intro.value = next;
  } catch {
    if (id === requestId) {
      intro.value = {
        ...intro.value,
        extract: '',
      };
    }
  } finally {
    if (id === requestId) loading.value = false;
  }
}

watch(() => `${props.artist.id || ''}:${props.artist.name}`, load, { immediate: true });

function onKeydown(event) {
  if (event.key === 'Escape') emit('close');
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="artist-dialog" role="dialog" aria-modal="true" aria-labelledby="artist-dialog-title">
      <button class="icon-button artist-dialog-close" type="button" aria-label="Close artist introduction" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
      </button>

      <div class="artist-dialog-header">
        <div class="artwork small artist-dialog-art" :style="!intro?.image ? { background: 'linear-gradient(145deg, #31201f, #101116)' } : null">
          <img v-if="intro?.image" :src="intro.image" :alt="`${intro.name} portrait`" />
          <div v-else class="artwork-fallback" aria-hidden="true"><span>✦</span></div>
        </div>
        <div class="artist-dialog-identity">
          <p class="feature-kicker">Artist</p>
          <h2 id="artist-dialog-title">{{ intro?.name || artist.name }}</h2>
          <p v-if="intro?.description" class="feature-meta">{{ intro.description }}</p>
        </div>
      </div>

      <div class="artist-dialog-body" aria-live="polite">
        <p v-if="loading" class="artist-dialog-status">Looking up this artist…</p>
        <p v-else-if="intro?.extract" class="artist-dialog-extract">{{ intro.extract }}</p>
        <p v-else class="artist-dialog-status">Soundice could not find an introduction for this artist.</p>
      </div>

      <p v-if="intro?.wikipediaUrl" class="artist-dialog-source">Introduction from Wikipedia</p>

      <div class="artist-dialog-actions">
        <a v-if="intro?.wikipediaUrl" class="secondary-button" :href="intro.wikipediaUrl" target="_blank" rel="noreferrer">Read on Wikipedia ↗</a>
        <a v-if="intro?.spotifyUrl" class="spotify-link spotify-action artist-dialog-spotify" :href="intro.spotifyUrl" target="_blank" rel="noreferrer">Open in Spotify ↗</a>
      </div>
    </section>
  </div>
</template>
