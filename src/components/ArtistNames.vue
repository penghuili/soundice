<script setup>
import { artistAiModeUrl } from '../services/artistInfo.js';
import AiLookupLink from './AiLookupLink.vue';

defineProps({
  artists: { type: Array, default: () => [] },
  fallback: { type: String, default: '' },
});
</script>

<template>
  <template v-if="artists.length">
    <template v-for="(artist, index) in artists" :key="artist.id || artist.name">
      <span v-if="index">, </span>
      <span class="artist-name-with-link">
        <AiLookupLink :href="artistAiModeUrl(artist.name)" :label="artist.name" />
        <a
          v-if="artist.url"
          class="artist-spotify-link"
          :href="artist.url"
          target="_blank"
          rel="noreferrer"
          :aria-label="`Open ${artist.name} on Spotify`"
          :title="`Open ${artist.name} on Spotify`"
        >
          Spotify ↗
        </a>
      </span>
    </template>
  </template>
  <template v-else>{{ fallback }}</template>
</template>
