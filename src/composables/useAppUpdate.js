import { readonly, ref } from 'vue';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const CURRENT_BUILD = String(import.meta.env.VITE_VERSION || 'dev');

const updateAvailable = ref(false);
const latestBuild = ref(null);
let watching = false;

function isNewerBuild(liveBuild) {
  if (!liveBuild || liveBuild === CURRENT_BUILD) return false;
  if (CURRENT_BUILD === 'dev') return true;
  // Soundice versions are timestamp strings like 2608100736 — lexicographic order works.
  const live = Number(liveBuild);
  const current = Number(CURRENT_BUILD);
  if (Number.isFinite(live) && Number.isFinite(current)) return live > current;
  return String(liveBuild) > String(CURRENT_BUILD);
}

async function checkRemoteBuild() {
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    const payload = await response.json();
    const liveBuild =
      payload?.version != null
        ? String(payload.version)
        : payload?.build != null
          ? String(payload.build)
          : null;
    if (!isNewerBuild(liveBuild)) return;
    latestBuild.value = liveBuild;
    updateAvailable.value = true;
  } catch {
    // Offline or blocked — ignore quietly.
  }
}

function watchServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready
    .then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        updateAvailable.value = true;
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            updateAvailable.value = true;
          }
        });
      });

      registration.update().catch(() => {});
    })
    .catch(() => {});
}

function startWatching() {
  if (watching || typeof window === 'undefined') return;
  watching = true;

  const runCheck = () => {
    checkRemoteBuild();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update().catch(() => {}))
        .catch(() => {});
    }
  };

  runCheck();
  watchServiceWorker();
  window.setInterval(runCheck, CHECK_INTERVAL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runCheck();
  });
  window.addEventListener('focus', runCheck);
  window.addEventListener('online', runCheck);
}

export function applyAppUpdate() {
  window.location.reload();
}

export function useAppUpdate() {
  startWatching();
  return {
    updateAvailable: readonly(updateAvailable),
    latestBuild: readonly(latestBuild),
    currentBuild: CURRENT_BUILD,
    applyAppUpdate,
  };
}
