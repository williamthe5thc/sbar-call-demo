// Immersive scene 1: the page, its overlays and its input. The 3D room itself is in
// world1.js (loaded only when WebGL works). Everything the canvas shows is also HTML:
// the findings card, the notes, the Objects nearby list and the live region.
import { scenario } from './scenario.js';
import { initMotion, reduced, onMotionChange } from './motion.js';
import { supported as speechSupported, toggleReading, stopReading } from './readaloud.js';
import { createCall } from './scene2.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ASSESS = scenario.assessment;
const byId = Object.fromEntries(ASSESS.map((h) => [h.id, h]));
const HANDOFF_KEY = 'sbar-scene1-notes';
const PREF_KEY = 'sbar-scene1-prefs';
const TITLE = 'The 2 a.m. Call: immersive version (beta)';
const SPOT_SETS = {
  1: { doorway: 'Doorway', foot: 'Foot of bed', bedleft: 'Bedside (left)', bedright: 'Bedside (right)', monitor: 'Monitor', ivpole: 'IV pole', window: 'Window' },
  2: { room12: 'Room 12 doorway', hall: 'Hallway', station: "Nurses' station", phone: 'Phone' },
};
const SCENES = {
  1: { sub: 'Scene 1: bedside (immersive beta)', heading: 'Scene 1: the bedside assessment', title: 'Scene 1: bedside assessment' },
  2: { sub: 'Scene 2: the call (immersive beta)', heading: 'Scene 2: the call', title: 'Scene 2: the call' },
};
let SPOT_LABELS = SPOT_SETS[1];
let baseCaption = 'Look around the room. Select objects to examine them.';
let movingTo = null; // spot id while a Go to move is under way

const view = $('#view'), ui = $('#ui');
const state = { scene: 1, phase: 'start', started: false, style: 'jump', keys: true, notes: [], active: null, world: null, playing: !reduced(), lastSpot: null, announceView: false };
const narrowMq = matchMedia('(max-width: 719px)');
const narrow = () => narrowMq.matches;

/* ---------- small helpers ---------- */

const live = $('#live');
function announce(msg) {
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 50);
}
const readPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; } };
const writePrefs = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify({ style: state.style, keys: state.keys })); } catch { /* storage may be blocked */ } };
const setTitle = (t) => { document.title = `${t} | ${TITLE}`; };
const smoothOn = () => state.style === 'smooth' && !reduced();

const tag = '<span class="tag">PLACEHOLDER</span>';
const sent = (t, say = '') => `<span data-sent${say ? ` data-say="${esc(say)}"` : ''}>${esc(t)}</span>`;

/* ---------- dialogs: the page behind is inert while one is open ---------- */

let modalReturn = null;
const openModals = () => $$('.modal').filter((m) => !m.hidden);
function showModal(el, returnTo) {
  modalReturn = returnTo || document.activeElement;
  el.scrollTop = 0;
  el.hidden = false;
  ui.inert = true; view.inert = true;
  el.querySelector('h2').focus();
  $('.sheet', el).scrollTop = 0;
}
function hideModal(el, focusTarget) {
  el.hidden = true;
  if (!openModals().length) { ui.inert = false; view.inert = false; }
  const t = focusTarget === undefined ? modalReturn : focusTarget; // null: do not move focus
  modalReturn = null;
  if (t && t.isConnected) t.focus();
}

/* ---------- settings (movement style and keys) ---------- */

function applySettings(from) {
  $$('input[name="style"], input[name="style2"]').forEach((r) => { r.checked = r.value === state.style; });
  $('#keys-start').checked = state.keys; $('#keys-help').checked = state.keys;
  writePrefs();
  const keyhint = $('#keyhint');
  if (!state.keys) keyhint.hidden = true;
  if (from) announce(from === 'keys' ? `Movement keys ${state.keys ? 'on' : 'off'}.` : `Movement style: ${state.style === 'smooth' ? 'smooth walking' : 'jump between spots'}.`);
}
for (const r of $$('input[name="style"], input[name="style2"]')) r.addEventListener('change', () => { state.style = r.value; applySettings('style'); });
for (const c of [$('#keys-start'), $('#keys-help')]) c.addEventListener('change', () => { state.keys = c.checked; applySettings('keys'); });
Object.assign(state, (({ style, keys }) => ({ style: style === 'smooth' ? 'smooth' : 'jump', keys: keys !== false }))(readPrefs()));
applySettings();

