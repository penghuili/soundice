# Soundice

Soundice picks a random album, artist, song, or podcast episode from your Spotify library.

It is installable as a PWA on supported mobile and desktop browsers, with an offline app shell for reopening the interface without a network connection.

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3003`. Add `?demo=1` in development to preview the signed-in library UI without a Spotify session.

## Build and deploy

```bash
npm run build
npm run dp
```

The production site is deployed to the S3 bucket configured by `S3_URL`. Authentication uses Spotify Authorization Code with PKCE; tokens and library data stay in the browser.
