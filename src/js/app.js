// ── app.js ─ Main application controller ─────────────────────────────────

// ── Platform detection ────────────────────────────────────
try {
  if (navigator.platform.includes('Mac') || navigator.userAgent.includes('Mac')) {
    document.body.classList.add('darwin');
  }
} catch(e) {}

// ── Titlebar controls ─────────────────────────────────────
document.getElementById('tbMinimize')?.addEventListener('click', () => window.electron?.minimize());
document.getElementById('tbMaximize')?.addEventListener('click', () => window.electron?.maximize());
document.getElementById('tbClose')?.addEventListener('click',    () => window.electron?.close());
document.getElementById('fullscreenBtn')?.addEventListener('click', () => window.electron?.fullscreen());

// ── Navigation — smooth, instant feel ────────────────────
let _currentView = 'dashboard';

function switchView(name) {
  if (name === _currentView) return; // Don't re-render if already on this view
  _currentView = name;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === name);
  });

  // Swap views without layout jank
  document.querySelectorAll('.view').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById(`view-${name}`);
  if (target) {
    target.classList.add('active');
    // Scroll to top of view on switch
    document.getElementById('viewContainer')?.scrollTo({ top: 0, behavior: 'instant' });
  }

  // On-demand renders
  if (name === 'dashboard')  renderDashboard();
  if (name === 'syllabus')   renderSyllabus();
  if (name === 'lectures')   renderLectures();
  if (name === 'homework')   renderHomework();
  if (name === 'focus')      renderFocus();
  // Music section removed — no render needed
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => switchView(el.dataset.view));
});

// ── Modals — with animation out ───────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  // Focus first input for convenience
  setTimeout(() => {
    const first = el.querySelector('input');
    if (first) first.focus();
  }, 80);
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
  }
});

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});

// ── Color swatches ────────────────────────────────────────
let selectedColor = ACCENT_COLORS[0];
function buildColorSwatches() {
  const wrap = document.getElementById('colorSwatches');
  if (!wrap) return;
  selectedColor = ACCENT_COLORS[0];
  wrap.innerHTML = ACCENT_COLORS.map((c, i) =>
    `<div class="color-swatch ${i === 0 ? 'selected' : ''}" style="background:${c}"
          onclick="selectColor('${c}', this)"></div>`
  ).join('');
}
function selectColor(c, el) {
  selectedColor = c;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
}

// ── Subject handlers ──────────────────────────────────────
function handleAddSubject() {
  const name = document.getElementById('sName').value.trim();
  const icon = document.getElementById('sIcon').value.trim();
  if (!name) return;
  addSubject(name, icon, selectedColor);
  document.getElementById('sName').value = '';
  document.getElementById('sIcon').value = '';
  closeModal('subjectModal');
  renderSyllabus();
  renderProgressRing();
}
document.getElementById('sName')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddSubject(); });

function handleDeleteSubject(id) {
  if (confirm('Delete this subject and all its topics?')) { deleteSubject(id); renderSyllabus(); }
}

function handleTopicChipClick(subjectId, topicId) {
  toggleTopic(subjectId, topicId);
  renderSyllabus();
  renderDashboard();
}

function handleToggleTopicModal(subjectId, topicId) {
  toggleTopic(subjectId, topicId);
  const subjects = getSubjects();
  const s = subjects.find(x => x.id === subjectId);
  if (s) renderTopicsModalList(s);
  renderSyllabus();
  renderProgressRing();
}

function handleDeleteTopicModal(subjectId, topicId) {
  deleteTopic(subjectId, topicId);
  const subjects = getSubjects();
  const s = subjects.find(x => x.id === subjectId);
  if (s) renderTopicsModalList(s);
  renderSyllabus();
}

function handleAddTopic() {
  const input = document.getElementById('newTopicInput');
  const name  = input.value.trim();
  if (!name || !_activeSubjectId) return;
  addTopic(_activeSubjectId, name);
  input.value = '';
  const subjects = getSubjects();
  const s = subjects.find(x => x.id === _activeSubjectId);
  if (s) renderTopicsModalList(s);
  renderSyllabus();
}
document.getElementById('newTopicInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddTopic(); });

// ── Lecture handlers ──────────────────────────────────────
function handleAddLecture() {
  const title = document.getElementById('lTitle').value.trim();
  const url   = document.getElementById('lUrl').value.trim();
  const tag   = document.getElementById('lTag').value.trim();
  if (!title || !url) return;
  addLecture(title, url, tag);
  ['lTitle','lUrl','lTag'].forEach(id => { document.getElementById(id).value = ''; });
  closeModal('lectureModal');
  renderLectures();
}
document.getElementById('lTitle')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddLecture(); });

function handleDeleteLecture(id) { deleteLecture(id); renderLectures(); }

function handleQuickAddLecture() {
  const title = document.getElementById("quickLecTitle").value.trim();
  const url   = document.getElementById("quickLecUrl").value.trim();
  const tag   = document.getElementById("quickLecTag").value.trim();
  if (!title || !url) { document.getElementById("quickLecUrl").focus(); return; }
  addLecture(title, url, tag);
  ["quickLecTitle","quickLecUrl","quickLecTag"].forEach(id => { document.getElementById(id).value = ""; });
  renderLectures();
}

// ── Homework handlers ─────────────────────────────────────
function handleAddHomework() {
  const desc = document.getElementById('hwDesc').value.trim();
  const sub  = document.getElementById('hwSub').value.trim();
  const due  = document.getElementById('hwDue').value;
  if (!desc) return;
  addHomework(desc, sub, due);
  ['hwDesc','hwSub','hwDue'].forEach(id => { document.getElementById(id).value = ''; });
  closeModal('homeworkModal');
  renderHomework();
  renderDashDeadlines();
}
document.getElementById('hwDesc')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddHomework(); });

