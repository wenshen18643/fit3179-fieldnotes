# Cinematic preview

Open `http://127.0.0.1:4179/cinematic.html` while `npm start` is running.

The original remains at `/index.html` and has not been edited. Use the **Original version** link at the bottom of the cinematic opening to return. No restore operation is necessary.

`original-index.html` is an additional snapshot of the original HTML, for safekeeping; use the root original page for browsing because its asset links are relative.

The preview shares the original charts and data. Its Three.js flock is decorative, not a data visualisation, and is not counted towards assignment chart requirements. The static dusk composition remains when WebGL is unavailable. Motion can be paused and respects reduced-motion preferences; rendering stops offscreen and in hidden tabs.

Rebuild the preview after original HTML edits with `node scripts/build-cinematic.mjs`. Three.js 0.180.0 is self-hosted under `vendor/`, with its MIT licence. Module setup follows https://threejs.org/manual/en/installation.html.
