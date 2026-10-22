// The 3D world for the immersive scene 1: renderer, first-person camera, collision, path
// walking, hotspot projection with occlusion, and click picking. It knows nothing about the
// page's buttons: scene1.js drives it through the small API returned by createWorld().
// The canvas is decorative and aria-hidden: every finding is HTML (see DESIGN_NOTES.md).
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { buildRoom } from './scene3d.js';
import { monitorData } from './illustrations.js';
import { ROOM, DOOR, HALL, buildShell, addGlow, upgradeSurfaces } from './room1.js';
import { STATION, buildHallway, buildProvider, poseWalk } from './station.js';

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

// Scene 2: the walk to the nurses' station and the call.
export const SPOTS2 = {
  room12: { label: 'Room 12 doorway', x: 2.2, z: 3.55, look: [2.2, 1.4, 6.4] },
  hall: { label: 'Hallway', x: 0.0, z: 4.9, look: [2.8, 1.2, 6.6] },
  station: { label: "Nurses' station", x: 1.9, z: 6.3, look: [3.0, 1.15, 7.8] },
  phone: { label: 'Phone', x: 3.4, z: 6.55, look: [3.55, 0.78, 7.5] },
};

// Where you stand to examine each object: a spot, and how close (metres, along the floor) to get.
const STANCE = {
  ivpump: ['ivpole', 1.4], pca: ['ivpole', 1.2], skin: ['bedleft', 1.5], monitor: ['monitor', 1.6],
  ivsite: ['bedright', 1.35], drain: ['bedright', 1.45], dressing: ['bedright', 1.4], abdomen: ['bedright', 1.5],
  urine: ['bedright', 1.4], chart: ['foot', 1.25],
};
// How far from the anchor a click can land and still count as that object.
// Markers sit a little above these objects so they do not cover what you are looking at.
const LIFT = { monitor: 0.34, phone: 0.32 };
const PICK_RADIUS = { phone: 0.34, monitor: 0.5, skin: 0.42, abdomen: 0.38, chart: 0.34, ivpump: 0.3, pca: 0.3 };

/* ---------- collision (floor plan, metres) ---------- */

// [x0, z0, x1, z1] of furniture the camera must stay out of. The bed, the overbed table,
// the IV pole base, the PCA stand and the privacy curtain.
const grow = (list) => list.map(([a, b, c, d]) => [a - R, b - R, c + R, d + R]);
const OBSTACLES = grow([
  [-1.15, -1.05, 1.15, -0.05],
  [1.05, -0.35, 2.0, 0.35],
  [-1.85, -0.4, -1.25, 0.2],
  [-1.3, 0.13, -0.95, 0.47],
  [-3.05, -0.9, -2.05, -0.8],
]);
// Scene 2 adds the counter, the station's side panel, the desk, the chair and the cart.
const OBSTACLES2 = OBSTACLES.concat(grow([
  STATION.counter, STATION.sidePanel, STATION.desk,
  [STATION.chair.x - 0.3, STATION.chair.z - 0.3, STATION.chair.x + 0.3, STATION.chair.z + 0.3],
  STATION.cart,
]));
const B = { x0: ROOM.x0 + R, x1: ROOM.x1 - R, z0: ROOM.z0 + R, z1: ROOM.z1 - R };
// Scene 2 can walk the room, through the door, and along the hallway: three rectangles.
const RECTS2 = [
  [ROOM.x0 + R, ROOM.z0 + R, ROOM.x1 - R, ROOM.z1 - R],
  [DOOR.x0 + R, ROOM.z1 - 0.5, DOOR.x1 - R, HALL.z0 + 0.5],
  [HALL.x0 + R, HALL.z0 + R, HALL.x1 - R, HALL.z1 - R],
];
let region = 1; // 1: the room only; 2: the room, the doorway and the hallway
export const setRegion = (n) => { region = n; };
const bbox = () => (region === 1 ? B : { x0: HALL.x0 + R, x1: HALL.x1 - R, z0: ROOM.z0 + R, z1: HALL.z1 - R });

