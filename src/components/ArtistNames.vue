<script setup>
defineProps({
  artists: { type: Array, default: () => [] },
  fallback: { type: String, default: '' },
});
defineEmits(['select']);
</script>

<template>
  <template v-if="artists.length">
    <template v-for="(artist, index) in artists" :key="artist.id || artist.name">
      <span v-if="index">, </span>
      <button type="button" class="artist-link" @click="$emit('select', artist)">{{ artist.name }}</button>
    </template>
  </template>
  <template v-else>{{ fallback }}</template>
</template>
