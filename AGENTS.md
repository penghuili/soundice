# soundice

## Finish workflow

When wrapping up a task, always in this order:

1. **Validate** the change with relevant checks, including `npm run build` for app changes.
2. **Commit the change** (`git commit`) — scoped to the files the task touched with a concise commit message.
3. **Deploy** what changed:
   - Web app changed → `npm run deploy`
4. **Verify** the live site responds successfully and serves the new production bundle (`https://soundice.pages.dev`).
5. **Push** (`git push`) — after deploying and verifying, push to remote so the repo always reflects what is live.
6. **Report** the commit, deployment, and push result.

Do not commit credentials or other ignored environment files. Preserve unrelated working-tree changes unless the user asks to include them.