export function collide(x, z) {
  const obs = region === 1 ? OBSTACLES : OBSTACLES2;
  const snap = () => {
    if (region === 1) { x = Math.min(B.x1, Math.max(B.x0, x)); z = Math.min(B.z1, Math.max(B.z0, z)); return; }
    let best = null, bd = Infinity;
    for (const [a, b, c, d] of RECTS2) {
      const px = Math.min(c, Math.max(a, x)), pz = Math.min(d, Math.max(b, z)), dd = (px - x) ** 2 + (pz - z) ** 2;
      if (dd < bd) { bd = dd; best = [px, pz]; }
    }
    [x, z] = best;
  };
  snap();
  for (let k = 0; k < 4; k++) {
    for (const [a, b, c, d] of obs) {
      if (x > a && x < c && z > b && z < d) {
        const pl = x - a, pr = c - x, pb = z - b, pf = d - z;
        const m = Math.min(pl, pr, pb, pf);
        if (m === pl) x = a; else if (m === pr) x = c; else if (m === pb) z = b; else z = d;
      }
    }
    snap();
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
  const BB = bbox();
  const cs = 0.1, nx = Math.ceil((BB.x1 - BB.x0) / cs) + 1, nz = Math.ceil((BB.z1 - BB.z0) / cs) + 1;
  const cell = (p) => [Math.round((p[0] - BB.x0) / cs), Math.round((p[1] - BB.z0) / cs)];
  const pos = (i, j) => [BB.x0 + i * cs, BB.z0 + j * cs];
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
  const NIGHT = 0x03060c;
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.FogExp2(NIGHT, 0.05); // light haze
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.06;

  const parts = buildRoom(scene, data, { noShell: true });
  buildShell(scene);
  const hall3d = buildHallway(scene, chart);
  upgradeSurfaces(parts);

  // It is 2 a.m. The overhead lights are off. What is left: a warm lamp pool at the bedside, the cool
  // glow of the monitor, a little moonlight through the window, light spilling in from the lit hallway,
  // and almost no ambient light, so the corners fall into the dark.
  scene.add(new THREE.HemisphereLight(0x6f86b8, 0x151a26, 0.07));
  const lamp = new THREE.SpotLight(0xffae5c, 120, 10, 0.95, 0.9, 1.6);
  lamp.position.copy(parts.lampPos); lamp.target.position.set(-0.45, 0.45, -0.35);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005; lamp.shadow.radius = 5;
  scene.add(lamp, lamp.target);
  const lampFill = new THREE.PointLight(0xffa860, 5, 3.6, 2); lampFill.position.copy(parts.lampPos).add(new THREE.Vector3(0, -0.1, 0.15)); scene.add(lampFill);
  const glow = new THREE.PointLight(0x5fb0ff, 7, 4.2, 2); glow.position.copy(parts.monitorPos).add(new THREE.Vector3(0, -0.1, 0.35)); scene.add(glow);
  const moon = new THREE.DirectionalLight(0x7f9fe8, 0.45);
  moon.position.set(3, 3.2, -4.2); moon.target.position.set(0.3, 0, 0.8);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 0.5, far: 16 });
  moon.shadow.bias = -0.0008; moon.shadow.radius = 5;
  scene.add(moon, moon.target);
  // The lit hallway spills through the open door onto the floor (the walls cast the shadows).
  const spill = new THREE.SpotLight(0xdcecff, 95, 10, 0.62, 0.7, 1.3);
  spill.position.set(2.2, 2.55, 5.0); spill.target.position.set(2.15, 0, 1.9);
  spill.castShadow = true; spill.shadow.mapSize.set(1024, 1024); spill.shadow.bias = -0.0006; spill.shadow.radius = 4;
  spill.shadow.camera.near = 0.3; spill.shadow.camera.far = 12;
  scene.add(spill, spill.target);
  // The hallway itself: ceiling lights are on. Spots aim along the hallway, away from Room 12.
  for (const [x, z, tx, tz] of [[-4.4, 5.6, -4.2, 7.0], [-1.6, 5.6, -1.4, 7.0], [1.4, 6.2, 1.6, 7.4], [3.8, 6.2, 3.4, 7.4]]) {
    const h = new THREE.SpotLight(0xe4f2ff, 17, 8, 0.8, 0.85, 1.4);
    h.position.set(x, 2.7, z); h.target.position.set(tx, 0.3, tz); scene.add(h, h.target);
  }
  // The station: a warm task light, and the cool glow of the computer.
  const task = new THREE.PointLight(0xffb060, 5, 3.4, 2);
  task.position.set(STATION.lamp.x + 0.25, 1.12, STATION.lamp.z - 0.1); scene.add(task);
  const ehrGlow = new THREE.PointLight(0xa8d4ff, 3.2, 3.0, 2);
  ehrGlow.position.set(STATION.screen.x, 1.1, STATION.screen.z - 0.7); scene.add(ehrGlow);

  // Bloom-free glow: additive sprites around the lamp bulb, the monitor, the moon and the hallway lights
  addGlow(scene, parts.lampPos.clone(), 0xffc27a, 0.7, 0.55);
  addGlow(scene, new THREE.Vector3(0.15, 1.62, -1.1), 0x6fb8ff, 1.4, 0.2);
  addGlow(scene, new THREE.Vector3(0.9, 2.1, -1.8), 0x9db8ff, 1.4, 0.2);
  for (const [x, z] of hall3d.ceilingLights.filter((_, i) => i % 2 === 0)) addGlow(scene, new THREE.Vector3(x, 2.7, z), 0xcfe8ff, 2.2, 0.22);
  addGlow(scene, new THREE.Vector3(STATION.lamp.x + 0.24, 1.14, STATION.lamp.z), 0xffd9a0, 0.5, 0.45);
  addGlow(scene, new THREE.Vector3(STATION.screen.x, 1.07, STATION.screen.z - 0.1), 0xb8dcff, 0.9, 0.18);

  const camera = new THREE.PerspectiveCamera(62, 1.6, 0.05, 40);
  camera.rotation.order = 'YXZ';

  // Things that can hide a hotspot or be clicked: every solid mesh
  const solids = [];
  scene.traverse((o) => { if (o.isMesh && !(o.material.transparent && o.material.opacity < 0.95) && o.geometry.type !== 'CircleGeometry') solids.push(o); });
  const mk = (list) => list.map((h) => ({ id: h.id, p: new THREE.Vector3(...h.pos3d), w: 130, h: 44 }));
  const items1 = mk(hotspots), items2 = mk([{ id: 'phone', pos3d: [STATION.phone.x, STATION.phone.y + 0.1, STATION.phone.z] }]);
  let items = items1, byId = Object.fromEntries(items.map((i) => [i.id, i]));
  let sceneNo = 1, spots = SPOTS;
  const provider = buildProvider(); provider.visible = false; scene.add(provider); // added after `solids`: it never hides a marker
  let fig = null; // the provider's walk: { t0, dur, pts, seg, len, resolve }
  const idleWaiters = [];

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
    if (!tween) while (idleWaiters.length) idleWaiters.shift()();
  };

  function animateTo(to, { dur, path, follow = false }) {
    const target = { x: to.x, z: to.z, yaw: to.yaw, pitch: to.pitch };
    if (isInstant || dur <= 0) {
      tween = null; Object.assign(pose, target); pose.yaw = norm(pose.yaw); applyPose(); publish(); request(); return;
    }
    const pts = path || [[pose.x, pose.z], [to.x, to.z]];
    const seg = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
    tween = { t0: performance.now(), dur, pts, seg, len, from: { ...pose }, dyaw: norm(target.yaw - pose.yaw), to: target, follow, curYaw: pose.yaw, lastNow: performance.now() };
    publish(); request();
  }
  function stepTween(now) {
    const tw = tween; if (!tw) return false;
    const k = Math.min(1, (now - tw.t0) / tw.dur), e = ease(k);
    let d = e * tw.len, i = 0;
    while (i < tw.seg.length - 1 && d > tw.seg[i]) { d -= tw.seg[i]; i++; }
    const a = tw.pts[i], b = tw.pts[i + 1] || a, f = tw.seg[i] ? Math.min(1, d / tw.seg[i]) : 1;
    pose.x = a[0] + (b[0] - a[0]) * f; pose.z = a[1] + (b[1] - a[1]) * f;
    if (tw.follow && tw.len > 0.3) {
      // Walking: look where you are going along the path, then settle on the final view in the last stretch.
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const heading = Math.hypot(dx, dz) > 1e-4 ? Math.atan2(-dx, -dz) : tw.curYaw;
      const dt = Math.min(0.1, (now - tw.lastNow) / 1000); tw.lastNow = now;
      tw.curYaw += norm(heading - tw.curYaw) * (1 - Math.exp(-dt * 5));
      const settle = Math.max(0, (k - 0.78) / 0.22), es = settle * settle * (3 - 2 * settle);
      pose.yaw = tw.curYaw + norm(tw.to.yaw - tw.curYaw) * es;
      const walkPitch = -0.04 + (tw.from.pitch + 0.04) * Math.max(0, 1 - k * 6);
      pose.pitch = walkPitch + (tw.to.pitch - walkPitch) * es;
    } else {
      pose.yaw = tw.from.yaw + tw.dyaw * e; pose.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * e;
    }
    applyPose();
    if (k >= 1) { Object.assign(pose, tw.to); pose.yaw = norm(pose.yaw); tween = null; applyPose(); publish(); return false; }
    return true;
  }

  function spotPose(id) {
    const s = spots[id];
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
  const travel = (to, { smooth, walk = false }) => {
    const path = findPath([pose.x, pose.z], [to.x, to.z]);
    let len = 0; for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    const turnOnly = len < 0.05;
    // `walk` is a scene change: always a real walk along the path (a cut when motion is reduced).
    const dur = walk ? Math.max(900, Math.min(5000, (len / 1.9) * 1000)) : smooth ? Math.max(turnOnly ? 350 : 700, Math.min(3500, (len / 1.5) * 1000)) : 300;
    animateTo(to, { dur, path, follow: walk || (smooth && len > 1.2) });
    return dur;
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
    const walkingFig = stepFigure(now);
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
    if (moving || walkingFig || isPlaying || interacting || hotStale) request();
  }
  function stepFigure(now) {
    const f = fig; if (!f) return false;
    const k = Math.min(1, (now - f.t0) / f.dur);
    let d = k * f.len, i = 0;
    while (i < f.seg.length - 1 && d > f.seg[i]) { d -= f.seg[i]; i++; }
    const a = f.pts[i], b = f.pts[i + 1] || a, u = f.seg[i] ? Math.min(1, d / f.seg[i]) : 1;
    provider.position.set(a[0] + (b[0] - a[0]) * u, 0, a[1] + (b[1] - a[1]) * u);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-4) provider.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
    poseWalk(provider, (now - f.t0) / 140, k < 1);
    dirty = true;
    if (k >= 1) { fig = null; poseWalk(provider, 0, false); const r = f.resolve; r && r(); return false; }
    return true;
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
    pose, get items() { return items; },
    get spot() { return spot; },
    get moving() { return !!tween; },
    goToSpot(id, { smooth = false, walk = false } = {}) { if (!spots[id]) return 0; spot = id; return travel(spotPose(id), { smooth, walk }); },
    get spots() { return spots; },
    // Scene 2 swaps the walkable area (room, doorway, hallway), the Go to spots and the markers.
    setScene(n) {
      sceneNo = n; setRegion(n === 2 ? 2 : 1);
      spots = n === 2 ? SPOTS2 : SPOTS; items = n === 2 ? items2 : items1; byId = Object.fromEntries(items.map((i) => [i.id, i]));
      hotStale = true; request();
    },
    // Resolves when the camera is not moving (at once if it already is not).
    whenIdle() { return tween ? new Promise((r) => idleWaiters.push(r)) : Promise.resolve(); },
    finishMove() { if (tween) { const t = tween.to; tween = null; Object.assign(pose, t); pose.yaw = norm(pose.yaw); applyPose(); publish(); request(); } },
    // Back in Room 12 after the call: the camera walks (or cuts) to a spot facing the doorway.
    returnToRoom({ smooth = true } = {}) {
      spot = '';
      const to = { x: 1.3, z: 1.6 }; to.yaw = faceTo(to.x, to.z, 2.2, 1.2, 4.0).yaw; to.pitch = -0.02;
      const path = findPath([pose.x, pose.z], [to.x, to.z]);
      let len = 0; for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      const dur = smooth ? Math.max(900, Math.min(5000, (len / 1.9) * 1000)) : 0;
      animateTo(to, { dur, path, follow: true });
      return dur;
    },
    // The provider walks from the hallway to the doorway of Room 12. Resolves when they arrive.
    providerArrives({ smooth = true } = {}) {
      const pts = [[0.5, 5.0], [2.2, 4.6], [2.2, 3.9]];
      provider.visible = true; provider.position.set(pts[0][0], 0, pts[0][1]);
      const arrive = () => { provider.position.set(pts[2][0], 0, pts[2][1]); provider.rotation.y = Math.PI; poseWalk(provider, 0, false); dirty = true; request(); };
      if (!smooth) { arrive(); return Promise.resolve(); }
      const seg = []; let len = 0;
      for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
      return new Promise((resolve) => { fig = { t0: performance.now(), dur: (len / 0.95) * 1000, pts, seg, len, resolve }; request(); });
    },
    finishFigure() { const f = fig; if (!f) return; fig = null; const e = f.pts[f.pts.length - 1]; provider.position.set(e[0], 0, e[1]); provider.rotation.y = Math.PI; poseWalk(provider, 0, false); dirty = true; request(); f.resolve && f.resolve(); },
    hideProvider() { fig = null; provider.visible = false; dirty = true; request(); },
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
