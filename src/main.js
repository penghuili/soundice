import { createApp } from 'vue';

import App from './App.vue';
import './styles.css';

const refreshUrl = new URL(window.location.href);
if (refreshUrl.searchParams.has('_asset_refresh')) {
  refreshUrl.searchParams.delete('_asset_refresh');
  window.history.replaceState({}, '', `${refreshUrl.pathname}${refreshUrl.search}${refreshUrl.hash}`);
}

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
