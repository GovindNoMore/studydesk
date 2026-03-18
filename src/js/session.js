// ── session.js ─ Study session timer & daily stats ───────────────────────

const SESSION = {
  timer: null,
  elapsed: 0,
};

function toggleSession() {
  const s = getSession();
  const btn = document.getElementById('sessionBtn');
  const lbl = document.getElementById('sessionLabel');

  if (!s.active) {
    // Start
    s.active = true;
    s.startTime = Date.now();
    if (s.date !== today()) { s.totalToday = 0; s.topicsDone = 0; s.tasksDone = 0; s.date = today(); }
    saveSession(s);
    SESSION.elapsed = s.totalToday * 60000;

    SESSION.timer = setInterval(() => {
      SESSION.elapsed += 1000;
      updateSessionUI();
    }, 1000);

    btn.textContent = 'End Session';
    btn.classList.add('active');

  } else {
    // End
    const elapsed = Math.floor((Date.now() - s.startTime) / 60000);
    s.totalToday = (s.totalToday || 0) + elapsed;
    s.active = false;
    s.startTime = null;
    saveSession(s);
    SESSION.elapsed = s.totalToday * 60000;
    clearInterval(SESSION.timer);
    SESSION.timer = null;

    btn.textContent = 'Start Session';
    btn.classList.remove('active');
    updateSessionUI();
  }
}

function updateSessionUI() {
  const s = getSession();
  const lbl = document.getElementById('sessionLabel');
  const bar = document.getElementById('sessionBar');
  const statTime = document.getElementById('statStudyTime');

  const totalMs = s.active ? SESSION.elapsed + (Date.now() - s.startTime) : SESSION.elapsed;
  const totalMin = Math.floor(totalMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  const display = h > 0 ? `${h}h ${m}m` : `${m}m`;

  if (lbl) {
    if (s.active) {
      const running = Date.now() - s.startTime;
      const rm = Math.floor(running / 60000);
      const rs = Math.floor((running % 60000) / 1000);
      lbl.innerHTML = `<span class="session-active-dot"></span>Session running &mdash; ${rm}:${String(rs).padStart(2,'0')}`;
    } else {
      lbl.textContent = totalMin > 0 ? `Studied ${display} today` : 'No active session';
    }
  }

  // Progress bar up to 4h (240min) max
  const pct = Math.min(totalMin / 240 * 100, 100);
  if (bar) bar.style.width = pct + '%';

  if (statTime) statTime.textContent = display || '0m';

  // Update other stats
  const statTopics = document.getElementById('statTopicsDone');
  const statTasks  = document.getElementById('statTasksDone');
  if (statTopics) statTopics.textContent = s.topicsDone || 0;
  if (statTasks)  statTasks.textContent  = s.tasksDone  || 0;
}

function initSession() {
  const s = getSession();
  // If session was left active (app crashed), reset it
  if (s.active) {
    s.active = false;
    const elapsed = s.startTime ? Math.floor((Date.now() - s.startTime) / 60000) : 0;
    s.totalToday = (s.totalToday || 0) + elapsed;
    s.startTime = null;
    saveSession(s);
  }
  // Reset stats if it's a new day
  if (s.date !== today()) {
    s.date = today(); s.totalToday = 0; s.topicsDone = 0; s.tasksDone = 0;
    saveSession(s);
  }
  SESSION.elapsed = (s.totalToday || 0) * 60000;
  updateSessionUI();
}
