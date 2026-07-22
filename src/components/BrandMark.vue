<script setup>
defineProps({ compact: Boolean });
</script>

<template>
  <a class="brand" href="/" aria-label="Soundice home">
    <span class="brand-logo" aria-hidden="true"><i /><i /><i /><i /></span>
    <span v-if="!compact">Soundice</span>
  </a>
</template>
