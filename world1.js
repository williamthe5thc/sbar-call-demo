// The 3D world for the immersive scene 1: renderer, first-person camera, collision, path
// walking, hotspot projection with occlusion, and click picking. It knows nothing about the
// page's buttons: scene1.js drives it through the small API returned by createWorld().
// The canvas is decorative and aria-hidden: every finding is HTML (see DESIGN_NOTES.md).
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { buildRoom } from './scene3d.js';
import { monitorData } from './illustrations.js';
import { ROOM, buildShell, buildHallway, addGlow, upgradeSurfaces } from './room1.js';

export const EYE = 1.6; // metres: standing eye height
const R = 0.28; // body radius used for collision

/* ---------- places you can go ---------- */

export const SPOTS = {
  doorway: { label: 'Doorway', x: 2.2, z: 3.55, look: [-0.2, 1.0, -0.5] },
  foot: { label: 'Foot of bed', x: 2.5, z: -0.7, look: [-0.6, 0.8, -0.55] },
  bedleft: { label: 'Bedside (left)', x: -0.55, z: 0.75, look: [-0.4, 0.8, -0.5] },
  bedright: { label: 'Bedside (right)', x: 0.75, z: 0.75, look: [0.55, 0.8, -0.5] },
  monitor: { label: 'Monitor', x: 0.4, z: 0.34, look: [0.15, 1.6, -1.15] },
  ivpole: { label: 'IV pole', x: -2.05, z: 0.95, look: [-1.45, 1.35, -0.05] },
  window: { label: 'Window', x: 1.5, z: 0.8, look: [1.5, 1.6, -1.45] },
};

// Where you stand to examine each object: a spot, and how close (metres, along the floor) to get.
const STANCE = {
  ivpump: ['ivpole', 1.4], pca: ['ivpole', 1.2], skin: ['bedleft', 1.5], monitor: ['monitor', 1.6],
  ivsite: ['bedright', 1.35], drain: ['bedright', 1.45], dressing: ['bedright', 1.4], abdomen: ['bedright', 1.5],
  urine: ['bedright', 1.4], chart: ['foot', 1.25],
};
// How far from the anchor a click can land and still count as that object.
// Markers sit a little above these objects so they do not cover what you are looking at.
const LIFT = { monitor: 0.34 };
const PICK_RADIUS = { monitor: 0.5, skin: 0.42, abdomen: 0.38, chart: 0.34, ivpump: 0.3, pca: 0.3 };

/* ---------- collision (floor plan, metres) ---------- */

// [x0, z0, x1, z1] of furniture the camera must stay out of. The bed, the overbed table,
// the IV pole base, the PCA stand and the privacy curtain.
const OBSTACLES = [
  [-1.15, -1.05, 1.15, -0.05],
  [1.05, -0.35, 2.0, 0.35],
  [-1.85, -0.4, -1.25, 0.2],
  [-1.3, 0.13, -0.95, 0.47],
  [-3.05, -0.9, -2.05, -0.8],
].map(([a, b, c, d]) => [a - R, b - R, c + R, d + R]);
const B = { x0: ROOM.x0 + R, x1: ROOM.x1 - R, z0: ROOM.z0 + R, z1: ROOM.z1 - R };