/* ---------- build the lists ---------- */

function buildGoto(n) {
  SPOT_LABELS = SPOT_SETS[n];
  state.lastSpot = null;
  $('#goto-list').innerHTML = Object.entries(SPOT_LABELS).map(([id, label]) => `<li><button type="button" class="btn" data-spot="${id}">${esc(label)}</button></li>`).join('');
}
buildGoto(1);
$('#objects-count').textContent = `(${ASSESS.length})`;
$('#objects-list').innerHTML = ASSESS.map((h) => `<li><button type="button" class="obtn" data-id="${h.id}" aria-controls="card"><span class="nm">${esc(h.label)}</span><span class="sr">, </span><span class="meta"></span></button></li>`).join('');
$('#hotspots').innerHTML = [...ASSESS, { id: 'phone', label: 'Phone' }].map((h) => `<button type="button" class="hs" data-id="${h.id}" data-show="false" tabindex="-1" aria-hidden="true"><span class="dot" aria-hidden="true"></span><span>${esc(h.label)}</span></button>`).join('');
const hsEl = Object.fromEntries($$('.hs').map((b) => [b.dataset.id, b]));
const obEl = Object.fromEntries($$('.obtn').map((b) => [b.dataset.id, b]));

/* ---------- Notes and findings ---------- */

