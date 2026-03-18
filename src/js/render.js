// ── render.js ─ All DOM rendering ─────────────────────────────────────────

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Syllabus ──────────────────────────────────────────────
function renderSyllabus() {
  const grid     = document.getElementById('syllabusGrid');
  const subjects = getSubjects();

  if (!subjects.length) {
    grid.innerHTML = '<div class="empty-state">No subjects yet.<br>Create your first one.</div>';
    return;
  }

  grid.innerHTML = subjects.map(s => {
    const pct   = subjectProgress(s);
    const done  = s.topics.filter(t => t.done).length;
    const chips = s.topics.slice(0, 8).map(t =>
      `<span class="topic-chip ${t.done ? 'done' : ''}" onclick="handleTopicChipClick('${s.id}','${t.id}')">${esc(t.name)}</span>`
    ).join('');
    const more  = s.topics.length > 8
      ? `<span class="topic-chip more" onclick="openTopicsModal('${s.id}')">+${s.topics.length-8} more</span>` : '';

    return `
      <div class="subject-card">
        <div class="subject-card-header">
          <div class="subject-identity">
            <div class="subject-icon" style="background:${s.color}22;color:${s.color}">${esc(s.icon)}</div>
            <span class="subject-name">${esc(s.name)}</span>
          </div>
          <span class="subject-pct">${done}/${s.topics.length}</span>
        </div>
        <div class="subject-bar-wrap">
          <div class="subject-bar" style="width:${pct}%;background:${s.color}"></div>
        </div>
        <div class="topics-count">${pct}% complete</div>
        <div class="topic-chips">${chips}${more}</div>
        <div class="subject-card-footer">
          <button class="btn-add" onclick="openTopicsModal('${s.id}')">manage chapters</button>
          <button class="btn-icon-sm" onclick="handleDeleteSubject('${s.id}')" title="Delete">&#10005;</button>
        </div>
      </div>
    `;
  }).join('');

  renderProgressRing();
}

function renderProgressRing() {
  const pct      = overallProgress();
  const ringFill = document.getElementById('ringFill');
  const ringPct  = document.getElementById('ringPct');
  if (!ringFill) return;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (pct / 100) * circumference;
  ringFill.style.strokeDashoffset = offset;
  ringFill.style.strokeDasharray  = circumference;
  if (ringPct) ringPct.textContent = pct + '%';
}

