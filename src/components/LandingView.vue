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
      <a class="github-link" href="https://github.com/penghuili/soundice" target="_blank" rel="noreferrer" title="View on GitHub">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
      </a>
    </footer>
  </div>
</template>
