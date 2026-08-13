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

## Browser verification

- If a flow needs a logged-in session (Google OAuth, or any page behind auth), **ask the user to log in**. Do not invent credentials or skip past the login wall. The user will complete login in the preview.
- When browser verification is finished, **close the preview**. Call `preview_open` with `open: false` (and `show: false`) to hide the inline browser. There is no dedicated destroy-tab tool. If the panel stays visible, say so and ask the user to close it. Do not leave the preview sitting open after the task.
