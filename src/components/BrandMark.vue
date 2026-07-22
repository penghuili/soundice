<script setup>
defineProps({ compact: Boolean });
</script>

<template>
  <a class="brand" href="/" aria-label="Soundice home">
    <img class="brand-logo" src="/soundice-mark.svg" alt="" width="32" height="32" />
    <span v-if="!compact">Soundice</span>
  </a>
</template>
