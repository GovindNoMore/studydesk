# Study Desk — Electron App

A personal study dashboard. Pure black minimal design.
Built with Electron — runs as a real desktop application.

---

## Project Structure

```
studydesk/
├── main.js              Electron main process
├── preload.js           Secure IPC bridge
├── package.json
├── src/
│   ├── index.html       App shell
│   ├── css/
│   │   ├── reset.css
│   │   ├── tokens.css   Design tokens (colors, fonts)
│   │   ├── layout.css   App layout, grid, views
│   │   ├── components.css  All UI components
│   │   └── animations.css  CSS animations
│   └── js/
│       ├── store.js     Data layer (localStorage)
│       ├── spotify.js   Spotify Web API + OAuth
│       ├── session.js   Study session timer
│       ├── render.js    All DOM rendering
│       └── app.js       Event handlers + init
└── assets/
    └── (place icon.ico / icon.png here)
```

---

## Step 1 — Install dependencies

Make sure Node.js (v18+) is installed. Then:

```cmd
cd H:\studydesk
npm install
```

---

## Step 2 — Set up Spotify (required for music)

1. Go to https://developer.spotify.com/dashboard
2. Log in and click "Create App"
3. Fill in:
   - App name: Study Desk
   - Redirect URI: http://localhost:8888/callback  (click Add)
   - Check "Web API" and "Web Playback SDK"
4. Click Settings — copy your Client ID and Client Secret
5. Open main.js and replace:
   ```js
   const SPOTIFY_CLIENT_ID     = 'YOUR_SPOTIFY_CLIENT_ID';
   const SPOTIFY_CLIENT_SECRET = 'YOUR_SPOTIFY_CLIENT_SECRET';
   ```

---

## Step 3 — Run in development

```cmd
cd H:\studydesk
npm start
```

The app window opens. You can now:
- Add subjects and topics
- Tick off syllabus topics
- Add lecture YouTube links and watch them inside the app
- Connect Spotify and control playback
- Start/end study sessions
- Track homework deadlines

---

## Step 4 — Build an installable .exe (Windows)

```cmd
cd H:\studydesk
npm run build:win
```

Output is in `H:\studydesk\dist\`
Run the `.exe` installer — installs Study Desk like any Windows app.

For other platforms:
```cmd
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux AppImage
```

---

## Step 5 — Auto-launch on Windows startup

After installing the built .exe, go to:
Windows Settings > Apps > Startup
Find Study Desk and enable it.

Or run once in terminal:
```cmd
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudyDesk" /t REG_SZ /d "\"C:\Users\%USERNAME%\AppData\Local\Programs\study-desk\Study Desk.exe\"" /f
```

---

## Features

- Dashboard with syllabus ring, now playing, today stats, deadlines
- Syllabus tracker: subjects, topics as chips, per-subject progress bar
- Lectures: grid with YouTube thumbnails, in-app video player (webview)
- Tasks: homework with due dates, overdue alerts
- Focus: daily checklist, auto-clears each morning
- Music: Spotify OAuth login, full playback controls, recently played
- Session timer: tracks study time per day, topics done, tasks done
- Study streak counter
- Quick notes (auto-saves)
- Fullscreen toggle

---

## Data

All data stored in Electron's localStorage (persists between sessions).
Location: C:\Users\<you>\AppData\Roaming\study-desk\

---

## Troubleshooting

**"electron is not recognized"**
Run `npm install` first.

**Spotify auth window doesn't open**
Make sure your redirect URI in the Spotify dashboard is exactly:
`http://localhost:8888/callback`

**Video not loading**
Only YouTube links are embedded. Other URLs open externally.

**White flash on startup**
Normal on first load — sets backgroundColor:#000 in main.js which minimizes it.
