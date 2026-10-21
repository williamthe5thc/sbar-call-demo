// App logic: state, rendering, scoring, focus and attempt history.
// No clinical content here; it all comes from scenario.js.
import { scenario } from './scenario.js';
import { introScene, monitorFigure, nurseStationScene, providerScene, sunriseScene, assessSvg, MOODS, moodFor } from './illustrations.js';
import { supported as speechSupported, toggleReading, stopReading } from './readaloud.js';

const app = document.getElementById('app');
const live = document.getElementById('live');

// State lives in memory only. Nothing is stored or sent anywhere.
const state = {
  selected: { S: [], B: [], A: [], R: [] }, // ordered statement ids per section
  attempts: [], // { n, met: [criterion ids] }
  last: null, // result of the latest submission
  notes: [], // assessment hotspot ids the learner has opened, in order
  active: null, // the hotspot whose findings are showing
};
const hotspotById = Object.fromEntries(scenario.assessment.map((h) => [h.id, h]));

// Look-up table: id -> statement, remembering which section it is shown in.
const byId = {};
for (const sec of scenario.sections) {
  for (const s of sec.statements) byId[s.id] = { ...s, shownIn: sec.key };
}
const secName = (key) => scenario.sections.find((s) => s.key === key).name;
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Scoring: deterministic rules, no randomness ---------- */

function score(sel) {
  const chosen = (key) => sel[key].map((id) => byId[id]);
  const total = Object.values(sel).reduce((n, ids) => n + ids.length, 0);
  const C = Object.fromEntries(scenario.criteria.map((c) => [c.id, c]));
  const results = [];

  // Organization: every section has something, nothing is in the wrong section,
  // and the opening line (the statement marked `lead`) comes first.
  const orgTips = [];
  for (const sec of scenario.sections) {
    const items = chosen(sec.key);
    if (!items.length) orgTips.push(fill(C.organization.emptySectionTip, { section: sec.name }));
    for (const s of items) {
      if (s.belongsIn) orgTips.push(fill(C.organization.misplacedTip, { text: s.text, section: secName(s.belongsIn) }));
    }
    const lead = items.find((s) => s.lead);
    if (lead && items[0] !== lead) orgTips.push(fill(C.organization.orderTip, { section: sec.name, first: lead.text }));
  }
  results.push(total === 0
    ? { id: 'organization', met: false, tips: [C.organization.emptyTip] }
    : { id: 'organization', met: orgTips.length === 0, tips: orgTips });

  // Completeness: every required statement is selected.
  const missing = [];
  for (const sec of scenario.sections) {
    for (const s of sec.statements) {
      if (s.kind === 'required' && !sel[sec.key].includes(s.id)) {
        missing.push(fill(C.completeness.missingTip, { section: sec.name, hint: s.hint }));
      }
    }
  }
  results.push({ id: 'completeness', met: missing.length === 0, tips: missing });

  // Prioritization: no irrelevant distractors. (Misplaced real content is an Organization issue.)
  const noise = Object.keys(sel).flatMap(chosen).filter((s) => s.kind === 'distractor' && !s.belongsIn);
  results.push(total === 0
    ? { id: 'prioritization', met: false, tips: [C.prioritization.emptyTip] }
    : { id: 'prioritization', met: noise.length === 0, tips: noise.map((s) => fill(C.prioritization.distractorTip, { text: s.text, why: s.why })) });

  // Clear request: Recommendation has a specific request AND a time frame.
  const rec = chosen('R');
  const reqTips = [];
  if (!rec.some((s) => s.request)) reqTips.push(C.request.noRequestTip);
  if (!rec.some((s) => s.timeFrame)) reqTips.push(C.request.noTimeTip);
  results.push({ id: 'request', met: reqTips.length === 0, tips: reqTips });

  const metCount = results.filter((r) => r.met).length;
  // Provider reply branches on how many criteria were met.
  let reply;
  if (metCount === 4) reply = scenario.replies.success;
  else if (metCount >= 2) reply = scenario.replies.clarify[results.find((r) => !r.met).id]; // first unmet
  else reply = scenario.replies.confused;
  return { results, metCount, reply };
}

