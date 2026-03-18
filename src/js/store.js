// ── store.js ─ All data persistence via localStorage ──────────────────────
// Keys
const K = {
  SUBJECTS:   'sd2_subjects',
  LECTURES:   'sd2_lectures',
  HOMEWORK:   'sd2_homework',
  FOCUS:      'sd2_focus',
  NOTES:      'sd2_notes',
  STREAK:     'sd2_streak',
  LAST_OPEN:  'sd2_last_open',
  SESSION:    'sd2_session',
  SPOTIFY:    'sd2_spotify_tokens',
};

const ACCENT_COLORS = ['#4a9eff','#f5a623','#3ecf8e','#ff6b8a','#a78bfa','#22d3ee','#f0c040','#ff8c5a'];

// ── Generic ───────────────────────────────────────────────
function load(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function today() { return new Date().toISOString().slice(0,10); }

// ── Subjects ──────────────────────────────────────────────
function getSubjects()        { return load(K.SUBJECTS) || []; }
function saveSubjects(arr)    { save(K.SUBJECTS, arr); }

function addSubject(name, icon, color) {
  const s = getSubjects();
  s.push({ id: genId(), name, icon: icon || name[0].toUpperCase(), color: color || ACCENT_COLORS[s.length % ACCENT_COLORS.length], topics: [] });
  saveSubjects(s);
}
function deleteSubject(id) { saveSubjects(getSubjects().filter(s => s.id !== id)); }

// "topics" kept as the internal field name for data compatibility,
// but labelled "chapters" everywhere in the UI.
function addTopic(subjectId, name) {
  const s = getSubjects();
  const subj = s.find(x => x.id === subjectId);
  if (subj) subj.topics.push({ id: genId(), name, done: false });
  saveSubjects(s);
}
function toggleTopic(subjectId, topicId) {
  const s = getSubjects();
  const subj = s.find(x => x.id === subjectId);
  if (subj) { const t = subj.topics.find(x => x.id === topicId); if (t) t.done = !t.done; }
  saveSubjects(s);
  trackTopicDone();
}
function deleteTopic(subjectId, topicId) {
  const s = getSubjects();
  const subj = s.find(x => x.id === subjectId);
  if (subj) subj.topics = subj.topics.filter(t => t.id !== topicId);
  saveSubjects(s);
}
function subjectProgress(s) {
  if (!s.topics.length) return 0;
  return Math.round(s.topics.filter(t => t.done).length / s.topics.length * 100);
}
function overallProgress() {
  const subjects = getSubjects();
  const total = subjects.reduce((a, s) => a + s.topics.length, 0);
  if (!total) return 0;
  const done  = subjects.reduce((a, s) => a + s.topics.filter(t => t.done).length, 0);
  return Math.round(done / total * 100);
}

// ── Lectures ──────────────────────────────────────────────
function getLectures()        { return load(K.LECTURES) || []; }
function saveLectures(arr)    { save(K.LECTURES, arr); }

function addLecture(title, url, tag) {
  const l = getLectures();
  l.unshift({ id: genId(), title, url, tag: tag || 'General', addedAt: Date.now() });
  saveLectures(l);
}
function deleteLecture(id)    { saveLectures(getLectures().filter(l => l.id !== id)); }

function getYTThumb(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
}
function getEmbedUrl(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` : url;
}

// ── Homework ──────────────────────────────────────────────
function getHomework()        { return load(K.HOMEWORK) || []; }
function saveHomework(arr)    { save(K.HOMEWORK, arr); }

function addHomework(desc, subject, due) {
  const h = getHomework();
  h.unshift({ id: genId(), desc, subject, due: due || '', done: false, createdAt: Date.now() });
  saveHomework(h);
}
function toggleHomework(id) {
  const h = getHomework();
  const item = h.find(x => x.id === id);
  if (item) { item.done = !item.done; if (item.done) trackTaskDone(); }
  saveHomework(h);
}
function deleteHomework(id)   { saveHomework(getHomework().filter(h => h.id !== id)); }

function daysUntil(isoStr) {
  if (!isoStr) return null;
  const d = Math.ceil((new Date(isoStr + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000);
  return d;
}
function formatDue(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

// ── Focus ─────────────────────────────────────────────────
function getFocus()           { return (load(K.FOCUS) || []).filter(f => f.date === today()); }
function saveFocus(arr)       { save(K.FOCUS, arr); }

function addFocus(text) {
  const all = load(K.FOCUS) || [];
  all.push({ id: genId(), text, done: false, date: today() });
  saveFocus(all);
}
function toggleFocus(id) {
  const all = load(K.FOCUS) || [];
  const item = all.find(x => x.id === id);
  if (item) item.done = !item.done;
  saveFocus(all);
}
function deleteFocus(id) {
  saveFocus((load(K.FOCUS) || []).filter(f => f.id !== id));
}

// ── Notes ─────────────────────────────────────────────────
function getNotes()           { return localStorage.getItem(K.NOTES) || ''; }
function saveNotes(v)         { localStorage.setItem(K.NOTES, v); }

// ── Streak ────────────────────────────────────────────────
function getStreak() {
  const s = load(K.STREAK) || { count: 0, lastDate: '' };
  const t = today();
  if (s.lastDate === t) return s.count;
  const yest = new Date(); yest.setDate(yest.getDate()-1);
  const y = yest.toISOString().slice(0,10);
  if (s.lastDate === y) s.count += 1; else s.count = 1;
  s.lastDate = t;
  save(K.STREAK, s);
  return s.count;
}

// ── Last open ─────────────────────────────────────────────
function getLastOpen()        { return localStorage.getItem(K.LAST_OPEN) || ''; }
function setLastOpen()        { localStorage.setItem(K.LAST_OPEN, new Date().toISOString()); }

// ── Session tracking ──────────────────────────────────────
function getSession()         { return load(K.SESSION) || { active: false, startTime: null, totalToday: 0, date: today(), topicsDone: 0, tasksDone: 0 }; }
function saveSession(s)       { save(K.SESSION, s); }

function trackTopicDone() {
  const s = getSession();
  if (s.date !== today()) { s.date = today(); s.topicsDone = 0; s.tasksDone = 0; s.totalToday = 0; }
  s.topicsDone = (s.topicsDone || 0) + 1;
  saveSession(s);
}
function trackTaskDone() {
  const s = getSession();
  if (s.date !== today()) { s.date = today(); s.topicsDone = 0; s.tasksDone = 0; s.totalToday = 0; }
  s.tasksDone = (s.tasksDone || 0) + 1;
  saveSession(s);
}

// ── Spotify tokens ────────────────────────────────────────
function getSpotifyTokens()   { return load(K.SPOTIFY); }
function saveSpotifyTokens(t) { save(K.SPOTIFY, t); }
function clearSpotifyTokens() { localStorage.removeItem(K.SPOTIFY); }

// ── Default seed — JEE Main 2026 / CBSE Class 12 Syllabus ─
function seedDefaults() {
  if (getSubjects().length) return;

  // ── Physics ───────────────────────────────────────────────
  addSubject('Physics', 'P', '#4a9eff');
  const ph = getSubjects()[0].id;
  [
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Currents',
    'Electromagnetic Waves',
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics',
  ].forEach(c => addTopic(ph, c));

  // ── Chemistry ─────────────────────────────────────────────
  addSubject('Chemistry', 'C', '#3ecf8e');
  const ch = getSubjects()[1].id;
  [
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'The d- and f-Block Elements',
    'Coordination Compounds',
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules',
  ].forEach(c => addTopic(ch, c));

  // ── Mathematics ───────────────────────────────────────────
  addSubject('Mathematics', 'M', '#ff6b8a');
  const ma = getSubjects()[2].id;
  [
    'Relations and Functions',
    'Inverse Trigonometric Functions',
    'Matrices',
    'Determinants',
    'Continuity and Differentiability',
    'Applications of Derivatives',
    'Integrals',
    'Applications of Integrals',
    'Differential Equations',
    'Vector Algebra',
    'Three-Dimensional Geometry',
    'Linear Programming',
    'Probability',
  ].forEach(c => addTopic(ma, c));
}