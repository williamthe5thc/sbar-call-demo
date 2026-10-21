// Read aloud with sentence highlighting, using the browser's speechSynthesis.
// One utterance per sentence: onstart marks it, onend moves to the next. That is
// more reliable across browsers than word-boundary events. Never starts by itself.
// If the browser has no speech support, supported() is false and no button is drawn.

export const supported = () =>
  typeof window !== 'undefined' && !!window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function';

let session = null; // { btn, items, i, utterance }

function setLabel(btn, reading) {
  if (!btn || !btn.isConnected) return;
  const span = btn.querySelector('.rl');
  if (span) span.textContent = reading ? 'Stop reading' : 'Read aloud';
  btn.classList.toggle('on', reading);
}

export function stopReading() {
  const s = session;
  session = null;
  if (supported()) { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } }
  document.querySelectorAll('.reading').forEach((el) => el.classList.remove('reading'));
  document.querySelectorAll('.read-btn.on').forEach((b) => setLabel(b, false));
  if (s) setLabel(s.btn, false);
}

function speakNext(s) {
  if (session !== s) return;
  if (s.i >= s.items.length) { stopReading(); return; }
  const item = s.items[s.i];
  const u = new window.SpeechSynthesisUtterance(item.text);
  u.lang = document.documentElement.lang || 'en';
  u.onstart = () => { if (session === s) item.el.classList.add('reading'); };
  u.onend = () => {
    if (session !== s) return;
    item.el.classList.remove('reading');
    s.i += 1;
    speakNext(s);
  };
  u.onerror = () => { if (session === s) stopReading(); };
  s.utterance = u; // keep a reference so it is not garbage collected mid-speech
  window.speechSynthesis.speak(u);
}

// Toggle reading for the sentences ([data-sent]) inside the element matching `selector`.
// Returns false when there was nothing to read.
export function toggleReading(btn, selector) {
  if (!supported()) return true;
  if (session && session.btn === btn) { stopReading(); return true; }
  stopReading();
  const root = document.querySelector(selector);
  const items = root
    ? [...root.querySelectorAll('[data-sent]')]
        .map((el) => ({ el, text: (el.dataset.say || el.textContent).replace(/\s+/g, ' ').trim() }))
        .filter((it) => it.text)
    : [];
  if (!items.length) return false;
  session = { btn, items, i: 0, utterance: null };
  setLabel(btn, true);
  speakNext(session);
  return true;
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', stopReading);
