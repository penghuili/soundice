import { createApp } from 'vue';

import App from './App.vue';
import './styles.css';

// Allow a later deployment to recover if this page's timestamped asset was removed.
try {
  window.setTimeout(() => sessionStorage.removeItem('soundice:asset-reload'), 30_000);
} catch {
  // Ignore storage restrictions; the inline recovery listener still prevents loops.
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createApp(App).mount('#app');
