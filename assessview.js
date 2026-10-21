// Wires the "Assess the patient" scene: 2D (SVG) or 3D (canvas), the view toggle, the
// animation and camera buttons, and the automatic fall back to 2D. The hotspots are the
// same HTML buttons in both views; the 3D scene only moves them. See DESIGN_NOTES.md.
import { reduced, onMotionChange } from './motion.js';

const KEY = 'sbar-view';
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* storage may be blocked */ } };

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

let current = null;

export function unmountAssessView() {
  if (!current) return;
  current.dead = true;
  current.offMotion();
  if (current.scene) current.scene.dispose();
  current = null;
}

export function selectInView(id) {
  if (!current) return;
  if (current.scene && current.is3d) current.scene.select(id);
  else if (current.loading) current.pending = id; // 3D is still loading: move the camera as soon as it is ready
}

export function mountAssessView(root, { hotspots, chart }) {
  unmountAssessView();
  const frame = root.querySelector('.scene-assess');
  const gl = root.querySelector('.gl');
  const list = root.querySelector('.hotspots');
  const bar = root.querySelector('.view-bar');
  const note = root.querySelector('#view-note');
  const $ = (a) => bar.querySelector(`[data-view-act="${a}"]`);
  const toggle = $('toggle'), anim = $('anim'), back = $('back'), left = $('left'), right = $('right');
  const only3d = [anim, back, left, right];

  const s = { dead: false, scene: null, is3d: false, playing: !reduced(), loading: null, pending: null, offMotion: () => {} };
  current = s;

  const resetHotspots = () => {
    for (const h of hotspots) {
      const li = list.querySelector(`[data-id="${h.id}"]`)?.closest('li');
      if (li) { li.style.setProperty('--x', `${h.x}%`); li.style.setProperty('--y', `${h.y}%`); }
    }
  };
  const setDisabled = (b, off) => { if (off) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); };
  const sync = () => {
    toggle.setAttribute('aria-pressed', String(s.is3d));
    only3d.forEach((b) => { b.hidden = !s.is3d; });
    anim.textContent = s.playing ? 'Pause animation' : 'Play animation';
    if (s.scene) {
      setDisabled(back, s.scene.current === 'home');
      setDisabled(left, s.scene.current === 'home' && s.scene.yaw <= -s.scene.maxYaw);
      setDisabled(right, s.scene.current === 'home' && s.scene.yaw >= s.scene.maxYaw);
    }
  };
  const say = (t) => { note.textContent = t; note.hidden = !t; };

  function show2d(why) {
    s.is3d = false;
    frame.dataset.view = '2d';
    if (s.scene) { s.scene.setActive(false); s.scene.setPlaying(false); }
    resetHotspots();
    say(why || '');
    sync();
  }
  function fallback(msg) {
    // Not saved as the learner's choice: it only says this device cannot draw the 3D view.
    show2d(msg);
    if (s.scene) { s.scene.dispose(); s.scene = null; }
  }

  async function show3d() {
    if (!webglOk()) { fallback('The 3D view is not available on this device, so the 2D scene is showing.'); return; }
    if (s.scene) {
      s.is3d = true; frame.dataset.view = '3d'; say('');
      s.scene.setActive(true); s.scene.refresh(); s.scene.setPlaying(s.playing); sync();
      return;
    }
    if (s.loading) return;
    s.loading = import('./scene3d.js').then((m) => {
      if (s.dead) return;
      // The scene needs the 3D layout to have a size, so show it before building.
      frame.dataset.view = '3d';
      try {
        s.scene = m.createScene3D({
          host: gl, list, hotspots, chart, animating: s.playing, reduced: reduced(),
          onView: sync,
          onLost: () => fallback('The 3D view stopped working on this device, so the 2D scene is showing.'),
        });
        s.is3d = true; say(''); sync();
        if (s.pending) { s.scene.select(s.pending); s.pending = null; }
      } catch {
        fallback('The 3D view could not start on this device, so the 2D scene is showing.');
      }
    }).catch(() => { if (!s.dead) fallback('The 3D view could not load, so the 2D scene is showing.'); })
      .finally(() => { s.loading = null; });
  }

  toggle.addEventListener('click', () => {
    if (s.is3d) { write('2d'); show2d(''); } else { write('3d'); show3d(); }
  });
  anim.addEventListener('click', () => {
    s.playing = !s.playing;
    if (s.scene) s.scene.setPlaying(s.playing);
    sync();
  });
  const act = (b, fn) => b.addEventListener('click', () => { if (b.getAttribute('aria-disabled') !== 'true' && s.scene) { fn(); sync(); } });
  act(back, () => s.scene.home());
  act(left, () => s.scene.look(-1));
  act(right, () => s.scene.look(1));

  s.offMotion = onMotionChange((r) => {
    s.playing = !r; // reduced motion stops idle animation; the Play button can still start it
    if (s.scene) { s.scene.setInstant(r); s.scene.setPlaying(s.playing); }
    sync();
  });

  frame.dataset.view = '2d';
  sync();
  if (read() !== '2d') show3d();
}
