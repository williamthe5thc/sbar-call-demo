// One place that decides whether motion is allowed.
// Reduced motion is on when the learner pressed "Reduce motion" in the header, or,
// until they choose, when their system asks for it (prefers-reduced-motion).
// The choice is remembered in localStorage when that is available.

const KEY = 'sbar-reduce-motion';
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const listeners = new Set();

const read = () => { try { const v = localStorage.getItem(KEY); return v === '1' ? true : v === '0' ? false : null; } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* storage may be blocked */ } };

let user = read();

export const reduced = () => (user === null ? !!(mq && mq.matches) : user);

function apply() {
  document.documentElement.dataset.motion = reduced() ? 'reduce' : 'allow';
  const btn = document.getElementById('motion-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(reduced()));
  listeners.forEach((fn) => fn(reduced()));
}

export const onMotionChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function toggleMotion() {
  user = !reduced();
  write(user);
  apply();
}

if (mq) mq.addEventListener('change', () => { if (user === null) apply(); });

export function initMotion() {
  apply();
  const btn = document.getElementById('motion-toggle');
  if (btn) btn.addEventListener('click', toggleMotion);
}

// Runs `swap` inside a short View Transition (cross-fade plus a small slide) when the
// browser supports it and motion is allowed; otherwise swaps at once. `swap` always runs.
export function transition(swap) {
  let done = false;
  const once = () => { if (!done) { done = true; swap(); } };
  if (typeof document.startViewTransition === 'function' && !reduced()) {
    try {
      document.startViewTransition(once);
      // Safety net: if the browser is too busy to start the transition, the step still changes.
      setTimeout(once, 600);
      return;
    } catch { /* fall through */ }
  }
  once();
}
