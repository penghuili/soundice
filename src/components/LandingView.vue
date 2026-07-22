<script setup>
import BrandMark from './BrandMark.vue';

defineProps({ message: { type: String, default: '' } });
defineEmits(['connect']);

const categories = [
  { label: 'Albums', symbol: '◐' },
  { label: 'Artists', symbol: '✦' },
  { label: 'Songs', symbol: '♪' },
  { label: 'Podcasts', symbol: '◉' },
];
</script>

<template>
  <div class="landing-shell">
    <header class="landing-nav">
      <BrandMark />
      <a class="text-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer">Source code</a>
    </header>

    <section class="landing-hero">
      <div class="hero-copy">
        <p class="eyebrow"><span /> Your library, shuffled</p>
        <h1>Rediscover what<br /><em>you already love.</em></h1>
        <p class="hero-lede">
          Soundice picks a surprise from the music and podcasts you saved on Spotify. No algorithms, no endless scrolling—just one good choice.
        </p>

        <button class="primary-button connect-button" type="button" @click="$emit('connect')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.58 14.42a.62.62 0 0 1-.86.2c-2.36-1.44-5.33-1.77-8.82-.97a.63.63 0 0 1-.28-1.22c3.82-.87 7.1-.5 9.76 1.12.3.18.39.57.2.87Zm1.23-2.74a.78.78 0 0 1-1.08.26c-2.7-1.66-6.82-2.14-10.01-1.17a.78.78 0 1 1-.46-1.5c3.65-1.1 8.19-.57 11.29 1.33.37.23.48.71.26 1.08Zm.1-2.85C14.67 8.9 9.33 8.72 6.24 9.65a.94.94 0 0 1-.54-1.79c3.55-1.07 9.45-.85 13.17 1.36a.94.94 0 0 1-.96 1.61Z" /></svg>
          Connect Spotify
          <span class="button-arrow">↗</span>
        </button>
        <p v-if="message" class="auth-message" role="alert">{{ message }}</p>
        <p class="privacy-line">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.98 8.9 7 10 4.02-1.1 7-5.4 7-10V6l-7-3Zm3.3 7.3-3.8 4a1 1 0 0 1-1.43.02l-1.85-1.8 1.06-1.08 1.13 1.1 2.8-2.96 1.09.72Z" /></svg>
          Your library stays between this browser and Spotify.
        </p>
      </div>

      <div class="hero-visual" aria-hidden="true">
        <div class="ambient ambient-one" />
        <div class="ambient ambient-two" />
        <div class="dice-stage">
          <div class="dice-shadow" />
          <div class="dice-face"><i /><i /><i /><i /><i /></div>
        </div>
        <div class="floating-card card-album"><span>◐</span><b>Album</b><small>286 saved</small></div>
        <div class="floating-card card-song"><span>♪</span><b>Song</b><small>1,248 liked</small></div>
        <div class="floating-card card-podcast"><span>◉</span><b>Podcast</b><small>67 episodes</small></div>
      </div>
    </section>

    <section class="category-strip" aria-label="Supported Spotify library types">
      <div v-for="item in categories" :key="item.label" class="category-chip">
        <span>{{ item.symbol }}</span>{{ item.label }}
      </div>
    </section>

    <footer class="landing-footer">
      <span>© {{ new Date().getFullYear() }} Soundice</span>
      <span>Free · Open source · No tracking</span>
    </footer>
  </div>
</template>
