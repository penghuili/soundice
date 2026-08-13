<script setup>
import GeminiMark from './GeminiMark.vue';

defineProps({
  href: { type: String, default: '' },
  label: { type: String, default: '' },
  heading: Boolean,
  compact: Boolean,
});
</script>

<template>
  <a
    v-if="href && label"
    class="ai-lookup-link"
    :class="{ heading, compact }"
    :href="href"
    target="_blank"
    rel="noreferrer"
    :title="`用 Gemini 介绍 ${label}`"
  >
    <strong v-if="compact" class="ai-lookup-text">{{ label }}</strong>
    <span v-else class="ai-lookup-text">{{ label }}</span>
    <GeminiMark :small="compact" />
  </a>
  <strong v-else-if="compact">{{ label }}</strong>
  <span v-else>{{ label }}</span>
</template>