function chartHtml() {
  const c = scenario.chart;
  return `<h3>Vital signs trend</h3>
    <table><caption class="sr">${esc(c.vitalsCaption)}</caption>
    <thead><tr><th scope="col">Time</th>${c.vitalsColumns.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead>
    <tbody>${c.vitals.map((r) => `<tr><th scope="row">${esc(r.time)}</th>${r.values.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <h3>Nursing notes</h3><ul>${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <h3>Current medications</h3><ul>${c.meds.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <h3>Labs</h3><ul>${c.labs.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
}
function notesHtml(speak = true) {
  if (!state.notes.length) return '<p class="empty">No notes yet. Examine an object and what you observe is added here.</p>';
  return `<ol>${state.notes.map((id) => {
    const h = byId[id];
    return `<li><strong>${speak ? sent(`${h.label}:`, `${h.label}.`) : `${esc(h.label)}:`}</strong> ${h.findings.map((t) => (speak ? sent(t) : esc(t))).join(' ')}</li>`;
  }).join('')}</ol>`;
}
function renderNotes() {
  $('#notes-list').innerHTML = notesHtml();
  $('#notes-count').textContent = `(${state.notes.length})`;
}
$('#all-findings').innerHTML = ASSESS.map((h) => `<h3>${esc(h.label)}</h3><ul>${h.findings.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${h.panel === 'chart' ? chartHtml() : ''}`).join('') + `<p class="hint">${tag}</p>`;
renderNotes();

const hasSpeech = speechSupported();
for (const b of [$('#card-read'), $('#notes-read')]) b.hidden = !hasSpeech;
$('#card-read').addEventListener('click', () => { if (!toggleReading($('#card-read'), '#card-body')) announce('Nothing to read yet.'); });
$('#notes-read').addEventListener('click', () => { if (!toggleReading($('#notes-read'), '#notes-list')) announce('Nothing to read yet.'); });

/* ---------- panels (Notes, Objects nearby, Go to menu) ---------- */

function setOpen(btn, body, open) {
  btn.setAttribute('aria-expanded', String(open));
  body.hidden = !open;
}
const panels = {
  notes: { btn: $('#notes-btn'), body: $('#notes-body') },
  objects: { btn: $('#objects-btn'), body: $('#objects-body') },
};
const openStack = []; // overlays that are not dialogs, most recent last: Escape closes the last one
const stackAdd = (k) => { const i = openStack.indexOf(k); if (i >= 0) openStack.splice(i, 1); openStack.push(k); };
const stackDel = (k) => { const i = openStack.indexOf(k); if (i >= 0) openStack.splice(i, 1); };
function openPanel(name, open) {
  const p = panels[name];
  if (open) stackAdd(name); else stackDel(name);
  if (open && narrow()) { // on a phone only one thing is open at a time, so the room stays visible
    for (const [k, q] of Object.entries(panels)) if (k !== name) setOpen(q.btn, q.body, false);
    closeGoto(); hideCard();
  }
  setOpen(p.btn, p.body, open);
  refreshLayout();
}
for (const [name, p] of Object.entries(panels)) p.btn.addEventListener('click', () => openPanel(name, p.btn.getAttribute('aria-expanded') !== 'true'));
$('#all-btn').addEventListener('click', () => {
  const open = $('#all-btn').getAttribute('aria-expanded') !== 'true';
  $('#all-btn').setAttribute('aria-expanded', String(open));
  $('#all-btn').textContent = open ? 'Hide all findings' : 'Show all findings';
  $('#all-findings').hidden = !open;
});
const gotoEl = $('#goto');
function closeGoto() { stackDel('goto'); gotoEl.dataset.open = 'false'; $('#goto-toggle').setAttribute('aria-expanded', 'false'); }
$('#goto-toggle').addEventListener('click', () => {
  const open = gotoEl.dataset.open !== 'true';
  if (open && narrow()) { for (const q of Object.values(panels)) setOpen(q.btn, q.body, false); hideCard(); }
  gotoEl.dataset.open = String(open);
  if (open) stackAdd('goto'); else stackDel('goto');
  $('#goto-toggle').setAttribute('aria-expanded', String(open));
  refreshLayout();
});

const card = $('#card');
// Turning a phone or narrowing the window: keep a single panel open so the room stays visible.
// The resize event backs up the media-query change event, which does not always fire.
let wasNarrow = narrow();
const onNarrowChange = () => { const n = narrow(); if (n && !wasNarrow) tidyForNarrow(); wasNarrow = n; };
narrowMq.addEventListener('change', onNarrowChange);
window.addEventListener('resize', onNarrowChange);
function tidyForNarrow() {
  let kept = !card.hidden;
  for (const q of Object.values(panels)) { if (q.body.hidden) continue; if (kept) setOpen(q.btn, q.body, false); else kept = true; }
  if (kept && gotoEl.dataset.open === 'true') closeGoto();
  refreshLayout();
}

/* ---------- the findings card ---------- */

function showCard(h) {
  stopReading();
  $('#card-title').textContent = h.label;
  $('#card-body').innerHTML = `<p class="hint" style="margin:0">${tag}</p><ul class="findings">${h.findings.map((t) => `<li>${sent(t)}</li>`).join('')}</ul>${h.panel === 'chart' ? chartHtml() : ''}`;
  $('#card-body').scrollTop = 0;
  card.hidden = false; stackAdd('card');
  refreshLayout();
}
function hideCard() { if (card.hidden) return; stopReading(); card.hidden = true; stackDel('card'); $('#caption').textContent = baseCaption; refreshLayout(); }
$('#card-close').addEventListener('click', () => {
  const id = state.active;
  hideCard();
  const t = (id && obEl[id] && obEl[id].offsetParent && obEl[id]) || $('#scene-heading');
  t.focus();
});
$('#card-title').tabIndex = -1;

/* ---------- examining ---------- */

function setActive(id) {
  state.active = id;
  for (const [k, b] of Object.entries(obEl)) { if (k === id) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }
  for (const [k, b] of Object.entries(hsEl)) b.classList.toggle('seen', state.notes.includes(k));
}
function examine(id, { fromList = false } = {}) {
  const h = byId[id];
  if (!h) return;
  const fresh = !state.notes.includes(id);
  if (fresh) state.notes.push(id);
  if (narrow()) { for (const q of Object.values(panels)) setOpen(q.btn, q.body, false); closeGoto(); }
  setActive(id);
  obEl[id].classList.add('seen');
  renderNotes();
  showCard(h);
  $('#caption').textContent = `Examining: ${h.label}. The findings are in the card.`;
  persistNotes();
  if (state.world) { fade(); state.world.examine(id, { smooth: smoothOn() }); }
  if (fromList && narrow()) $('#card-title').focus(); // the list closed on a phone, so focus moves to the card
  announce(`${h.label}: ${h.findings[0]} ${fresh ? 'Added to your notes.' : 'Already in your notes.'}`);
}
$('#objects-list').addEventListener('click', (e) => { const b = e.target.closest('.obtn'); if (b) examine(b.dataset.id, { fromList: true }); });
$('#hotspots').addEventListener('click', (e) => { const b = e.target.closest('.hs'); if (b) activate(b.dataset.id); });
// A marker or a click in the room: an object to examine (scene 1) or the phone (scene 2).
function activate(id) { if (id === 'phone') pickUp(); else if (state.scene === 1) examine(id); }

function persistNotes() { try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(state.notes)); } catch { /* storage may be blocked */ } }

/* ---------- movement buttons ---------- */

const fadeEl = $('#fade');
function fade() {
  if (reduced() || smoothOn()) return;
  fadeEl.classList.remove('go'); void fadeEl.offsetWidth; fadeEl.classList.add('go');
}
$('#goto-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-spot]');
  if (!b || !state.world) return;
  const id = b.dataset.spot;
  fade();
  state.world.goToSpot(id, { smooth: smoothOn() });
  $('#caption').textContent = `Moving to: ${SPOT_LABELS[id]}.`;
  movingTo = id;
  state.announceView = true;
  announce(`Moving to ${SPOT_LABELS[id]}.`);
  if (narrow()) { closeGoto(); $('#goto-toggle').focus(); refreshLayout(); }
});
const TURN = Math.PI / 12, LOOK = Math.PI / 18;
$$('[data-look]').forEach((b) => b.addEventListener('click', () => {
  const w = state.world; if (!w) return;
  const k = b.dataset.look;
  if (k === 'left') w.turn(TURN); else if (k === 'right') w.turn(-TURN); else if (k === 'up') w.look(LOOK); else w.look(-LOOK);
}));

