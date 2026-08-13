<script setup>
import { useId } from 'vue';

defineProps({
  small: Boolean,
});

const gid = `gm${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
</script>

<template>
  <svg class="gemini-mark" :class="{ small }" viewBox="0 0 28 28" aria-hidden="true">
    <defs>
      <linearGradient :id="gid" x1="4" y1="3" x2="24" y2="25" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#6FA8FF" />
        <stop offset="48%" stop-color="#8B6CFF" />
        <stop offset="100%" stop-color="#E07A8A" />
      </linearGradient>
    </defs>
    <path :fill="`url(#${gid})`" d="M14 2.4c.4 4.5 2.6 8.2 6.8 10.4-4.2 2.2-6.4 5.9-6.8 10.4-.4-4.5-2.6-8.2-6.8-10.4C11.4 10.6 13.6 6.9 14 2.4Z" />
    <path :fill="`url(#${gid})`" d="M22.7 16.4c.18 1.85 1.05 3.4 2.7 4.3-1.65.9-2.52 2.45-2.7 4.3-.18-1.85-1.05-3.4-2.7-4.3 1.65-.9 2.52-2.45 2.7-4.3Z" />
  </svg>
</template>
