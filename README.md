# Soundice

Soundice picks a random album, artist, song, or podcast episode from your Spotify library.

It is a static Vue app, installable as a PWA on supported mobile and desktop browsers. Spotify authentication uses Authorization Code with PKCE, so tokens and library data stay in the browser and no backend or client secret is required.

## Get the repo

```bash
git clone https://github.com/penghuili/soundice.git
cd soundice
npm install
cp .env.example .env.local
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Edit `.env.local` with the client ID and local redirect URI from your Spotify app:

```dotenv
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_REDIRECT_URL=http://127.0.0.1:3003
```

## Configure Spotify

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), sign in, and select **Create app**.
2. Enter an app name and description. For the redirect URI, add `http://127.0.0.1:3003` for local development.
3. In **APIs used**, select **Web API**, then create the app.
4. Open **Settings** and copy the **Client ID** into `VITE_SPOTIFY_CLIENT_ID`. Soundice uses PKCE; do not put the Spotify client secret in this repo or any `VITE_` variable.
5. Add every deployed site as an exact redirect URI, for example `https://soundice.example.com`. The scheme, host, port, path, and trailing slash must match `VITE_REDIRECT_URL` exactly.
6. New apps start in **Development Mode**. The app owner must have Spotify Premium, no more than five Spotify users can be authorized, and every user must be added under **User Management** before the app can access their library.

## Development

```bash
npm run dev
```

Open `http://127.0.0.1:3003`. Add `?demo=1` in development to preview the signed-in library UI without a Spotify session.

## Deploy anywhere

Soundice can be hosted by any static-site provider. Configure these build settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SPOTIFY_CLIENT_ID` and `VITE_REDIRECT_URL`
- Runtime: a current Node.js LTS release

Set `VITE_REDIRECT_URL` to the site's public HTTPS origin, such as `https://soundice.example.com`, and add the identical value to the Spotify app's redirect URIs. Then run:

```bash
npm run build
```

The deployable files are generated in `dist`. Upload that directory to Vercel, Netlify, Cloudflare Pages, S3, a VPS, or another static host. HTTPS is required for Spotify login outside local development.

Soundice assumes it is hosted at the root of a domain. A provider that publishes it under a path such as `example.github.io/soundice/` needs additional Vite base-path and service-worker configuration. GitHub Pages works without those changes when it uses a custom domain at the root.

### Ask an AI coding agent to deploy it

After cloning the repository, give your AI agent access to the working directory and your chosen hosting provider's CLI or credentials. A prompt like this contains the information it needs:

> Deploy this Vue/Vite app to [provider]. Use `npm run build` and publish `dist`. Configure `VITE_SPOTIFY_CLIENT_ID` and `VITE_REDIRECT_URL` as build environment variables. Do not commit hosting credentials or a Spotify client secret. If the app will be hosted below a URL path instead of at a domain root, adapt the Vite asset base and service-worker paths. Report the final HTTPS URL and any DNS or Spotify redirect URI changes I need to make.

Once the agent reports the public URL, add that exact URL to **Redirect URIs** in the Spotify Developer Dashboard and redeploy with the same URL as `VITE_REDIRECT_URL`.

### Existing S3 deploy script

The repository also includes `npm run dp`, which builds and uploads to the S3 bucket configured by `S3_URL`. It requires the AWS CLI and valid AWS credentials. Most forks should use their hosting provider's standard static-site deployment instead.