/* ---------- keyboard: only while the 3D view has focus ---------- */

const held = new Map();
const pressedAt = new Map();
const MIN_HOLD = 180; // ms: a press shorter than this is a tap
let loopId = 0, lastT = 0;
function loop(now) {
  loopId = 0;
  if (!held.size || !state.world) { lastT = 0; if (state.world) state.world.setInteracting(false); setBusy(false); return; }
  const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
  const a = new Set(held.values());
  const f = (a.has('fwd') ? 1 : 0) - (a.has('back') ? 1 : 0), r = (a.has('right') ? 1 : 0) - (a.has('left') ? 1 : 0);
  const t = ((a.has('turnL') ? 1 : 0) - (a.has('turnR') ? 1 : 0)) * 1.4, l = ((a.has('lookU') ? 1 : 0) - (a.has('lookD') ? 1 : 0)) * 1.0;
  state.world.walk(dt, f, r, t, l);
  loopId = requestAnimationFrame(loop);
}
function keyAction(e) {
  const k = e.key.toLowerCase(), s = e.shiftKey;
  if (k === 'q' || (s && k === 'arrowleft')) return 'turnL';
  if (k === 'e' || (s && k === 'arrowright')) return 'turnR';
  if (s && k === 'arrowup') return 'lookU';
  if (s && k === 'arrowdown') return 'lookD';
  if (s) return null;
  if (k === 'arrowup' || k === 'w') return 'fwd';
  if (k === 'arrowdown' || k === 's') return 'back';
  if (k === 'arrowleft' || k === 'a') return 'left';
  if (k === 'arrowright' || k === 'd') return 'right';
  return null;
}
view.addEventListener('keydown', (e) => {
  if (e.target !== view) return;
  if (!state.started || !state.keys || !state.world || e.ctrlKey || e.altKey || e.metaKey) return;
  const act = keyAction(e);
  if (!act) return; // Tab and everything else keep their normal meaning (no keyboard trap)
  e.preventDefault();
  const w = state.world;
  if (smoothOn()) {
    held.set(e.key.toLowerCase(), act);
    if (!e.repeat) pressedAt.set(e.key.toLowerCase(), performance.now());
    if (!loopId) { w.setInteracting(true); setBusy(true); loopId = requestAnimationFrame(loop); }
    return;
  }
  if (act === 'fwd') w.step(0.75, 0); else if (act === 'back') w.step(-0.75, 0);
  else if (act === 'left') w.step(0, -0.6); else if (act === 'right') w.step(0, 0.6);
  else if (act === 'turnL') w.turn(TURN); else if (act === 'turnR') w.turn(-TURN);
  else if (act === 'lookU') w.look(LOOK); else if (act === 'lookD') w.look(-LOOK);
});
view.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase(), t0 = pressedAt.get(k), act = held.get(k);
  held.delete(k); pressedAt.delete(k);
  // A quick tap in smooth style still moves: a small fixed step, so it works at any frame rate.
  if (t0 === undefined || !act || !state.world || performance.now() - t0 >= MIN_HOLD) return;
  const w = state.world;
  if (act === 'fwd') w.step(0.3, 0); else if (act === 'back') w.step(-0.3, 0);
  else if (act === 'left') w.step(0, -0.25); else if (act === 'right') w.step(0, 0.25);
  else if (act === 'turnL') w.turn(TURN / 2); else if (act === 'turnR') w.turn(-TURN / 2);
  else if (act === 'lookU') w.look(LOOK / 2); else if (act === 'lookD') w.look(-LOOK / 2);
});
view.addEventListener('blur', () => { held.clear(); pressedAt.clear(); $('#keyhint').hidden = true; });
view.addEventListener('focus', () => { $('#keyhint').hidden = !(state.keys && state.started); });