/* ---------- Rendering helpers ---------- */

function announce(msg) {
  // Clear first so repeating the same message is still read out.
  live.textContent = '';
  setTimeout(() => { live.textContent = msg; }, 50);
}

// Each step swaps the whole view, updates the page title, and moves focus to the
// step's heading so keyboard and screen reader users know the page changed.
function go(title, html, { focus = true, wide = false } = {}) {
  stopReading(); // speech never carries over to another step
  document.getElementById('main').classList.toggle('wide', wide);
  app.innerHTML = html;
  document.title = `${title} | The 2 a.m. Call`;
  if (focus) app.querySelector('[data-step-heading]').focus();
  else window.scrollTo(0, 0);
}

const tag = '<span class="tag">PLACEHOLDER</span>';

function chartHtml(level = 3) {
  const c = scenario.chart;
  const h = `h${level}`;
  return `
    <p><strong>${esc(c.patient)}</strong></p>
    <div class="table-wrap" role="region" aria-label="Vital signs table, scrolls sideways on small screens" tabindex="0">
      <table>
        <caption>${esc(c.vitalsCaption)} ${tag}</caption>
        <thead><tr><th scope="col">Time</th>${c.vitalsColumns.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${c.vitals.map((r) => `<tr><th scope="row">${esc(r.time)}${tag}</th>${r.values.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <${h}>Nursing notes</${h}>
    <ul>${c.notes.map((n) => `<li>${esc(n)}${tag}</li>`).join('')}</ul>
    <${h}>Current medications</${h}>
    <ul>${c.meds.map((n) => `<li>${esc(n)}${tag}</li>`).join('')}</ul>
    <${h}>Labs</${h}>
    <ul>${c.labs.map((n) => `<li>${esc(n)}${tag}</li>`).join('')}</ul>`;
}

/* ---------- Steps ---------- */

function showIntro() {
  go('Welcome', `
    <h2 tabindex="-1" data-step-heading>Welcome</h2>
    ${introScene(scenario.chart)}
    <p class="label">${esc(scenario.label)}</p>
    <h3>The skill this practices</h3>
    <p>${esc(scenario.competency)}</p>
    <h3>Why practice this</h3>
    <p>${esc(scenario.rationale)}</p>
    <h3>How it works</h3>
    <ol>
      <li>Examine a fictional patient at the bedside: select objects in the scene to see what you observe.</li>
      <li>Build your SBAR call: choose statements for each section and put them in order.</li>
      <li>Get feedback on four criteria: Organization, Completeness, Prioritization and Clear request.</li>
      <li>Try again until all four are met. There is no time limit and no grade.</li>
    </ol>
    <div class="btn-row"><button type="button" class="btn" data-act="start">Start</button></div>`, { focus: false });
  // Don't steal focus on first load: the skip link and page start should come first.
  document.title = 'The 2 a.m. Call | SBAR practice';
}

/* ---------- Read aloud and sentence markup ---------- */

const sent = (t, say = '') => `<span data-sent${say ? ` data-say="${esc(say)}"` : ''}>${esc(t)}</span>`;
const readBtn = (target, extra = '') => (speechSupported()
  ? `<button type="button" class="small-btn read-btn" data-act="read" data-target="${target}"${extra}><span class="rl">Read aloud</span></button>`
  : '');

/* ---------- Assess the patient ---------- */

function notesListHtml() {
  if (!state.notes.length) return '<p class="empty">No notes yet. Select an object in the scene and what you observe is added here.</p>';
  return `<ol class="notes">${state.notes.map((id) => {
    const h = hotspotById[id];
    return `<li><strong>${sent(`${h.label}:`, `${h.label}.`)}</strong> ${h.findings.map((t) => sent(t)).join(' ')}</li>`;
  }).join('')}</ol>`;
}

function panelHtml(h) {
  return `
    <h3 id="panel-title">${esc(h.label)}</h3>
    <p class="ph-line">${tag}</p>
    ${h.panel === 'monitor' ? monitorFigure(scenario.chart, tag) : ''}
    <ul class="findings">${h.findings.map((t) => `<li>${sent(t)}</li>`).join('')}</ul>
    <div class="panel-tools">${readBtn('#finding-panel .findings')}</div>
    ${h.panel === 'chart' ? chartHtml(4) : ''}`;
}

const emptyPanelHtml = `
  <h3 id="panel-title">Findings</h3>
  <p class="empty">Select an object in the scene. What you observe appears here.</p>`;

function allFindingsHtml() {
  return scenario.assessment.map((h) => `
    <h4>${esc(h.label)}</h4>
    <ul>${h.findings.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    ${h.panel === 'chart' ? chartHtml(5) : ''}`).join('');
}

function showAssess() {
  go('Assess the patient', `
    <h2 tabindex="-1" data-step-heading>Assess the patient</h2>
    <p class="banner">${esc(scenario.banner)}</p>
    <p>${esc(scenario.situation)}</p>
    <p>Look around the bedside. Select an object to see what you observe. Each one you open is added to your assessment notes. You do not have to open everything.</p>
    <div class="assess">
      <div class="assess-main">
        <div class="assess-scene">
          <div class="scene scene-assess scene-frame">
            ${assessSvg(scenario.chart, scenario.assessment)}
            <ul class="hotspots" role="list" aria-label="Things to examine at the bedside">
              ${scenario.assessment.map((h) => `
              <li style="--x:${h.x}%;--y:${h.y}%"><button type="button" class="hs${state.notes.includes(h.id) ? ' seen' : ''}" data-act="hotspot" data-id="${h.id}" aria-controls="finding-panel"><span class="ic" aria-hidden="true"></span><span>${esc(h.label)}</span></button></li>`).join('')}
            </ul>
          </div>
        </div>
        <section id="finding-panel" class="panel" aria-live="off" aria-labelledby="panel-title">${emptyPanelHtml}</section>
      </div>
      <div class="assess-side">
        <section class="notes-box" aria-labelledby="notes-title">
          <h3 id="notes-title">Your assessment notes</h3>
          <div class="panel-tools">${readBtn('#notes-list')}</div>
          <div id="notes-list">${notesListHtml()}</div>
        </section>
        <details class="all-findings">
          <summary>Show all findings as a list</summary>
          <p class="step-note">Every object's findings in plain text. ${tag}</p>
          ${allFindingsHtml()}
        </details>
      </div>
    </div>
    <div class="btn-row"><button type="button" class="btn" data-act="build">Continue to build the call</button></div>
    <p id="none-note" class="step-note"${state.notes.length ? ' hidden' : ''}>You have not opened anything yet. You can still continue, but the notes help when you build the call.</p>`, { wide: true });
  state.active = null;
}

function openHotspot(btn) {
  const h = hotspotById[btn.dataset.id];
  stopReading();
  const fresh = !state.notes.includes(h.id);
  if (fresh) state.notes.push(h.id);
  state.active = h.id;
  const panel = document.getElementById('finding-panel');
  panel.innerHTML = panelHtml(h);
  panel.scrollIntoView({ block: 'nearest' }); // keeps focus on the hotspot, only nudges the page
  app.querySelectorAll('.hs').forEach((b) => {
    if (b === btn) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  btn.classList.add('seen');
  document.getElementById('notes-list').innerHTML = notesListHtml();
  const none = document.getElementById('none-note');
  if (none) none.hidden = true;
  // Focus stays on the hotspot; the live region says what happened.
  announce(`${h.label}: ${h.findings[0]} ${fresh ? 'Added to your notes.' : 'Already in your notes.'}`);
}

function optionsHtml(sec) {
  return sec.statements.map((s) => {
    const id = `cb-${s.id}`;
    const checked = state.selected[sec.key].includes(s.id) ? ' checked' : '';
    return `<div class="opt"><input type="checkbox" id="${id}" value="${s.id}" data-sec="${sec.key}"${checked}><label for="${id}" data-sent>${esc(s.text)}</label></div>`;
  }).join('');
}

// The ordered list of chosen statements, with Move up / Move down buttons.
// aria-disabled (not disabled) at the ends so keyboard focus is never dropped.
function pickedHtml(sec) {
  const ids = state.selected[sec.key];
  if (!ids.length) return '<p class="empty">Nothing selected yet.</p>';
  return `<ol aria-labelledby="pt-${sec.key}">${ids.map((id, i) => {
    const t = esc(byId[id].text);
    const upOff = i === 0 ? ' aria-disabled="true"' : '';
    const downOff = i === ids.length - 1 ? ' aria-disabled="true"' : '';
    return `<li>${t}<div class="btns">
      <button type="button" class="small-btn" data-act="up" data-id="${id}" aria-label="Move up: ${t}"${upOff}>Move up</button>
      <button type="button" class="small-btn" data-act="down" data-id="${id}" aria-label="Move down: ${t}"${downOff}>Move down</button>
    </div></li>`;
  }).join('')}</ol>`;
}

function renderPicked(key) {
  const sec = scenario.sections.find((s) => s.key === key);
  document.getElementById(`picked-${key}`).innerHTML = pickedHtml(sec);
}

function showBuild() {
  go('Build the call', `
    <h2 tabindex="-1" data-step-heading>Build the call</h2>
    ${nurseStationScene()}
    <p>Tick the statements you would say in each part of the call. Chosen statements appear in a list below each group, in the order you will say them. Use Move up and Move down to reorder.</p>
    <details open>
      <summary>Your assessment notes</summary>
      <div class="panel-tools">${readBtn('#notes-list-build')}</div>
      <div id="notes-list-build">${notesListHtml()}</div>
      <div class="btn-row"><button type="button" class="small-btn" data-act="assess">Go back to the patient</button></div>
    </details>
    <details>
      <summary>View chart</summary>
      <p class="banner">${esc(scenario.banner)}</p>
      ${chartHtml()}
    </details>
    <form id="call-form" novalidate>
      ${scenario.sections.map((sec) => `
        <fieldset id="fs-${sec.key}">
          <legend>${sec.name}</legend>
          <p class="hint" data-sent data-say="${esc(`${sec.name}. ${sec.prompt}`)}">${esc(sec.prompt)}</p>
          <div class="panel-tools">${readBtn(`#fs-${sec.key}`)}</div>
          ${optionsHtml(sec)}
          <div class="picked">
            <h3 id="pt-${sec.key}">Your ${sec.name} statements, in order</h3>
            <div id="picked-${sec.key}">${pickedHtml(sec)}</div>
          </div>
        </fieldset>`).join('')}
      <div class="btn-row"><button type="submit" class="btn">Make the call</button></div>
    </form>`);
}

// Turn the learner's selections into a readable script, grouped by section.
function scriptHtml() {
  return scenario.sections.map((sec) => {
    const text = state.selected[sec.key].map((id) => byId[id].text).join(' ');
    return `<p><strong>${sec.name}:</strong> ${esc(text) || '<em>(nothing selected)</em>'}</p>`;
  }).join('');
}

function showFeedback() {
  const r = state.last;
  const names = Object.fromEntries(scenario.criteria.map((c) => [c.id, c]));
  const allMet = r.metCount === 4;
  const mood = moodFor(r.metCount);
  go('Feedback', `
    <h2 tabindex="-1" data-step-heading>Feedback</h2>
    <p class="step-note">Attempt ${state.attempts.length}: ${r.metCount} of 4 criteria met.</p>
    <h3>Phone transcript</h3>
    <div class="transcript">
      ${scriptHtml()}
      <div class="provider-card" data-provider-mood="${mood}">
        ${providerScene(mood)}
        <p class="mood"><strong>${esc(MOODS[mood].text)}</strong></p>
        <div class="bubble"><p>${esc(r.reply)}</p></div>
      </div>
    </div>
    <h3>Your criteria</h3>
    <ul class="criteria">${r.results.map((c) => {
      const def = names[c.id];
      const tips = c.met ? [def.metTip] : c.tips;
      return `<li><h4>${def.name}
        <span class="badge ${c.met ? 'met' : 'notyet'}"><span aria-hidden="true">${c.met ? '✓' : '✗'}</span> ${c.met ? 'Met' : 'Not yet'}</span></h4>
        <p class="step-note">${esc(def.description)}</p>
        ${tips.map((t) => `<p>${esc(t)}</p>`).join('')}</li>`;
    }).join('')}</ul>
    <div class="btn-row">
      ${allMet
        ? '<button type="button" class="btn" data-act="mastery">See your evidence of mastery</button>'
        : '<button type="button" class="btn" data-act="build">Try again</button>'}
    </div>`);
  // The provider's reply is announced through the shared live region.
  announce(`Provider replied: ${r.reply} ${r.metCount} of 4 criteria met.`);
}

function showMastery() {
  go('Evidence of mastery', `
    <h2 tabindex="-1" data-step-heading>Evidence of mastery</h2>
    ${sunriseScene()}
    <p>All four criteria are met. Here is your record.</p>
    <div class="table-wrap" role="region" aria-label="Attempt history table" tabindex="0">
      <table>
        <caption>Attempt history</caption>
        <thead><tr><th scope="col">Attempt</th><th scope="col">Criteria met</th></tr></thead>
        <tbody>${state.attempts.map((a) => `<tr><th scope="row">${a.n}</th><td>${a.met.length} of 4: ${a.met.length ? a.met.map((id) => scenario.criteria.find((c) => c.id === id).name).join(', ') : 'none'}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <h3>Your final SBAR call</h3>
    <div class="transcript">${scriptHtml()}</div>
    <h3>Reflection (optional)</h3>
    <p class="step-note">This stays in this page only. It is not saved or sent anywhere.</p>
    <label for="reflection">What would you do the same or differently in a real call?</label>
    <textarea id="reflection" rows="4"></textarea>
    <div class="btn-row"><button type="button" class="btn secondary" data-act="restart">Start over</button></div>`);
}

/* ---------- Events (delegated, because views are re-rendered) ---------- */

app.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-act]');
  if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
  const act = btn.dataset.act;
  if (act === 'start') showAssess();
  else if (act === 'assess') showAssess();
  else if (act === 'hotspot') openHotspot(btn);
  else if (act === 'read') {
    if (!toggleReading(btn, btn.dataset.target)) announce('Nothing to read yet.');
  } else if (act === 'build') showBuild(); // selections stay in state, so "Try again" keeps them
  else if (act === 'mastery') showMastery();
  else if (act === 'restart') {
    state.selected = { S: [], B: [], A: [], R: [] };
    state.attempts = [];
    state.last = null;
    state.notes = [];
    showIntro();
    app.querySelector('[data-step-heading]').focus();
  } else if (act === 'up' || act === 'down') move(btn.dataset.id, act);
});

// Checking a box appends the statement to the ordered list; unchecking removes it.
// Only the list is re-rendered so keyboard focus stays on the checkbox.
app.addEventListener('change', (e) => {
  const cb = e.target;
  if (cb.type !== 'checkbox') return;
  const list = state.selected[cb.dataset.sec];
  if (cb.checked) list.push(cb.value);
  else list.splice(list.indexOf(cb.value), 1);
  renderPicked(cb.dataset.sec);
  announce(`${cb.checked ? 'Added to' : 'Removed from'} ${secName(cb.dataset.sec)}. ${list.length} selected.`);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  state.last = score(state.selected);
  state.attempts.push({ n: state.attempts.length + 1, met: state.last.results.filter((r) => r.met).map((r) => r.id) });
  showFeedback();
});

function move(id, dir) {
  const key = byId[id].shownIn;
  const list = state.selected[key];
  const i = list.indexOf(id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  renderPicked(key);
  // Re-rendering replaced the buttons, so put focus back on the same one.
  document.querySelector(`#picked-${key} button[data-act="${dir}"][data-id="${id}"]`).focus();
  announce(`Moved ${dir}. Now position ${j + 1} of ${list.length} in ${secName(key)}.`);
}

showIntro();