// ── Lectures ──────────────────────────────────────────────
function renderLectures() {
  const grid = document.getElementById('lecturesGrid');
  const lecs = getLectures();

  if (!lecs.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No lectures yet.<br>Add your first one above.</div>';
    return;
  }

  grid.innerHTML = lecs.map(l => {
    const thumb = getYTThumb(l.url);
    return `
      <div class="lecture-card" onclick="openVideoPlayer('${l.id}')">
        <div class="lecture-thumb">
          ${thumb ? `<img src="${thumb}" alt="" loading="lazy" />` : ''}
          <div class="lecture-play-btn">&#9654;</div>
        </div>
        <div class="lecture-card-body">
          <div class="lecture-card-title">${esc(l.title)}</div>
          <div class="lecture-card-meta">
            <span class="lecture-tag-pill">${esc(l.tag)}</span>
            <div class="lecture-card-actions">
              <button class="btn-icon-sm" onclick="event.stopPropagation();handleDeleteLecture('${l.id}')" title="Remove">&#10005;</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  renderRecentLectures();
}

function renderRecentLectures() {
  const el   = document.getElementById('dashRecentLectures');
  if (!el) return;
  const lecs = getLectures().slice(0, 5);

  if (!lecs.length) { el.innerHTML = '<div class="empty-state">No lectures added yet</div>'; return; }

  el.innerHTML = lecs.map(l => {
    const thumb = getYTThumb(l.url);
    return `
      <div class="recent-lec-item" onclick="openVideoPlayerFromDash('${l.id}')">
        <div class="recent-lec-thumb">
          ${thumb ? `<img src="${thumb}" alt="" />` : '&#9654;'}
        </div>
        <div class="recent-lec-info">
          <div class="recent-lec-name">${esc(l.title)}</div>
          <div class="recent-lec-tag">${esc(l.tag)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── Homework ──────────────────────────────────────────────
function renderHomework() {
  const list  = document.getElementById('homeworkList');
  const items = getHomework();

  if (!items.length) { list.innerHTML = '<div class="empty-state">No tasks.<br>You are all caught up.</div>'; return; }

  const sorted = [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (!a.due) return 1; if (!b.due) return -1;
    return new Date(a.due) - new Date(b.due);
  });

  list.innerHTML = sorted.map(h => {
    const days = daysUntil(h.due);
    let dueClass = '', dueLabel = '';
    if (h.due) {
      if      (days < 0)  { dueClass = 'urgent'; dueLabel = `Overdue by ${-days}d`; }
      else if (days === 0){ dueClass = 'urgent'; dueLabel = 'Due today'; }
      else if (days <= 2) { dueClass = 'soon';   dueLabel = `Due in ${days}d`; }
      else                {                       dueLabel = `Due ${formatDue(h.due)}`; }
    }
    return `
      <div class="hw-item ${h.done ? 'done' : ''} ${dueClass === 'urgent' && !h.done ? 'overdue' : ''}">
        <div class="focus-check ${h.done ? 'checked' : ''} hw-check" onclick="handleToggleHW('${h.id}')"></div>
        <div class="hw-body">
          <div class="hw-desc">${esc(h.desc)}</div>
          <div class="hw-meta-row">
            ${h.subject ? `<span class="hw-subject-tag">${esc(h.subject)}</span>` : ''}
            ${h.due ? `<span class="hw-due-label ${dueClass}">${dueLabel}</span>` : ''}
          </div>
        </div>
        <button class="btn-icon-sm" onclick="handleDeleteHW('${h.id}')">&#10005;</button>
      </div>
    `;
  }).join('');
}

function renderDashDeadlines() {
  const el    = document.getElementById('dashDeadlines');
  if (!el) return;
  const items = getHomework()
    .filter(h => !h.done && h.due)
    .sort((a,b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);

  if (!items.length) { el.innerHTML = '<div class="empty-state" style="padding:16px 0">No upcoming deadlines</div>'; return; }

  el.innerHTML = items.map(h => {
    const days = daysUntil(h.due);
    let cls = '', label = formatDue(h.due);
    if      (days < 0)  { cls = 'urgent'; label = `${-days}d overdue`; }
    else if (days === 0){ cls = 'urgent'; label = 'Today'; }
    else if (days <= 2) { cls = 'soon';   label = `${days}d left`; }
    return `
      <div class="deadline-item">
        <span class="deadline-name">${esc(h.desc)}</span>
        ${h.subject ? `<span class="deadline-sub">${esc(h.subject)}</span>` : ''}
        <span class="deadline-due ${cls}">${label}</span>
      </div>
    `;
  }).join('');
}

// ── Focus ─────────────────────────────────────────────────
function renderFocus() {
  const dashEl = document.getElementById('dashFocusList');
  const fullEl = document.getElementById('focusList');
  const items  = getFocus();

  const html = items.length
    ? items.map(f => `
        <div class="focus-item ${f.done ? 'done' : ''}">
          <div class="focus-check ${f.done ? 'checked' : ''}" onclick="handleToggleFocus('${f.id}')"></div>
          <span class="focus-text">${esc(f.text)}</span>
          <button class="btn-icon-sm" onclick="handleDeleteFocus('${f.id}')">&#10005;</button>
        </div>
      `).join('')
    : '<div class="empty-state" style="padding:20px 0;text-align:left">Nothing planned yet.<br>What are you studying today?</div>';

  if (dashEl) dashEl.innerHTML = html;
  if (fullEl) fullEl.innerHTML = html;
}

// ── Topics Modal ──────────────────────────────────────────
let _activeSubjectId = null;

function openTopicsModal(subjectId) {
  _activeSubjectId = subjectId;
  const subjects = getSubjects();
  const s = subjects.find(x => x.id === subjectId);
  if (!s) return;
  document.getElementById('topicsModalTitle').textContent = `${s.name} — Chapters`;
  renderTopicsModalList(s);
  openModal('topicsModal');
}

function renderTopicsModalList(subject) {
  const el = document.getElementById('topicsModalList');
  if (!subject.topics.length) { el.innerHTML = '<div class="empty-state">No chapters yet. Add one below.</div>'; return; }
  el.innerHTML = subject.topics.map(t => `
    <div class="topic-row ${t.done ? 'done' : ''}">
      <div class="topic-row-left" onclick="handleToggleTopicModal('${subject.id}','${t.id}')">
        <div class="focus-check ${t.done ? 'checked' : ''}"></div>
        <span>${esc(t.name)}</span>
      </div>
      <button class="btn-icon-sm" onclick="handleDeleteTopicModal('${subject.id}','${t.id}')">&#10005;</button>
    </div>
  `).join('');
}

// ── Video player — opens in external browser ──────────────
function openVideoPlayer(lectureId) {
  const lec = getLectures().find(l => l.id === lectureId);
  if (!lec) return;
  // Open in external browser — avoids all YouTube embedding blocks
  if (window.electron?.openExternal) {
    window.electron.openExternal(lec.url);
  } else {
    window.open(lec.url, '_blank');
  }
}

function openVideoPlayerFromDash(lectureId) {
  switchView('lectures');
  setTimeout(() => openVideoPlayer(lectureId), 200);
}

// Kept as no-op — video panel no longer needed
function closeVideoPanel() {}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  renderProgressRing();
  renderFocus();
  renderDashDeadlines();
  renderRecentLectures();
  renderNowPlayingDash();
  updateSessionUI();
}