# Simple Web Music Player

Local, client-side music player demo with playlist, search, categorization, and basic audio controls.

How to run
- Open [music-player/index.html](music-player/index.html) in a modern browser (Chrome, Edge, Firefox).

Features
- Playlist with clickable tracks
- Search by title/artist
- Filter by category
- Play / Pause / Previous / Next
- Progress seek and time display
- Volume control

Notes
- Tracks use remote example MP3s from SoundHelix. You can replace entries in `js/app.js` with your own URLs or local files.
- For local files, serve the folder with a static file server to avoid browser CORS/file restrictions (e.g. `npx http-server` or `python -m http.server`).
