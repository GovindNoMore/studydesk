// ── spotify.js ─ Music section removed ───────────────────
// Stubs kept so no other code breaks

function renderMusicPanel() {}
function renderNowPlayingDash() {
  const el = document.getElementById('nowPlayingDash');
  if (!el) return;
  el.innerHTML = `<div class="np-idle">Music section removed</div>`;
}
function initSpotify() {}
function spotifyConnect() {}
function spotifyDisconnect() {}
function spPause() {}
function spPlay() {}
function spNext() {}
function spPrev() {}
function spTogglePlay() {}
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