/* ---------- pointer: drag to look, click an object to examine it ---------- */

let drag = null;
view.addEventListener('pointerdown', (e) => {
  if (!state.started || !state.world || e.button > 0 || e.target.closest('.hs')) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  try { view.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
view.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  if (!drag.moved) { drag.moved = true; view.classList.add('dragging'); state.world.setInteracting(true); setBusy(true); }
  drag.x = e.clientX; drag.y = e.clientY;
  state.world.drag(-dx * 0.0045, -dy * 0.0045);
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  view.classList.remove('dragging');
  if (d.moved) { state.world.setInteracting(false); setBusy(false); return; }
  if (e.type === 'pointerup' && state.world) { const id = state.world.pick(e.clientX, e.clientY); if (id) activate(id); }
};
view.addEventListener('pointerup', endDrag);
view.addEventListener('pointercancel', endDrag);

/* ---------- hotspots over the 3D, and the Objects nearby tags ---------- */

const hotLayer = $('#hotspots');
let lastPose = { moving: false };
let lastHot = [];
function setBusy(b) { hotLayer.classList.toggle('busy', b || lastPose.moving); }
const overlaySel = '.title, .top-btns, .strip, .card:not([hidden]), .panel, .goto, .looks, #ready, #pickup';
function layoutHotspots(list) {
  lastHot = list;
  for (const el of Object.values(hsEl)) el.dataset.show = 'false';
  const rects = $$(overlaySel).map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
  const vr = view.getBoundingClientRect();
  const vis = [];
  for (const it of list) {
    const el = hsEl[it.id];
    const w = el.offsetWidth || 120, h = el.offsetHeight || 44;
    el.dataset.show = 'false';
    it.w = w; it.h = h; it.show = false;
    if (it.visible) vis.push(it);
  }
  const placed = [];
  for (const it of vis.sort((a, b) => b.y - a.y)) {
    let y = it.y;
    for (let k = 0; k < 20; k++) {
      const hit = placed.find((o) => Math.abs(o.x - it.x) < (o.w + it.w) / 2 + 6 && Math.abs(o.y - y) < it.h + 6);
      if (!hit) break;
      y = hit.y - it.h - 6;
    }
    it.y = y; placed.push(it);
  }
  for (const it of vis) {
    const el = hsEl[it.id];
    const box = { l: vr.left + it.x - it.w / 2, r: vr.left + it.x + it.w / 2, t: vr.top + it.y - it.h - 10, b: vr.top + it.y - 10 };
    const covered = rects.some((r) => box.l < r.right && box.r > r.left && box.t < r.bottom && box.b > r.top);
    const inside = box.l >= vr.left && box.r <= vr.right && box.t >= vr.top && box.b <= vr.bottom;
    if (covered || !inside) continue; // stays reachable in Objects nearby
    el.style.setProperty('--x', `${it.x.toFixed(1)}px`); el.style.setProperty('--y', `${it.y.toFixed(1)}px`);
    el.dataset.show = 'true'; it.show = true;
  }
  for (const it of list) {
    if (!obEl[it.id]) continue;
    const m = $('.meta', obEl[it.id]);
    const parts = [it.show ? 'in view' : 'not in view'];
    if (state.notes.includes(it.id)) parts.push('examined');
    const t = parts.join(', ');
    if (m.textContent !== t) m.textContent = t;
  }
  if (state.announceView) {
    state.announceView = false;
    if (movingTo && card.hidden) $('#caption').textContent = `At: ${SPOT_LABELS[movingTo]}. ${baseCaption}`;
    movingTo = null;
    const names = list.filter((i) => i.show).map((i) => (byId[i.id] ? byId[i.id].label : 'Phone'));
    announce(names.length ? `In view: ${names.join(', ')}.` : 'No examinable objects in view from here.');
  }
}
function refreshLayout() { if (state.world) { if (lastHot.length) layoutHotspots(lastHot); state.world.refreshHotspots(); } }

function onPose(p) {
  lastPose = p;
  setBusy(false);
  if (p.spot !== state.lastSpot || !$('#goto-list [aria-current]') && p.spot) {
    state.lastSpot = p.spot;
    $$('#goto-list [data-spot]').forEach((b) => { if (b.dataset.spot === p.spot) b.setAttribute('aria-current', 'location'); else b.removeAttribute('aria-current'); });
  }
}

/* ---------- start, help, end ---------- */

const startBtn = $('#start-btn');
function begin() {
  if (startBtn.getAttribute('aria-disabled') === 'true') return;
  state.started = true;
  document.body.dataset.scene = '1'; document.body.dataset.phase = 'play'; state.phase = 'play';
  hideModal($('#start'), $('#scene-heading'));
  setTitle(SCENES[1].title);
  $('#scene-heading').focus();
  announce('Scene 1, the bedside assessment. You are at the doorway. Look around the room and select objects to examine them.');
}
startBtn.addEventListener('click', begin);

$('#help-open').addEventListener('click', (e) => showModal($('#help'), e.currentTarget));
$('#help-close').addEventListener('click', () => hideModal($('#help')));

function finish() {
  stopReading();
  persistNotes();
  held.clear();
  $('#end-notes').innerHTML = notesHtml(false);
  $('#end-none').hidden = state.notes.length > 0;
  document.body.dataset.phase = 'end'; state.phase = 'end';
  setTitle('Scene 1 complete');
  showModal($('#end'), $('#ready'));
  announce('Scene 1 complete.');
}
$('#ready').addEventListener('click', finish);
$('#end-back').addEventListener('click', () => { document.body.dataset.phase = 'play'; state.phase = 'play'; setTitle(SCENES[1].title); hideModal($('#end')); });
$('#end-continue').addEventListener('click', persistNotes);

// Escape closes the topmost overlay that is not an essential step, and returns focus to what opened it.
// Essential (no Escape): the start screen, the call, the feedback and the evidence of mastery.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#help').hidden) { e.preventDefault(); hideModal($('#help')); return; }
  if (!$('#end').hidden) { e.preventDefault(); $('#end-back').click(); return; }
  if (!$('#phone').hidden) { e.preventDefault(); call && call.putDown(); return; }
  if (openModals().length || !state.started) return;
  const top = openStack[openStack.length - 1];
  if (!top) return;
  e.preventDefault();
  if (top === 'card') $('#card-close').click();
  else if (top === 'goto') { closeGoto(); $('#goto-toggle').focus(); refreshLayout(); }
  else { openPanel(top, false); panels[top].btn.focus(); }
});