export function collide(x, z) {
  x = Math.min(B.x1, Math.max(B.x0, x)); z = Math.min(B.z1, Math.max(B.z0, z));
  for (let k = 0; k < 4; k++) {
    for (const [a, b, c, d] of OBSTACLES) {
      if (x > a && x < c && z > b && z < d) {
        const pl = x - a, pr = c - x, pb = z - b, pf = d - z;
        const m = Math.min(pl, pr, pb, pf);
        if (m === pl) x = a; else if (m === pr) x = c; else if (m === pb) z = b; else z = d;
      }
    }
    x = Math.min(B.x1, Math.max(B.x0, x)); z = Math.min(B.z1, Math.max(B.z0, z));
  }
  return [x, z];
}
const free = (x, z) => { const [cx, cz] = collide(x, z); return Math.abs(cx - x) < 1e-6 && Math.abs(cz - z) < 1e-6; };
const clearLine = (a, b) => {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.05);
  for (let i = 1; i < n; i++) { const t = i / n; if (!free(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false; }
  return true;
};

// Grid A* around the furniture; then straighten with line of sight.
export function findPath(from, to) {
  if (clearLine(from, to)) return [from, to];
  const cs = 0.1, nx = Math.ceil((B.x1 - B.x0) / cs) + 1, nz = Math.ceil((B.z1 - B.z0) / cs) + 1;
  const cell = (p) => [Math.round((p[0] - B.x0) / cs), Math.round((p[1] - B.z0) / cs)];
  const pos = (i, j) => [B.x0 + i * cs, B.z0 + j * cs];
  const [si, sj] = cell(from), [gi, gj] = cell(to);
  const key = (i, j) => i * nz + j;
  const g = new Map([[key(si, sj), 0]]), prev = new Map(), open = [[0, si, sj]], done = new Set();
  const h = (i, j) => Math.hypot(i - gi, j - gj);
  while (open.length) {
    open.sort((p, q) => p[0] - q[0]);
    const [, i, j] = open.shift();
    if (done.has(key(i, j))) continue;
    done.add(key(i, j));
    if (i === gi && j === gj) break;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const p = pos(a, b);
      if (!free(p[0], p[1])) continue;
      const cost = g.get(key(i, j)) + Math.hypot(di, dj);
      if (cost < (g.get(key(a, b)) ?? Infinity)) { g.set(key(a, b), cost); prev.set(key(a, b), [i, j]); open.push([cost + h(a, b), a, b]); }
    }
  }
  if (!prev.has(key(gi, gj)) && !(si === gi && sj === gj)) return [from, to]; // no route found: cut
  const cells = [[gi, gj]];
  for (let c = prev.get(key(gi, gj)); c; c = prev.get(key(c[0], c[1]))) cells.push(c);
  const pts = [from, ...cells.reverse().map(([i, j]) => pos(i, j)), to];
  const out = [pts[0]];
  let a = 0;
  while (a < pts.length - 1) {
    let b = pts.length - 1;
    while (b > a + 1 && !clearLine(pts[a], pts[b])) b--;
    out.push(pts[b]); a = b;
  }
  return out;
}

const norm = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clampPitch = (p) => Math.max(-1.15, Math.min(1.15, p));
export const faceTo = (x, z, tx, ty, tz) => ({ yaw: Math.atan2(-(tx - x), -(tz - z)), pitch: clampPitch(Math.atan2(ty - EYE, Math.hypot(tx - x, tz - z))) });

/* ---------- the world ---------- */

