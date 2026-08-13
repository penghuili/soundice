<script setup>
import { artistAiModeUrl } from '../services/artistInfo.js';

defineProps({
  artists: { type: Array, default: () => [] },
  fallback: { type: String, default: '' },
});
</script>

<template>
  <template v-if="artists.length">
    <template v-for="(artist, index) in artists" :key="artist.id || artist.name">
      <span v-if="index">, </span>
      <a
        v-if="artistAiModeUrl(artist.name)"
        class="artist-link"
        :href="artistAiModeUrl(artist.name)"
        target="_blank"
        rel="noreferrer"
        :title="`Look up ${artist.name} in Google AI Mode`"
      >{{ artist.name }}</a>
      <span v-else>{{ artist.name }}</span>
    </template>
  </template>
  <template v-else>{{ fallback }}</template>
</template>
