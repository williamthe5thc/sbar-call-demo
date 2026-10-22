// Immersive scene 2, the call: the phone overlay (provider card and SBAR notepad), the call itself
// as captions in a transcript, the feedback overlay and the evidence of mastery. Everything is HTML;
// the 3D world only shows the nurses' station and the provider arriving (see world1.js, station.js).
// Scoring is the shared scoring.js, so the same selections give the same result as the standard version.
import { scenario } from './scenario.js';
import { score, byId, secName, emptySelection } from './scoring.js';
import { MOODS, moodFor } from './illustrations.js';
import { peopleDefs, bust } from './people.js';
import { supported as speechSupported, toggleReading, stopReading } from './readaloud.js';
import { reduced, onMotionChange } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Caption pace: about 330 ms per word plus a short base, never faster than 250 ms per word.
export const MS_PER_WORD = 330, BASE_MS = 900, MIN_MS = 1600;
export const captionMs = (text) => Math.max(MIN_MS, BASE_MS + text.trim().split(/\s+/).length * MS_PER_WORD);

/* ---------- the provider's portrait: the semi-realistic provider from people.js, in a call card ---------- */

const qmark = (x, y, size, rot) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" transform="rotate(${rot} ${x} ${y})" fill="#ffc857" stroke="#08101f" stroke-width="3" paint-order="stroke">?</text>`;

export function providerPortrait(mood) {
  const p = 'pc';
  const extras = {
    calm: '',
    unsure: qmark(80, -20, 34, 8),
    confused: `${qmark(78, -22, 34, 10)}${qmark(100, 20, 24, -8)}<path d="M-88 -10 q6 10 0 15 q-6 -5 0 -15z" fill="#bfe6f6" stroke="#4a86b0" stroke-width="1"/>`,
  };
  return `<svg viewBox="-110 -62 220 214" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" data-provider-mood="${mood}">
    <defs>${peopleDefs(p, ['doctor'])}
      <linearGradient id="${p}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14263f"/><stop offset=".55" stop-color="#2b2a38"/><stop offset="1" stop-color="#4a3a36"/></linearGradient>
      <radialGradient id="${p}-lamp" cx=".9" cy=".25" r=".7"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
    </defs>
    <rect x="-110" y="-62" width="220" height="214" fill="url(#${p}-bg)"/>
    <rect x="-110" y="-62" width="220" height="214" fill="url(#${p}-lamp)"/>
    ${bust({ p, skin: 'doctor', hair: 'short', mood, garment: 'coat', side: -1, x: 8, y: 6, s: 1, glasses: true, gray: true, sweat: mood === 'confused', tilt: mood === 'unsure' ? -3 : 0 })}
    ${extras[mood]}
    <rect x="-110" y="-62" width="220" height="214" fill="url(#${p}-vig)"/>
  </svg>`;
}

/* ---------- markup shared by the overlays ---------- */

const sent = (t, say = '') => `<span data-sent${say ? ` data-say="${esc(say)}"` : ''}>${esc(t)}</span>`;
const tag = '<span class="tag">PLACEHOLDER</span>';

