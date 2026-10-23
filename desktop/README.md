# FaceVote — Windows Desktop (.exe)

The FaceVote web app packaged as a Windows desktop app with Electron.
It runs the **offline Device Mode** build: no Node, no server, no
internet needed at run time. The whole app (interface, face-api
library and the 3 face models it loads) is bundled inside, voter data
is stored in the app profile on that PC, and the voter roll starts
empty — the officer enrolls voters in the app.

## What you get

- `FaceVote-Portable.exe` — single file, no install. Double-click and
  it runs (best for demos).
- `FaceVote-Setup.exe` — normal installer with Start Menu / desktop
  shortcuts.

Both are Windows 10/11, 64-bit. The .exe is **unsigned**, so Windows
SmartScreen may warn "Windows protected your PC / unknown publisher"
on first run — click **More info → Run anyway**.

## How it works

`main.js` starts a tiny local server on 127.0.0.1 and opens the app
from it. localhost is a secure context in Chromium, so the webcam,
IndexedDB and localStorage work and persist across restarts in
`%APPDATA%\FaceVote`. Webcam permission is granted to the app's own
page only. Backup download shows the normal Windows save dialog;
Restore uses the normal file picker.

## Build it yourself (Windows, one time)

```bat
:: 1) Build the web app (repo root)
npm install
npm run build

:: 2) Package the desktop app
cd desktop
npm install
npm run dist
```

The finished .exe files appear in `desktop\release\`.
`prepare-www.mjs` (run automatically by `npm run dist`) copies
`..\dist` into `desktop\www` with the service worker removed and the
unused SSD face model dropped — the same packaging as the Android app.