/* ---------- scene 2: the walk, the station and the phone ---------- */

const call = createCall({
  announce, showModal, hideModal, pickupBtn: $('#pickup'),
  notesHtml: () => notesHtml(false),
  onMastery: () => endScene(),
  onRestart: () => startOver(),
});
const lockBars = (on) => { for (const sel of ['.bl', '.br', '.right']) { const el = $(sel); el.inert = on; } };

function setSceneUi(n) {
  const sc = SCENES[n];
  state.scene = n;
  document.body.dataset.scene = String(n);
  $('#scene-sub').textContent = sc.sub;
  $('#scene-heading').textContent = sc.heading;
  $('.right').hidden = n === 2;
  $('#ready').hidden = n === 2; $('#pickup').hidden = n === 1;
  buildGoto(n);
}

function enterScene2() {
  const w = state.world;
  stopReading(); hideCard(); closeGoto();
  for (const q of Object.values(panels)) setOpen(q.btn, q.body, false);
  openStack.length = 0;
  hideModal($('#end'), null);
  setSceneUi(2);
  state.phase = 'walk'; document.body.dataset.phase = 'walk';
  setTitle(SCENES[2].title);
  $('#caption').textContent = "Walking to the nurses' station";
  announce("Scene 2, the call. Walking to the nurses' station.");
  $('#scene-heading').focus();
  w.setScene(2);
  lockBars(true);
  $('#skip-walk').hidden = false;
  w.goToSpot('station', { smooth: true, walk: true });
  state.announceView = false;
  w.whenIdle().then(arrivedAtStation);
}
function arrivedAtStation() {
  if (state.phase !== 'walk') return;
  state.phase = 'station'; document.body.dataset.phase = 'station';
  lockBars(false);
  $('#skip-walk').hidden = true;
  baseCaption = "You are at the nurses' station. The phone is on the desk. Pick up the phone when you are ready to call.";
  $('#caption').textContent = baseCaption;
  announce("You are at the nurses' station. The phone is on the desk. Pick up the phone when you are ready.");
  if (document.activeElement === $('#skip-walk') || document.activeElement === document.body) $('#scene-heading').focus();
}
$('#skip-walk').addEventListener('click', () => { if (state.world) { state.world.finishMove(); state.world.finishFigure(); } });
$('#end-walk').addEventListener('click', enterScene2);

