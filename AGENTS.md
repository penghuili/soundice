# Soundice agent instructions

For every requested code or UI change:

1. Validate the change with the relevant checks, including `npm run build` for app changes.
2. Commit all intended source changes with a concise commit message.
3. Deploy the committed app with `npm run deploy`.
4. Verify the live site responds successfully and serves the new production bundle.
5. Report the commit and deployment result. Do not push to a remote unless the user explicitly asks.

Do not commit credentials or other ignored environment files. Preserve unrelated working-tree changes unless the user asks to include them.
