<script setup>
import BrandMark from './BrandMark.vue';

defineProps({
  profile: { type: Object, default: null },
  favoriteCount: { type: Number, default: null },
  favoritesActive: Boolean,
  showRandomize: Boolean,
  randomizing: Boolean,
});

defineEmits(['open-favorites', 'logout', 'randomize']);
</script>

<template>
  <header class="app-header">
    <BrandMark />
    <div class="account-menu">
      <div class="account-copy"><small>Connected as</small><strong>{{ profile?.display_name || profile?.id || 'Spotify user' }}</strong></div>
      <button
        v-if="showRandomize"
        class="icon-button randomize-button"
        :class="{ spinning: randomizing }"
        type="button"
        aria-label="Pick a random tab and item"
        title="Pick a random tab and item"
        :disabled="randomizing"
        @click="$emit('randomize')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08a6 6 0 1 1-1.41-6.24L14 10h6V4l-2.35 2.35Z" /></svg>
      </button>
      <button class="favorites-shortcut" type="button" :class="{ active: favoritesActive }" :aria-current="favoritesActive ? 'page' : undefined" @click="$emit('open-favorites')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 17.27-5.18 3.13 1.64-5.89L3.82 10.5l6.09-.25L12 4.5l2.09 5.75 6.09.25-1.64 5.89L12 17.27Z" /></svg>
        <span>Favorites</span>
        <small v-if="favoriteCount !== null">{{ favoriteCount }}</small>
      </button>
      <button class="icon-button" type="button" aria-label="Log out" title="Log out" @click="$emit('logout')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5v2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5v2Zm5.59 2.59L20 12l-4.41 4.41L14.17 15l2-2H8v-2h8.17l-2-2 1.42-1.41Z" /></svg>
      </button>
    </div>
  </header>
</template>
