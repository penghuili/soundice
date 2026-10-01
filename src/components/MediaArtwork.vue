<script setup>
defineProps({
  item: { type: Object, default: null },
  small: Boolean,
});
</script>

<template>
  <component
    :is="item?.url ? 'a' : 'div'"
    class="artwork"
    :class="{ small }"
    :style="!item?.image && item?.imageStyle ? { background: item.imageStyle } : null"
    v-bind="item?.url ? {
      href: item.url,
      target: '_blank',
      rel: 'noreferrer',
      'aria-label': `在 Spotify 中打开 ${item.title}`,
      title: `在 Spotify 中打开 ${item.title}`,
    } : {}"
  >
    <img v-if="item?.image" :src="item.image" :alt="`${item.title} 封面`" />
    <div v-else class="artwork-fallback" aria-hidden="true">
      <span>◆</span>
    </div>
  </component>
</template>
