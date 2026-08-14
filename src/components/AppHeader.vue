<script setup>
import BrandMark from './BrandMark.vue';
import { useAppUpdate } from '../composables/useAppUpdate.js';

defineProps({
  favoriteCount: { type: Number, default: null },
  favoritesActive: Boolean,
  showRandomize: Boolean,
  randomizing: Boolean,
});

defineEmits(['open-favorites', 'open-library', 'logout', 'randomize']);

const { updateAvailable, applyAppUpdate } = useAppUpdate();
</script>

<template>
  <header class="app-header">
    <button
      v-if="favoritesActive"
      class="header-back"
      type="button"
      aria-label="Back to library"
      title="Back to library"
      @click="$emit('open-library')"
    >
      <span class="header-back-symbol" aria-hidden="true">←</span>
      <span>Library</span>
    </button>
    <BrandMark v-else />
    <div class="account-menu">
      <button
        v-if="updateAvailable"
        class="icon-button update-button"
        type="button"
        aria-label="New version — tap to refresh"
        title="New version — tap to refresh"
        @click="applyAppUpdate"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.24L14 10h6V4l-2.35 2.35Z" fill="currentColor" /></svg>
        <span class="update-dot" aria-hidden="true"></span>
      </button>
      <button
        v-if="showRandomize"
        class="icon-button randomize-button"
        :class="{ spinning: randomizing }"
        type="button"
        aria-label="Pick a random album or artist"
        title="Pick a random album or artist"
        :disabled="randomizing"
        @click="$emit('randomize')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.24L14 10h6V4l-2.35 2.35Z" /></svg>
      </button>
      <button v-if="!favoritesActive" class="favorites-shortcut" type="button" @click="$emit('open-favorites')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
        <span>Favorites</span>
        <small v-if="favoriteCount !== null">{{ favoriteCount }}</small>
      </button>
    </div>
  </header>
</template>