function chartHtml() {
  const c = scenario.chart;
  return `<p><strong>${esc(c.patient)}</strong></p>
    <div class="scroll tbl" tabindex="0" role="region" aria-label="Vital signs table, scrolls sideways on small screens"><table>
      <caption>${esc(c.vitalsCaption)}</caption>
      <thead><tr><th scope="col">Time</th>${c.vitalsColumns.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead>
      <tbody>${c.vitals.map((r) => `<tr><th scope="row">${esc(r.time)}</th>${r.values.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <h4>Nursing notes</h4><ul>${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <h4>Current medications</h4><ul>${c.meds.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
    <h4>Labs</h4><ul>${c.labs.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
}

const optionsHtml = (sec, sel) => sec.statements.map((s) => {
  const checked = sel[sec.key].includes(s.id) ? ' checked' : '';
  return `<div class="opt"><input type="checkbox" id="cb-${s.id}" value="${s.id}" data-sec="${sec.key}"${checked}><label for="cb-${s.id}" data-sent>${esc(s.text)}</label></div>`;
}).join('');

function pickedHtml(sec, sel) {
  const ids = sel[sec.key];
  if (!ids.length) return '<p class="empty">Nothing selected yet.</p>';
  return `<ol aria-labelledby="pt-${sec.key}">${ids.map((id, i) => {
    const t = esc(byId[id].text);
    return `<li>${t}<div class="btns">
      <button type="button" class="btn sm" data-act="up" data-id="${id}" aria-label="Move up: ${t}"${i === 0 ? ' aria-disabled="true"' : ''}>Move up</button>
      <button type="button" class="btn sm" data-act="down" data-id="${id}" aria-label="Move down: ${t}"${i === ids.length - 1 ? ' aria-disabled="true"' : ''}>Move down</button>
    </div></li>`;
  }).join('')}</ol>`;
}

const scriptHtml = (sel) => scenario.sections.map((sec) => {
  const text = sel[sec.key].map((id) => byId[id].text).join(' ');
  return `<p><strong>${sec.name}:</strong> ${esc(text) || '<em>(nothing selected)</em>'}</p>`;
}).join('');

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ---------- the controller ---------- */

// deps: { announce, showModal, hideModal, getNotes, notesHtml, world, onMastery(), onRestart(), pickupBtn }
export function createCall(deps) {
  const { announce, showModal, hideModal } = deps;
  const M = { phone: $('#phone'), call: $('#call'), fb: $('#feedback'), ms: $('#mastery') };
  const st = {
    sel: emptySelection(), attempts: [], last: null, mood: 'calm', open: false,
    lines: [], i: -1, paused: false, done: false, voice: false, elapsed: 0, timerDone: false, speechDone: true,
    tm: 0, tick: 0, spTm: 0, utter: null, readIdx: -1,
  };
  const card = document.createElement('div');
  card.id = 'callcard'; card.className = 'callcard';
  card.innerHTML = `<div class="portrait" id="portrait"></div>
    <div class="callinfo"><p class="who">On-call provider</p>
    <p class="moodline" id="call-mood"></p>
    <p class="timer" id="call-timer" aria-hidden="true">0:00</p></div>`;
  const hasSpeech = speechSupported();

  function setMood(mood, text) {
    st.mood = mood;
    $('#portrait', card).innerHTML = providerPortrait(mood);
    card.dataset.providerMood = mood;
    $('#call-mood', card).textContent = text;
  }
  const slot = (id) => { $(id).appendChild(card); };
  const resetCard = () => { setMood('calm', 'The provider is waiting for your call.'); st.elapsed = 0; $('#call-timer', card).textContent = '0:00'; };
  resetCard();

  /* ---- the notepad ---- */

  function renderPad() {
    const pad = $('#call-form');
    pad.querySelector('.sections').innerHTML = scenario.sections.map((sec) => `
      <fieldset id="fs-${sec.key}">
        <legend>${sec.name}</legend>
        <p class="hint" data-sent data-say="${esc(`${sec.name}. ${sec.prompt}`)}">${esc(sec.prompt)}</p>
        <div class="tools"><button type="button" class="btn sm read-btn" data-read="#fs-${sec.key}" ${hasSpeech ? '' : 'hidden'}><span class="rl">Read aloud</span></button></div>
        ${optionsHtml(sec, st.sel)}
        <div class="picked"><h3 id="pt-${sec.key}">Your ${sec.name} statements, in order</h3><div id="picked-${sec.key}">${pickedHtml(sec, st.sel)}</div></div>
      </fieldset>`).join('');
    $('#ref-notes-body').innerHTML = deps.notesHtml();
    $('#ref-chart-body').innerHTML = chartHtml();
  }
  const renderPicked = (key) => { $(`#picked-${key}`).innerHTML = pickedHtml(scenario.sections.find((s) => s.key === key), st.sel); };

  function openPhone() {
    if (st.open) return;
    st.open = true;
    renderPad();
    slot('#phone-card-slot');
    resetCard();
    showModal(M.phone, deps.pickupBtn);
    announce('Phone. Build your SBAR call. The provider is waiting.');
  }
  function putDown() {
    stopReading(); st.open = false;
    hideModal(M.phone); // focus goes back to "Pick up the phone"
    announce('You put the phone down. Your selections are kept.');
  }
  $('#phone-down').addEventListener('click', putDown);

  const phoneEl = M.phone;
  phoneEl.addEventListener('click', (e) => {
    const rb = e.target.closest('[data-read]');
    if (rb) { if (!toggleReading(rb, rb.dataset.read)) announce('Nothing to read yet.'); return; }
    const btn = e.target.closest('button[data-act]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
    const id = btn.dataset.id, key = byId[id].shownIn, list = st.sel[key];
    const i = list.indexOf(id), j = btn.dataset.act === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    renderPicked(key);
    $(`#picked-${key} button[data-act="${btn.dataset.act}"][data-id="${id}"]`).focus(); // the buttons were re-drawn
    announce(`Moved ${btn.dataset.act}. Now position ${j + 1} of ${list.length} in ${secName(key)}.`);
  });
  phoneEl.addEventListener('change', (e) => {
    const cb = e.target;
    if (cb.type !== 'checkbox' || !cb.dataset.sec) return;
    const list = st.sel[cb.dataset.sec];
    if (cb.checked) list.push(cb.value); else list.splice(list.indexOf(cb.value), 1);
    renderPicked(cb.dataset.sec);
    announce(`${cb.checked ? 'Added to' : 'Removed from'} ${secName(cb.dataset.sec)}. ${list.length} selected.`);
  });
  $('#ref-notes-read').hidden = !hasSpeech;
  $('#ref-notes-read').addEventListener('click', () => { if (!toggleReading($('#ref-notes-read'), '#ref-notes-body')) announce('Nothing to read yet.'); });

  /* ---- the call: captions in a transcript ---- */

  const controls = { pause: $('#cap-pause'), next: $('#cap-next'), all: $('#cap-all'), voice: $('#cap-voice'), see: $('#cap-see') };
  const txList = $('#tx-list');
  const clearTimers = () => { clearTimeout(st.tm); clearTimeout(st.spTm); clearInterval(st.tick); st.tm = st.spTm = st.tick = 0; };
  const cancelSpeech = () => { if (hasSpeech) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } } st.utter = null; $$('.speaking', txList).forEach((el) => el.classList.remove('speaking')); };

  function buildLines() {
    const lines = [];
    for (const sec of scenario.sections) {
      st.sel[sec.key].forEach((id, k) => lines.push({ who: 'You', section: k === 0 ? sec.name : '', text: byId[id].text, mood: null }));
    }
    if (!lines.length) lines.push({ who: 'You', section: '', text: '(You did not say anything useful: nothing was selected.)', mood: null, silent: true });
    const r = st.last, mood = moodFor(r.metCount);
    lines.push({ who: 'Provider', section: '', text: r.reply, mood });
    return lines;
  }
  const lineHtml = (ln, i) => {
    const who = ln.who === 'You' ? (ln.section ? `You (${ln.section}):` : 'You:') : 'Provider:';
    return `<li class="line ${ln.who === 'You' ? 'you' : 'provider'}" data-i="${i}"><strong class="who">${who}</strong> ${sent(ln.text, `${ln.who === 'You' ? 'You' : 'Provider'}. ${ln.text}`)}</li>`;
  };

  function syncControls() {
    const done = st.done, rm = reduced();
    controls.pause.hidden = done || rm; controls.next.hidden = done || rm; controls.all.hidden = done || rm;
    controls.see.hidden = !done;
    controls.pause.textContent = st.paused ? 'Resume captions' : 'Pause captions';
    controls.voice.hidden = !hasSpeech;
    controls.voice.textContent = `Voice: ${st.voice ? 'on' : 'off'}`;
    controls.voice.setAttribute('aria-describedby', 'voice-note');
    $('#tx-status').textContent = done ? 'The call has ended. The whole transcript is above.' : rm ? '' : `Caption ${Math.max(st.i + 1, 1)} of ${st.lines.length}${st.paused ? ' (paused)' : ''}`;
  }

  function speak(i, then) {
    if (!hasSpeech || !st.voice) { then && then(); return; }
    const ln = st.lines[i];
    cancelSpeech();
    const u = new window.SpeechSynthesisUtterance(`${ln.who === 'You' ? 'Nurse' : 'Provider'}. ${ln.text}`);
    u.lang = document.documentElement.lang || 'en';
    u.pitch = ln.who === 'You' ? 1.05 : 0.8;
    const el = $(`.line[data-i="${i}"] [data-sent]`, txList);
    let ended = false;
    const end = () => { if (ended) return; ended = true; clearTimeout(st.spTm); if (el) el.classList.remove('speaking'); then && then(); };
    u.onstart = () => { if (el) el.classList.add('speaking'); };
    u.onend = end; u.onerror = end;
    st.utter = u;
    st.spTm = setTimeout(end, captionMs(ln.text) * 2 + 2000); // never wait for speech that does not finish
    try { window.speechSynthesis.speak(u); } catch { end(); }
  }

  function reveal(i, quiet = false) {
    const ln = st.lines[i];
    st.i = i;
    txList.insertAdjacentHTML('beforeend', lineHtml(ln, i));
    $$('.line.current', txList).forEach((el) => el.classList.remove('current'));
    const li = $(`.line[data-i="${i}"]`, txList); li.classList.add('current');
    const tx = $('#tx'); tx.scrollTop = tx.scrollHeight;
    if (ln.mood) {
      setMood(ln.mood, MOODS[ln.mood].text);
      if (!quiet) announce(`Provider replied: ${ln.text} ${MOODS[ln.mood].text}`);
    }
    syncControls();
  }
  function afterShown() {
    // Called once a caption is on screen: speak it (if the voice is on) and schedule the next one.
    if (st.paused || st.done) return;
    const i = st.i, ln = st.lines[i];
    st.timerDone = false; st.speechDone = !(hasSpeech && st.voice);
    const tryAdvance = () => { if (st.timerDone && st.speechDone && !st.paused) advance(); };
    st.tm = setTimeout(() => { st.timerDone = true; tryAdvance(); }, captionMs(ln.text));
    if (!st.speechDone) speak(i, () => { st.speechDone = true; tryAdvance(); });
  }
  function advance() {
    clearTimeout(st.tm); cancelSpeech();
    if (st.i >= st.lines.length - 1) { finish(); return; }
    reveal(st.i + 1);
    afterShown();
  }
  function finish() {
    clearTimers(); cancelSpeech();
    st.done = true; st.paused = false;
    $$('.line.current', txList).forEach((el) => el.classList.remove('current'));
    syncControls();
  }
  function startTick() {
    clearInterval(st.tick);
    if (reduced()) return;
    st.tick = setInterval(() => { if (st.paused || st.done) return; st.elapsed += 1; $('#call-timer', card).textContent = fmtTime(st.elapsed); }, 1000);
  }
  function showAll(prefix = '') {
    clearTimeout(st.tm); cancelSpeech();
    while (st.i < st.lines.length - 1) reveal(st.i + 1, true);
    finish();
    const last = st.lines[st.lines.length - 1];
    announce(`${prefix}Provider replied: ${last.text} ${MOODS[last.mood].text} The call has ended. Use See feedback.`);
  }

  function startCall() {
    stopReading();
    st.last = score(st.sel);
    st.attempts.push({ n: st.attempts.length + 1, met: st.last.results.filter((r) => r.met).map((r) => r.id) });
    st.lines = buildLines(); st.i = -1; st.done = false; st.paused = false; st.elapsed = 0;
    txList.innerHTML = ''; $('#tx').scrollTop = 0;
    resetCard(); setMood('calm', 'The provider is listening.');
    slot('#call-card-slot');
    hideModal(M.phone, null);
    showModal(M.call, deps.pickupBtn);
    document.body.dataset.phase = 'call';
    announce(`Call started. Attempt ${st.attempts.length}. Captions are playing. Use Pause captions, Next caption or Show all.`);
    syncControls();
    if (reduced()) { showAll(`Call started, attempt ${st.attempts.length}. The captions are all shown at once. `); return; } // reduced motion: every caption at once
    reveal(0); startTick(); afterShown();
  }
  $('#call-form').addEventListener('submit', (e) => { e.preventDefault(); startCall(); });

  controls.pause.addEventListener('click', () => {
    if (st.done) return;
    st.paused = !st.paused;
    if (st.paused) { clearTimeout(st.tm); cancelSpeech(); announce('Captions paused.'); }
    else { announce('Captions resumed.'); afterShown(); }
    syncControls();
  });
  controls.next.addEventListener('click', () => { if (!st.done) advance(); }); // stays paused if it was paused
  controls.all.addEventListener('click', () => { if (!st.done) showAll(); });
  controls.voice.addEventListener('click', () => {
    st.voice = !st.voice;
    if (!st.voice) { cancelSpeech(); st.speechDone = true; announce('Voice off.'); } else announce('Voice on. The call is read aloud as the captions appear.');
    syncControls();
    if (st.voice && !st.done && !st.paused && st.i >= 0) { st.timerDone = false; afterShown(); }
    else if (st.voice && (st.done || reduced())) readAll(); // all captions are already shown: read the transcript from the top
  });
  // Reading a transcript that is already fully shown (reduced motion, or after the call): line by line.
  function readAll(from = 0) {
    st.readIdx = from;
    const step = () => {
      if (!st.voice || st.readIdx >= st.lines.length || st.readIdx < 0) { st.readIdx = -1; return; }
      const i = st.readIdx++; speak(i, step);
    };
    step();
  }
  onMotionChange((r) => { if (r && !M.call.hidden && !st.done) showAll(); });

  /* ---- feedback ---- */

  function criteriaHtml(r) {
    const names = Object.fromEntries(scenario.criteria.map((c) => [c.id, c]));
    return r.results.map((c) => {
      const def = names[c.id];
      const tips = c.met ? [def.metTip] : c.tips;
      return `<li><h4>${esc(def.name)} <span class="badge ${c.met ? 'met' : 'notyet'}"><span aria-hidden="true">${c.met ? '✓' : '✗'}</span> ${c.met ? 'Met' : 'Not yet'}</span></h4>
        <p class="hint">${esc(def.description)}</p>${tips.map((t) => `<p>${esc(t)}</p>`).join('')}</li>`;
    }).join('');
  }
  function showFeedback() {
    cancelSpeech(); clearTimers();
    const r = st.last, allMet = r.metCount === 4, mood = moodFor(r.metCount);
    $('#fb-attempt').textContent = `Attempt ${st.attempts.length}: ${r.metCount} of 4 criteria met.`;
    $('#fb-reply').innerHTML = `<p><strong>${esc(MOODS[mood].text)}</strong></p><p class="bubble">${esc(r.reply)}</p>`;
    $('#fb-list').innerHTML = criteriaHtml(r);
    $('#fb-retry').hidden = allMet; $('#fb-continue').hidden = !allMet;
    slot('#fb-card-slot');
    hideModal(M.call, null);
    showModal(M.fb, deps.pickupBtn);
    document.body.dataset.phase = 'feedback';
    announce(`Feedback. Attempt ${st.attempts.length}: ${r.metCount} of 4 criteria met. ${allMet ? 'All four are met.' : 'Read the hints, then hang up and try again.'}`);
  }
  controls.see.addEventListener('click', showFeedback);

  $('#fb-retry').addEventListener('click', () => {
    hideModal(M.fb, null);
    st.open = false;
    document.body.dataset.phase = 'phone';
    st.open = true; renderPad(); slot('#phone-card-slot'); resetCard();
    showModal(M.phone, deps.pickupBtn);
    announce('You hung up. Your selections are kept. Change your call and try again.');
  });
  $('#fb-continue').addEventListener('click', () => { hideModal(M.fb, null); st.open = false; deps.onMastery(); });

  /* ---- mastery ---- */

  function openMastery() {
    $('#ms-history').innerHTML = st.attempts.map((a) => `<tr><th scope="row">${a.n}</th><td>${a.met.length} of 4: ${a.met.length ? a.met.map((id) => scenario.criteria.find((c) => c.id === id).name).join(', ') : 'none'}</td></tr>`).join('');
    $('#ms-script').innerHTML = scriptHtml(st.sel);
    $('#reflection').value = '';
    showModal(M.ms, null);
    document.body.dataset.phase = 'mastery';
    announce('Evidence of mastery. All four criteria are met. The provider has arrived at the door of Room 12.');
  }
  $('#ms-restart').addEventListener('click', () => {
    stopReading();
    st.sel = emptySelection(); st.attempts = []; st.last = null; st.open = false;
    hideModal(M.ms, null);
    deps.onRestart();
  });

  // Escape on the phone overlay puts the phone down; the call and feedback are essential steps.
  const putDownIfOpen = () => { if (!M.phone.hidden) { putDown(); return true; } return false; };

  return { openPhone, putDown: putDownIfOpen, openMastery, state: st, stopAll() { clearTimers(); cancelSpeech(); stopReading(); } };
}
