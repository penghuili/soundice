<script setup>
defineProps({
  item: { type: Object, default: null },
  small: Boolean,
});
</script>

<template>
  <div class="artwork" :class="{ small }" :style="!item?.image && item?.imageStyle ? { background: item.imageStyle } : null">
    <img v-if="item?.image" :src="item.image" :alt="`${item.title} cover`" />
    <div v-else class="artwork-fallback" aria-hidden="true">
      <span>◆</span>
    </div>
  </div>
</template>
