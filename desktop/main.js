// ============================================================
// FaceVote — Windows desktop shell (Electron).
//
// Serves the bundled offline web app (Device Mode) from a tiny
// local server on 127.0.0.1. localhost is a secure context in
// Chromium, so the webcam (getUserMedia), IndexedDB and
// localStorage all work and persist in the app profile —
// no Node, no server setup, no internet needed.
// ============================================================

const { app, BrowserWindow, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WWW_ROOT = path.join(__dirname, 'www');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

let server = null;

function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      try {
        let urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
        if (urlPath === '/') urlPath = '/index.html';
        let file = path.normalize(path.join(WWW_ROOT, urlPath));
        if (!file.startsWith(WWW_ROOT)) {
          res.writeHead(403);
          return res.end('forbidden');
        }
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          file = path.join(WWW_ROOT, 'index.html'); // SPA fallback
        }
        const ext = path.extname(file).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(file).pipe(res);
      } catch {
        res.writeHead(500);
        res.end('error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

app.setName('FaceVote');

app.whenReady().then(async () => {
  // Grant the webcam/mic to our own app page only — nothing else.
  const isOwnPage = (url) => typeof url === 'string' && url.startsWith('http://127.0.0.1');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if ((permission === 'media' || permission === 'mediaKeySystem') && isOwnPage(details?.requestingUrl || webContents.getURL())) {
      return callback(true);
    }
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    return permission === 'media' && isOwnPage(requestingOrigin);
  });

  const port = await startServer();

  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'FaceVote',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#090e17',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}/`);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) win.reload();
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});