function pickUp() {
  if (state.scene !== 2 || state.phase !== 'station' && state.phase !== 'phone') return;
  const w = state.world;
  state.phase = 'phone'; document.body.dataset.phase = 'phone';
  if (w && w.spot !== 'phone') { fade(); w.goToSpot('phone', { smooth: false }); }
  call.openPhone();
}
$('#pickup').addEventListener('click', pickUp);

async function endScene() {
  const w = state.world;
  state.phase = 'return'; document.body.dataset.phase = 'return';
  const anim = !reduced();
  $('#caption').textContent = 'The provider is on their way. Heading back to Room 12.';
  announce('The provider is on their way. Heading back to Room 12.');
  lockBars(true);
  $('#skip-walk').hidden = false; $('#skip-walk').focus();
  w.hideProvider();
  w.returnToRoom({ smooth: anim });
  await w.whenIdle();
  $('#caption').textContent = 'The provider is arriving at the door of Room 12.';
  const arrived = w.providerArrives({ smooth: anim });
  await arrived;
  $('#skip-walk').hidden = true;
  $('#caption').textContent = 'The provider is at the door of Room 12.';
  lockBars(false);
  call.openMastery();
}

function startOver() {
  const w = state.world;
  state.notes = []; persistNotes(); renderNotes(); setActive(null);
  for (const b of Object.values(obEl)) b.classList.remove('seen');
  w.hideProvider(); w.setScene(1);
  setSceneUi(1);
  state.phase = 'play'; document.body.dataset.phase = 'play';
  setTitle(SCENES[1].title);
  baseCaption = 'Look around the room. Select objects to examine them.';
  $('#caption').textContent = baseCaption;
  fade(); w.goToSpot('doorway', { smooth: false });
  $('#scene-heading').focus();
  announce('Starting over. Scene 1, the bedside assessment. You are at the doorway.');
}

/* ---------- motion and animation ---------- */

const animBtn = $('#anim-toggle');
function syncAnim() { animBtn.textContent = state.playing ? 'Pause animation' : 'Play animation'; }
animBtn.addEventListener('click', () => {
  state.playing = !state.playing;
  if (state.world) state.world.setPlaying(state.playing);
  syncAnim();
});
initMotion();
syncAnim();
onMotionChange((r) => {
  state.playing = !r;
  if (state.world) { state.world.setInstant(r); state.world.setPlaying(state.playing); }
  syncAnim();
});

/* ---------- WebGL check and loading the room ---------- */

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
function noWebgl() {
  document.body.dataset.scene = 'nogl';
  $('#start').hidden = true;
  setTitle('3D not available');
  showModal($('#nogl'), null);
  announce('The 3D room is not available on this device. Open the standard version instead.');
}

if (!webglOk()) {
  noWebgl();
} else {
  showModal($('#start'), null);
  setTitle('Start');
  document.body.dataset.scene = 'start';
  startBtn.setAttribute('aria-disabled', 'true');
  $('#start-status').textContent = 'Preparing the room…';
  // Let the start screen paint first; building the room can take a moment on slow graphics.
  setTimeout(async () => {
    try {
      const m = await import('./world1.js');
      state.world = m.createWorld({
        host: view, chart: scenario.chart, hotspots: ASSESS, playing: state.playing, instant: reduced(),
        onPose, onHotspots: layoutHotspots,
        onLost: () => { document.body.dataset.scene = 'nogl'; $('#start').hidden = true; $('#help').hidden = true; $('#end').hidden = true; noWebgl(); },
      });
      startBtn.removeAttribute('aria-disabled');
      $('#start-status').textContent = 'The room is ready.';
      document.body.dataset.world = 'ready';
    } catch (err) {
      console.error(err);
      noWebgl();
    }
  }, 60);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stopReading(); });
window.addEventListener('pagehide', stopReading);
