# Soundice

Soundice picks a random album, artist, song, or podcast episode from your Spotify library.

It is a Vue 3 + Vite app with a Cloudflare Pages Function and D1 database for favorites, installable as a PWA on supported mobile and desktop browsers. Sign-in uses Spotify Authorization Code with PKCE; Soundice does not use Cloudflare email or password login.

Spotify access and refresh tokens stay in the browser, and Spotify library data is fetched directly from Spotify. When a user saves a favorite, Soundice sends the short-lived Spotify access token and displayed item metadata to `/api/favorites`; the Pages Function verifies the token with Spotify's `/v1/me` endpoint, derives the user's canonical account identity, and stores only the favorite in Cloudflare D1. The app never needs a Spotify client secret in the browser, and Cloudflare never stores the access token.

## Deploy it with your AI

The fastest way to run your own Soundice is to clone the repo and hand it to your AI coding agent (Codex, Claude Code, Cursor, etc.) with your hosting provider's CLI or credentials available.

```bash
git clone https://github.com/penghuili/soundice.git
cd soundice
```

Then paste this prompt, replacing the bracketed values:

> Deploy this Vue/Vite app to [provider, e.g. Vercel / Netlify / Cloudflare Pages / S3 + CloudFront / a VPS].
>
> Build with `npm run build` and publish the `dist` directory. Use a current Node.js LTS release.
>
> Set these build-time environment variables:
> - `VITE_SPOTIFY_CLIENT_ID` = [your Spotify app client ID]
> - `VITE_REDIRECT_URL` = [the site's public HTTPS origin, e.g. https://soundice.example.com]
>
> Rules:
> - Never commit hosting credentials, AWS keys, or a Spotify client secret. Never put a secret in any `VITE_` variable.
> - The app must be served over HTTPS and from the root of a domain. If the host can only serve it under a URL path (e.g. `user.github.io/soundice/`), adapt the Vite `base` and the service-worker/icon paths in `public/sw.js` and `public/manifest.json` accordingly, or use a custom domain at the root instead.
> - `public/sw.js`, `manifest.json`, and icon files must be served with no-cache headers; fingerprinted build assets can be cached immutably.
>
> When done, report the final HTTPS URL so I can add it as a redirect URI in the Spotify Developer Dashboard.

After the agent reports the public URL, add that exact URL (scheme, host, and path must match `VITE_REDIRECT_URL`) to **Redirect URIs** in your Spotify app's settings. If the URL changed after a first deploy, redeploy once with the final URL.

## Create your Spotify app

Every deployment needs its own Spotify app; this only takes a few minutes and is done in the browser, not by the AI agent.

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), sign in, and select **Create app**.
2. Enter an app name and description. For the redirect URI, add `http://127.0.0.1:3003` for local development, and your deployed HTTPS URL for production.
3. In **APIs used**, select **Web API**, then create the app.
4. Open **Settings** and copy the **Client ID**. Soundice uses PKCE; ignore the client secret and never share it.
5. Redirect URIs must match exactly, including scheme, host, port, path, and trailing slash.
6. New apps start in **Development Mode**: the app owner must have Spotify Premium, at most five Spotify users can be authorized, and every user must be added under **User Management** before the app can access their library.

## Run locally

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Edit `.env.local` with your Spotify client ID:

```dotenv
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_REDIRECT_URL=http://127.0.0.1:3003
```

Then start the dev server:

```bash
npm run dev
```

Open `http://127.0.0.1:3003`. Add `?demo=1` in development to preview the signed-in library UI without a Spotify session.

## Manual deployment

If you only need the Spotify library picker, any static host works with these settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Build environment variables: `VITE_SPOTIFY_CLIENT_ID` and `VITE_REDIRECT_URL`
- Runtime: a current Node.js LTS release
- HTTPS is required for Spotify login outside local development

Set `VITE_REDIRECT_URL` to the site's public HTTPS origin, add the same value to the Spotify app's redirect URIs, run `npm run build`, and upload `dist`.

The Favorites page requires the included Cloudflare Pages Function and D1 database. A static-only deployment can serve the picker, but `/api/favorites` will not be available unless you deploy that backend separately.

### Cloudflare Pages deployment

This repository includes a Cloudflare Pages Function for favorites and a D1 schema. With Wrangler already authenticated, run:

```bash
npm run deploy
```

The command builds the app, applies `db/schema.sql` to the `soundice` D1 database, and deploys the Pages bundle and `functions/` API. The default production redirect URI is `https://soundice.pages.dev`; add that exact URL to the Spotify app's Redirect URIs.

The deployment uses the `main` production branch. To use a custom domain, set `VITE_REDIRECT_URL` to that exact HTTPS origin before running the command and add the same value to Spotify.

Soundice assumes it is hosted at the root of a domain. A provider that publishes it under a path such as `example.github.io/soundice/` needs additional Vite base-path and service-worker configuration. GitHub Pages works without those changes when it uses a custom domain at the root.