function handleToggleHW(id) { toggleHomework(id); renderHomework(); renderDashDeadlines(); updateSessionUI(); }
function handleDeleteHW(id) { deleteHomework(id); renderHomework(); renderDashDeadlines(); }

// ── Focus handlers ────────────────────────────────────────
function handleAddFocus() {
  const text = document.getElementById('focusInput').value.trim();
  if (!text) return;
  addFocus(text);
  document.getElementById('focusInput').value = '';
  closeModal('focusModal');
  renderFocus();
}
document.getElementById('focusInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddFocus(); });

function handleToggleFocus(id) { toggleFocus(id); renderFocus(); }
function handleDeleteFocus(id) { deleteFocus(id); renderFocus(); }

// ── Notes ─────────────────────────────────────────────────
const notesArea = document.getElementById('notesArea');
if (notesArea) {
  notesArea.value = getNotes();
  let saveTimer;
  notesArea.addEventListener('input', () => {
    saveNotes(notesArea.value);
    const ind = document.getElementById('notesSaved');
    if (ind) {
      ind.textContent = 'saving...';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { ind.textContent = 'saved ✓'; }, 600);
    }
  });
}

// ── Clock & Date ──────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

function setDashboardHeader() {
  const hour = new Date().getHours();
  let greeting;
  if      (hour < 5)  greeting = 'Burning the midnight oil.';
  else if (hour < 12) greeting = 'Good morning.';
  else if (hour < 17) greeting = 'Good afternoon.';
  else if (hour < 21) greeting = 'Good evening.';
  else                greeting = 'Late night session.';

  const dateEl  = document.getElementById('dashDate');
  const greetEl = document.getElementById('dashGreeting');
  if (dateEl)  dateEl.textContent  = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  if (greetEl) greetEl.textContent = greeting;

  const streakEl = document.getElementById('streakNum');
  if (streakEl) streakEl.textContent = getStreak();
}

// ── Photo Carousel ────────────────────────────────────────
const PHOTO_KEY = 'sd2_photos';
let _photoIndex = 0;
let _photoTimer = null;

function initPhotoCarousel() {
  const input    = document.getElementById('photoFileInput');
  const dropZone = document.getElementById('photoDropZone');
  const carousel = document.getElementById('photoCarousel');

  // File input
  input?.addEventListener('change', e => loadPhotoFiles(e.target.files));

  // Click on drop zone
  dropZone?.addEventListener('click', () => input?.click());

  // Drag and drop
  carousel?.addEventListener('dragover', e => { e.preventDefault(); dropZone?.classList.add('drag-over'); });
  carousel?.addEventListener('dragleave', () => dropZone?.classList.remove('drag-over'));
  carousel?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone?.classList.remove('drag-over');
    loadPhotoFiles(e.dataTransfer.files);
  });

  renderPhotos();
}

function loadPhotoFiles(files) {
  const existing = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]');
  let count = 0;
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      existing.push(e.target.result);
      count++;
      if (count === Array.from(files).filter(f => f.type.startsWith('image/')).length) {
        localStorage.setItem(PHOTO_KEY, JSON.stringify(existing));
        renderPhotos();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotos() {
  const photos   = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]');
  const carousel = document.getElementById('photoCarousel');
  const slides   = document.getElementById('photoSlides');
  const dots     = document.getElementById('photoDots');
  const badge    = document.getElementById('photoCountBadge');
  const dropZone = document.getElementById('photoDropZone');
  if (!carousel || !slides || !dots) return;

  clearInterval(_photoTimer);

  if (!photos.length) {
    carousel.classList.remove('has-images');
    dropZone.style.display = 'flex';
    slides.innerHTML = '';
    dots.innerHTML   = '';
    return;
  }

  carousel.classList.add('has-images');
  dropZone.style.display = 'none';
  badge.textContent = `${photos.length} photo${photos.length > 1 ? 's' : ''}`;

  _photoIndex = 0;
  slides.innerHTML = photos.map((src, i) =>
    `<div class="photo-slide ${i === 0 ? 'active' : ''}">
      <img src="${src}" alt="" />
    </div>`
  ).join('');

  dots.innerHTML = photos.map((_, i) =>
    `<div class="photo-dot ${i === 0 ? 'active' : ''}" onclick="goToPhoto(${i})"></div>`
  ).join('');

  if (photos.length > 1) {
    _photoTimer = setInterval(() => goToPhoto((_photoIndex + 1) % photos.length), 4000);
  }
}

function goToPhoto(index) {
  const photos = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]');
  const slideEls = document.querySelectorAll('.photo-slide');
  const dotEls   = document.querySelectorAll('.photo-dot');
  slideEls.forEach((s, i) => s.classList.toggle('active', i === index));
  dotEls.forEach((d, i) => d.classList.toggle('active', i === index));
  _photoIndex = index;
}

function clearPhotos() {
  localStorage.removeItem(PHOTO_KEY);
  clearInterval(_photoTimer);
  renderPhotos();
}

// ── Init ──────────────────────────────────────────────────
function init() {
  seedDefaults();
  buildColorSwatches();
  setDashboardHeader();
  setLastOpen();
  updateClock();
  setInterval(updateClock, 1000);
  initSession();
  initSpotify();
  initPhotoCarousel();
  renderDashboard();
}

document.addEventListener('DOMContentLoaded', init);