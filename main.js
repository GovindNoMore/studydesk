const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');

const SPOTIFY_CLIENT_ID     = 'd7b414b8fc424b988c614f5ff0599248';
const SPOTIFY_CLIENT_SECRET = 'cb40d866a67c40c9b2d1a518fbaa1729';
const SPOTIFY_REDIRECT_URI  = 'studydesk://callback';
const SPOTIFY_SCOPES        = [
  'user-read-playback-state','user-modify-playback-state',
  'user-read-currently-playing','streaming','user-read-email',
  'user-read-private','playlist-read-private','user-library-read',
  'user-top-read','user-read-recently-played',
].join(' ');

let mainWindow  = null;
let popupWindow = null;
let authResolve = null;
let authReject  = null;

// Register studydesk:// as a custom protocol so Spotify can redirect back to the app
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('studydesk', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('studydesk');
}

app.setLoginItemSettings({ openAtLogin: true, openAsHidden: false });

// Handle the studydesk://callback?code=... redirect from Spotify (Windows)
app.on('second-instance', (_, argv) => {
  const callbackUrl = argv.find(a => a.startsWith('studydesk://'));
  if (callbackUrl) handleCallback(callbackUrl);
});

// Handle the studydesk://callback?code=... redirect from Spotify (macOS)
app.on('open-url', (_, callbackUrl) => {
  handleCallback(callbackUrl);
});

function handleCallback(callbackUrl) {
  try {
    const parsed = new URL(callbackUrl);
    const code   = parsed.searchParams.get('code');
    if (code && authResolve) {
      exchangeCode(code).then(authResolve).catch(authReject);
      authResolve = null;
      authReject  = null;
    }
  } catch (e) {
    if (authReject) { authReject(e); authReject = null; }
  }
}

function createPopup() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  popupWindow = new BrowserWindow({
    width: 380, height: 480,
    x: sw - 400, y: sh - 500,
    backgroundColor: '#000000',
    frame: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
    show: false,
  });
  popupWindow.loadFile(path.join(__dirname, 'src', 'popup.html'));
  popupWindow.once('ready-to-show', () => {
    popupWindow.show();
    setTimeout(() => { if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close(); }, 12000);
  });
  popupWindow.on('closed', () => { popupWindow = null; });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680,
    backgroundColor: '#000000',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, webviewTag: true,
    },
    show: false,
  });
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setIcon(path.join(__dirname, 'assets', 'icon.ico'));
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.govind.studydesk');
    }
    createPopup();
    createWindow();
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.on('win:minimize',   () => mainWindow?.minimize());
ipcMain.on('win:maximize',   () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize(); });
ipcMain.on('win:close',      () => mainWindow?.close());
ipcMain.on('win:fullscreen', () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()));
ipcMain.on('popup:close',    () => popupWindow?.close());
ipcMain.on('popup:open-app', () => { popupWindow?.close(); mainWindow?.show(); mainWindow?.focus(); });
ipcMain.on('open:external',  (_, link) => shell.openExternal(link));

ipcMain.handle('spotify:auth', async () => {
  return new Promise((resolve, reject) => {
    authResolve = resolve;
    authReject  = reject;
    shell.openExternal(buildAuthUrl());
    // Timeout after 5 minutes
    setTimeout(() => {
      if (authReject) {
        authReject(new Error('Auth timed out'));
        authResolve = null;
        authReject  = null;
      }
    }, 300000);
  });
});

function buildAuthUrl() {
  return `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id:     SPOTIFY_CLIENT_ID,
    scope:         SPOTIFY_SCOPES,
    redirect_uri:  SPOTIFY_REDIRECT_URI,
    show_dialog:   'true',
  })}`;
}

async function exchangeCode(code) {
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: SPOTIFY_REDIRECT_URI }).toString(),
  });
  return res.json();
}

ipcMain.handle('spotify:refresh', async (_, refreshToken) => {
  const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
  });
  return res.json();
});