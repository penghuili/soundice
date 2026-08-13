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
      <AiLookupLink :href="artistAiModeUrl(artist.name)" :label="artist.name" />
    </template>
  </template>
  <template v-else>{{ fallback }}</template>
</template>