export function createWorld({ host, chart, hotspots, playing = true, instant = false, onPose, onHotspots, onLost }) {
  const data = monitorData(chart);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the room is static: shadows are drawn once
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'gl-canvas';
  host.prepend(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1424);
  scene.fog = new THREE.FogExp2(0x0b1424, 0.045); // light haze
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;

  const parts = buildRoom(scene, data, { noShell: true });
  buildShell(scene);
  buildHallway(scene);
  upgradeSurfaces(parts);

  // Light: warm lamp, cool monitor glow, moonlight through the window, cool hallway, dim ambient
  scene.add(new THREE.HemisphereLight(0x9fb4d8, 0x2f3544, 0.42));
  const lamp = new THREE.SpotLight(0xffb066, 105, 10, 1.0, 0.85, 1.5);
  lamp.position.copy(parts.lampPos); lamp.target.position.set(-0.4, 0.5, -0.4);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005; lamp.shadow.radius = 5;
  scene.add(lamp, lamp.target);
  const lampFill = new THREE.PointLight(0xffb36b, 7, 5, 2); lampFill.position.copy(parts.lampPos).add(new THREE.Vector3(0, -0.1, 0.15)); scene.add(lampFill);
  const glow = new THREE.PointLight(0x74b9ff, 6, 4.6, 2); glow.position.copy(parts.monitorPos); scene.add(glow);
  const moon = new THREE.DirectionalLight(0x8eb0ff, 0.95);
  moon.position.set(3, 3.2, -4.2); moon.target.position.set(0.3, 0, 0.8);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 0.5, far: 16 });
  moon.shadow.bias = -0.0008; moon.shadow.radius = 5;
  scene.add(moon, moon.target);
  const hall = new THREE.SpotLight(0xdff0ff, 55, 8, 1.1, 0.9, 1.6);
  hall.position.set(2.1, 2.7, 4.9); hall.target.position.set(1.9, 0.6, 6.4); scene.add(hall, hall.target);

  // Bloom-free glow: additive sprites around the lamp bulb, the monitor, the moon and the station
  addGlow(scene, parts.lampPos.clone().add(new THREE.Vector3(0, 0, 0.0)), 0xffc27a, 0.7, 0.55);
  addGlow(scene, new THREE.Vector3(0.15, 1.62, -1.1), 0x6fb8ff, 1.5, 0.22);
  addGlow(scene, new THREE.Vector3(0.9, 2.1, -1.8), 0x9db8ff, 1.6, 0.25);
  addGlow(scene, new THREE.Vector3(2.1, 2.7, 5.2), 0xcfe8ff, 2.4, 0.3);
  addGlow(scene, new THREE.Vector3(0.8, 1.05, 6.05), 0xffd9a0, 0.5, 0.45);

  const camera = new THREE.PerspectiveCamera(62, 1.6, 0.05, 40);
  camera.rotation.order = 'YXZ';

  // Things that can hide a hotspot or be clicked: every solid mesh
  const solids = [];
  scene.traverse((o) => { if (o.isMesh && !(o.material.transparent && o.material.opacity < 0.95) && o.geometry.type !== 'CircleGeometry') solids.push(o); });
  const items = hotspots.map((h) => ({ id: h.id, p: new THREE.Vector3(...h.pos3d), w: 130, h: 44 }));
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  /* ---- pose ---- */
  const pose = { x: SPOTS.doorway.x, z: SPOTS.doorway.z, yaw: 0, pitch: 0 };
  Object.assign(pose, faceTo(pose.x, pose.z, ...SPOTS.doorway.look));
  let tween = null, isInstant = instant, spot = 'doorway';
  let posedAt = 0, hotStale = true, lastHot = 0, raf = 0, dirty = true, disposed = false, active = true, pageVisible = !document.hidden;
  let isPlaying = playing, clockT = 0, lastTick = 0, lastMon = 0, frames = 0, last = 0;
  let W = 0, H = 0, interacting = false;

  const applyPose = () => {
    camera.position.set(pose.x, EYE, pose.z);
    camera.rotation.set(pose.pitch, pose.yaw, 0);
    camera.updateMatrixWorld(true);
    posedAt += 1; hotStale = true; dirty = true;
  };
  const publish = () => {
    host.dataset.x = pose.x.toFixed(2); host.dataset.z = pose.z.toFixed(2);
    host.dataset.yaw = String(Math.round(THREE.MathUtils.radToDeg(pose.yaw)));
    host.dataset.pitch = String(Math.round(THREE.MathUtils.radToDeg(pose.pitch)));
    host.dataset.spot = spot || '';
    host.dataset.moving = String(!!tween);
    onPose && onPose({ ...pose, spot, moving: !!tween });
  };

  function animateTo(to, { dur, path }) {
    const target = { x: to.x, z: to.z, yaw: to.yaw, pitch: to.pitch };
    if (isInstant || dur <= 0) {
      tween = null; Object.assign(pose, target); pose.yaw = norm(pose.yaw); applyPose(); publish(); request(); return;
    }
    const pts = path || [[pose.x, pose.z], [to.x, to.z]];
    const seg = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
    tween = { t0: performance.now(), dur, pts, seg, len, from: { ...pose }, dyaw: norm(target.yaw - pose.yaw), to: target };
    publish(); request();
  }
  function stepTween(now) {
    const tw = tween; if (!tw) return false;
    const k = Math.min(1, (now - tw.t0) / tw.dur), e = ease(k);
    let d = e * tw.len, i = 0;
    while (i < tw.seg.length - 1 && d > tw.seg[i]) { d -= tw.seg[i]; i++; }
    const a = tw.pts[i], b = tw.pts[i + 1] || a, f = tw.seg[i] ? Math.min(1, d / tw.seg[i]) : 1;
    pose.x = a[0] + (b[0] - a[0]) * f; pose.z = a[1] + (b[1] - a[1]) * f;
    pose.yaw = tw.from.yaw + tw.dyaw * e; pose.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * e;
    applyPose();
    if (k >= 1) { Object.assign(pose, tw.to); pose.yaw = norm(pose.yaw); tween = null; applyPose(); publish(); return false; }
    return true;
  }

  function spotPose(id) {
    const s = SPOTS[id];
    const [x, z] = collide(s.x, s.z);
    return { x, z, ...faceTo(x, z, ...s.look) };
  }
  function examinePose(id) {
    const [spotId, dist] = STANCE[id] || ['bedright', 1.0];
    const base = SPOTS[spotId], it = byId[id];
    let x = base.x, z = base.z;
    const dx = x - it.p.x, dz = z - it.p.z, d0 = Math.hypot(dx, dz);
    if (d0 > 1e-3) { x = it.p.x + (dx / d0) * dist; z = it.p.z + (dz / d0) * dist; } // stand `dist` away, on the side of the usual spot
    [x, z] = collide(x, z);
    return { spotId, x, z, ...faceTo(x, z, it.p.x, it.p.y, it.p.z) };
  }
  const travel = (to, { smooth }) => {
    const path = findPath([pose.x, pose.z], [to.x, to.z]);
    let len = 0; for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    const turnOnly = len < 0.05;
    const dur = smooth ? Math.max(turnOnly ? 350 : 700, Math.min(3500, (len / 1.5) * 1000)) : 300;
    animateTo(to, { dur, path });
  };

  /* ---- hotspots: projection, distance, view and occlusion ---- */
  const ray = new THREE.Raycaster();
  const v = new THREE.Vector3(), tmp = new THREE.Vector3();
  function updateHotspots() {
    hotStale = false; lastHot = performance.now();
    if (!W) return;
    camera.updateMatrixWorld(true);
    const out = [];
    for (const it of items) {
      v.copy(it.p); v.y += LIFT[it.id] || 0; v.project(camera);
      const dist = camera.position.distanceTo(it.p);
      const inFront = v.z > -1 && v.z < 1;
      let visible = inFront && dist <= 3.0 && Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.9;
      if (visible) { // occluded when something solid is clearly in front of the anchor
        tmp.copy(it.p).sub(camera.position).normalize();
        ray.set(camera.position, tmp); ray.far = dist;
        const hit = ray.intersectObjects(solids, false)[0];
        if (hit && hit.distance < dist - 0.22) visible = false;
      }
      out.push({ id: it.id, x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, visible, dist });
    }
    onHotspots && onHotspots(out);
  }

  function pick(clientX, clientY) {
    const r = host.getBoundingClientRect();
    if (!r.width) return null;
    const nx = ((clientX - r.left) / r.width) * 2 - 1, ny = -((clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera({ x: nx, y: ny }, camera); ray.far = 12;
    const hit = ray.intersectObjects(solids, false)[0];
    if (!hit) return null;
    let best = null, bd = Infinity;
    for (const it of items) { const d = hit.point.distanceTo(it.p); if (d < (PICK_RADIUS[it.id] || 0.26) && d < bd) { best = it.id; bd = d; } }
    return best;
  }

  /* ---- render loop: on demand, 30 fps for idle animation ---- */
  function request() { if (!raf && !disposed && active && pageVisible) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    if (disposed || !active) return;
    const moving = stepTween(now);
    if (!moving && !interacting && hotStale && now - lastHot > 90) { updateHotspots(); }
    const idle = isPlaying && !moving && !interacting;
    if (idle && !dirty && now - last < 33) { request(); return; }
    if (isPlaying) {
      clockT += lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0;
      parts.breathe(clockT); parts.sway(clockT);
      if (now - lastMon > 60) { parts.monitorDraw(clockT); lastMon = now; }
    }
    lastTick = isPlaying ? now : 0;
    renderer.render(scene, camera);
    frames += 1; host.dataset.frames = String(frames);
    dirty = false; last = now;
    if (moving || isPlaying || interacting || hotStale) request();
  }

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // Keep a comfortable horizontal view on tall, narrow screens (about 78 degrees at most).
    camera.fov = camera.aspect >= 1.1 ? 62 : Math.min(88, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(39)) / camera.aspect)));
    camera.updateProjectionMatrix();
    dirty = true; hotStale = true; request();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);
  const onVis = () => { pageVisible = !document.hidden; if (pageVisible) { lastTick = 0; dirty = true; request(); } };
  document.addEventListener('visibilitychange', onVis);
  const onCtxLost = (e) => { e.preventDefault(); onLost && onLost(); };
  canvas.addEventListener('webglcontextlost', onCtxLost);

  renderer.shadowMap.needsUpdate = true;
  applyPose(); resize();
  if (W) { renderer.render(scene, camera); frames = 1; host.dataset.frames = '1'; dirty = false; }
  host.dataset.animating = String(isPlaying);
  publish();

  return {
    pose, items,
    get spot() { return spot; },
    get moving() { return !!tween; },
    goToSpot(id, { smooth = false } = {}) { if (!SPOTS[id]) return; spot = id; travel(spotPose(id), { smooth }); },
    examine(id, { smooth = false } = {}) { if (!byId[id]) return; const p = examinePose(id); spot = ''; travel(p, { smooth }); },
    // One step of `d` metres: forward (+) / back (-) and right (+) / left (-), along the way you face.
    step(fwd, right, { smooth = false } = {}) {
      const sy = Math.sin(pose.yaw), cy = Math.cos(pose.yaw);
      const dx = -sy * fwd + cy * right, dz = -cy * fwd - sy * right;
      const [x, z] = collide(pose.x + dx, pose.z + dz);
      spot = '';
      animateTo({ x, z, yaw: pose.yaw, pitch: pose.pitch }, { dur: smooth ? 400 : 260 });
    },
    turn(dYaw) { spot = ''; animateTo({ x: pose.x, z: pose.z, yaw: pose.yaw + dYaw, pitch: pose.pitch }, { dur: 200 }); },
    look(dPitch) { animateTo({ x: pose.x, z: pose.z, yaw: pose.yaw, pitch: clampPitch(pose.pitch + dPitch) }, { dur: 200 }); },
    // Continuous walking (smooth mode): called every frame while keys are held.
    walk(dt, fwd, right, turn, lookp) {
      if (tween) { tween = null; }
      spot = '';
      pose.yaw += turn * dt; pose.pitch = clampPitch(pose.pitch + lookp * dt);
      const sy = Math.sin(pose.yaw), cy = Math.cos(pose.yaw), sp = 1.5 * dt;
      const [x, z] = collide(pose.x + (-sy * fwd + cy * right) * sp, pose.z + (-cy * fwd - sy * right) * sp);
      pose.x = x; pose.z = z; pose.yaw = norm(pose.yaw);
      applyPose(); publish(); request();
    },
    drag(dYaw, dPitch) { if (tween) tween = null; spot = ''; pose.yaw = norm(pose.yaw + dYaw); pose.pitch = clampPitch(pose.pitch + dPitch); applyPose(); publish(); request(); },
    setInteracting(on) { const was = interacting; interacting = !!on; if (was && !on) { hotStale = true; } request(); },
    pick,
    refreshHotspots() { hotStale = true; request(); },
    setPlaying(on) { isPlaying = !!on; host.dataset.animating = String(isPlaying); lastTick = 0; dirty = true; request(); },
    setInstant(on) {
      isInstant = !!on;
      if (on && tween) { const t = tween.to; tween = null; Object.assign(pose, t); applyPose(); publish(); request(); }
    },
    resize,
    dispose() {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onCtxLost);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map && x.map.dispose(); x.dispose(); }); });
      pm.dispose(); renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* ignore */ }
      canvas.remove();
    },
  };
}
