// The walkable room for the immersive scene 1: a closed room (floor, four walls, ceiling,
// door) and the hallway with the nurses' station seen through the door. Everything is
// generated in code: procedural CanvasTextures and primitives, no files, no downloads.
// The existing bedside furniture comes from buildRoom() in scene3d.js (called with noShell).
import * as THREE from './vendor/three/three.module.min.js';
import { canvasTex, rng, std } from './scene3d.js';

export const ROOM = { x0: -3.6, x1: 3.6, z0: -1.45, z1: 4.0, h: 2.8 };
export const DOOR = { x0: 1.7, x1: 2.7, h: 2.1 };
export const HALL = { x0: -5, x1: 5, z0: 4.0, z1: 6.6 };

const repeat = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); t.anisotropy = 8; return t; };
const lightBox = (p, w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p.add(m); return m;
};

/* ---------- procedural textures ---------- */

// Vinyl tile floor: 2 x 2 tiles of 0.6 m per texture (1.2 m), speckle, faint streaks, grout.
export function vinylTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(21);
    g.fillStyle = '#8c97a4'; g.fillRect(0, 0, w, h);
    const n = 2, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const t = (r() - 0.5) * 0.09;
      g.fillStyle = t > 0 ? `rgba(255,255,255,${t})` : `rgba(0,0,20,${-t})`;
      g.fillRect(i * s, j * s, s, s);
    }
    for (let i = 0; i < 5200; i++) {
      const k = r();
      g.fillStyle = k < 0.4 ? `rgba(255,255,255,${0.05 + r() * 0.12})` : k < 0.8 ? `rgba(30,40,60,${0.04 + r() * 0.1})` : `rgba(120,160,200,${0.05 + r() * 0.1})`;
      const z = 1 + r() * 2.2; g.fillRect(r() * w, r() * h, z, z);
    }
    g.lineWidth = 1;
    for (let i = 0; i < 70; i++) { // faint mop streaks
      g.strokeStyle = `rgba(255,255,255,${0.015 + r() * 0.025})`;
      const x = r() * w, y = r() * h, l = 40 + r() * 140; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 30); g.stroke();
    }
    for (let i = 0; i <= n; i++) {
      const p = i * s;
      g.fillStyle = 'rgba(48,56,70,.85)'; g.fillRect(p - 2, 0, 4, h); g.fillRect(0, p - 2, w, 4);
      g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(p + 2, 0, 1.5, h); g.fillRect(0, p + 2, w, 1.5);
    }
  }).tex;
}

// Roller-painted wall (soft sage) with mottling.
export function paintTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(33);
    g.fillStyle = '#b9c9c6'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      const x = r() * w, y = r() * h, rad = 30 + r() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = r() > 0.5 ? '255,255,255' : '60,90,90';
      gr.addColorStop(0, `rgba(${c},${0.02 + r() * 0.035})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 3500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '40,70,70'},${r() * 0.05})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3); }
  }).tex;
}

// Wainscot: teal vinyl wall covering with vertical panel grooves every 0.6 m.
export function wainscotTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(41);
    g.fillStyle = '#5f8a90'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '10,40,50'},${r() * 0.06})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 4); }
    for (let i = 0; i < 2; i++) {
      const x = i * (w / 2);
      g.fillStyle = 'rgba(15,45,55,.5)'; g.fillRect(x, 0, 4, h);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + 4, 0, 2, h);
    }
  }).tex;
}

// Acoustic ceiling tiles on a T-bar grid, 2 x 2 tiles per texture.
export function ceilingTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(52);
    g.fillStyle = '#c4cad3'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(60,70,85,${0.08 + r() * 0.18})`; g.fillRect(r() * w, r() * h, 1.5 + r() * 1.5, 1.5); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.14})`; g.fillRect(r() * w, r() * h, 2 + r() * 8, 1); }
    for (let i = 0; i <= 2; i++) {
      const p = i * (w / 2);
      g.fillStyle = '#eef1f5'; g.fillRect(p - 4, 0, 8, h); g.fillRect(0, p - 4, w, 8);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(p + 4, 0, 3, h); g.fillRect(0, p + 4, w, 3);
    }
  }).tex;
}

// Wood grain for laminate and doors.
export function woodTexture(base = '#b88f5c', seed = 63) {
  return canvasTex(512, 256, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const y0 = r() * h, amp = 2 + r() * 7, fr = 0.008 + r() * 0.02, ph = r() * 6;
      g.strokeStyle = r() > 0.35 ? `rgba(70,40,15,${0.06 + r() * 0.16})` : `rgba(255,235,200,${0.05 + r() * 0.1})`;
      g.lineWidth = 0.6 + r() * 1.8; g.beginPath();
      for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * fr + ph) * amp + Math.sin(x * fr * 3.1 + ph) * amp * 0.25; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    for (let k = 0; k < 3; k++) { // knots
      const x = r() * w, y = r() * h;
      for (let q = 1; q < 6; q++) { g.strokeStyle = `rgba(60,32,12,${0.18 - q * 0.02})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, 5 * q, 2.4 * q, 0, 0, 7); g.stroke(); }
    }
  }).tex;
}

// Woven fabric. `pleats` > 0 adds soft vertical folds (curtain). Drawn near white so the
// material colour tints it.
export function fabricTexture({ pleats = 0, twill = false, seed = 71 } = {}) {
  return canvasTex(512, 512, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = '#eef1f3'; g.fillRect(0, 0, w, h);
    if (twill) {
      g.lineWidth = 1;
      for (let i = -h; i < w; i += 3) { g.strokeStyle = `rgba(90,110,140,${0.06 + r() * 0.05})`; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
    } else {
      for (let i = 0; i < w; i += 2) { g.fillStyle = `rgba(80,100,110,${0.05 + r() * 0.05})`; g.fillRect(i, 0, 1, h); }
      for (let j = 0; j < h; j += 2) { g.fillStyle = `rgba(80,100,110,${0.04 + r() * 0.05})`; g.fillRect(0, j, w, 1); }
    }
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.2})`; g.fillRect(r() * w, r() * h, 2, 1); }
    if (pleats) {
      for (let i = 0; i < pleats; i++) {
        const x = (i + 0.5) * (w / pleats);
        const gr = g.createLinearGradient(x - w / pleats / 2, 0, x + w / pleats / 2, 0);
        gr.addColorStop(0, 'rgba(0,10,20,.0)'); gr.addColorStop(0.55, 'rgba(0,10,20,.0)'); gr.addColorStop(0.9, 'rgba(0,10,20,.34)'); gr.addColorStop(1, 'rgba(0,10,20,.0)');
        g.fillStyle = gr; g.fillRect(x - w / pleats / 2, 0, w / pleats, h);
      }
    }
  }).tex;
}

const glowTexture = () => canvasTex(128, 128, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
}).tex;

function labelTexture(w, h, bg, fg, text, size) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = `700 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 2);
  }).tex;
}

function deskScreenTexture(seed) {
  return canvasTex(256, 160, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = '#0d2233'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d5d8a'; g.fillRect(0, 0, w, 16);
    for (let i = 0; i < 7; i++) { g.fillStyle = r() > 0.5 ? '#9ed1f0' : '#5aa0cc'; g.fillRect(12, 28 + i * 18, 40 + r() * 150, 7); }
    g.fillStyle = '#e9c46a'; g.fillRect(w - 60, 30, 46, 46);
  }).tex;
}

function whiteboardTexture() {
  return canvasTex(256, 144, (g, w, h) => {
    const r = rng(9);
    g.fillStyle = '#f5f7f9'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#9aa5b1'; g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 8); g.lineTo(i * w / 4, h - 8); g.stroke(); }
    g.beginPath(); g.moveTo(8, 34); g.lineTo(w - 8, 34); g.stroke();
    for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) { g.fillStyle = ['#2b5fa8', '#444', '#a83232', '#2d7a4f'][(c + k) % 4]; g.fillRect(c * w / 4 + 10, 44 + k * 22, 14 + r() * 36, 4); }
  }).tex;
}

/* ---------- the shell ---------- */

function quad(w, h, tw, th) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tw, uv.getY(i) * h / th);
  return g;
}

export function buildShell(scene) {
  const { x0, x1, z0, z1, h } = ROOM;
  const paint = std(0xffffff, { map: repeat(paintTexture(), 1, 1), roughness: 0.92 });
  const wain = std(0xffffff, { map: repeat(wainscotTexture(), 1, 1), roughness: 0.62 });
  const hallPaint = std(0xffffff, { map: paint.map, roughness: 0.9, color: 0xe4efff });
  const hallWain = std(0xffffff, { map: wain.map, roughness: 0.6, color: 0xe4efff });
  for (const m of [paint, wain, hallPaint, hallWain]) m.shadowSide = THREE.DoubleSide;
  const trim = std(0xdfe6ee, { roughness: 0.55 });
  const rail = std(0xcfb99a, { roughness: 0.5, map: woodTexture('#c9ae84', 5) });

  // A wall rectangle, split at the chair rail (1.0 m): wainscot below, paint above.
  function wallPart(face, fixed, a0, a1, y0, y1, hall = false) {
    const cut = 1.0;
    const seg = (ya, yb, mat, tw, th) => {
      if (yb - ya < 1e-4) return;
      const m = new THREE.Mesh(quad(a1 - a0, yb - ya, tw, th), mat);
      const c = (a0 + a1) / 2, cy = (ya + yb) / 2;
      if (face === '+z') m.position.set(c, cy, fixed);
      else if (face === '-z') { m.rotation.y = Math.PI; m.position.set(c, cy, fixed); }
      else if (face === '+x') { m.rotation.y = Math.PI / 2; m.position.set(fixed, cy, c); }
      else { m.rotation.y = -Math.PI / 2; m.position.set(fixed, cy, c); }
      m.castShadow = true; m.receiveShadow = true; scene.add(m);
    };
    if (y0 < cut) seg(y0, Math.min(y1, cut), hall ? hallWain : wain, 1.2, 1.0);
    if (y1 > cut) seg(Math.max(y0, cut), y1, hall ? hallPaint : paint, 1.5, 1.5);
  }

  // Floors
  const ft = repeat(vinylTexture(), (x1 - x0) / 1.2, (z1 - z0) / 1.2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), std(0xffffff, { map: ft, roughness: 0.34, metalness: 0.04 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); floor.receiveShadow = true; scene.add(floor);
  const hft = repeat(vinylTexture(), (HALL.x1 - HALL.x0) / 1.2, (HALL.z1 - HALL.z0) / 1.2);
  const hallFloor = new THREE.Mesh(new THREE.PlaneGeometry(HALL.x1 - HALL.x0, HALL.z1 - HALL.z0), std(0xe2ecf8, { map: hft, roughness: 0.28, metalness: 0.05 }));
  hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(0, 0, (HALL.z0 + HALL.z1) / 2); hallFloor.receiveShadow = true; scene.add(hallFloor);

  // Room walls (back wall has the window opening: x 0.9..2.1, y 1.0..2.2)
  wallPart('+z', z0, x0, x1, 0, 1.0);
  wallPart('+z', z0, x0, 0.9, 1.0, h);
  wallPart('+z', z0, 2.1, x1, 1.0, h);
  wallPart('+z', z0, 0.9, 2.1, 2.2, h);
  wallPart('+x', x0, z0, z1, 0, h);
  wallPart('-x', x1, z0, z1, 0, h);
  // Front wall with the door opening
  wallPart('-z', z1, x0, DOOR.x0, 0, h);
  wallPart('-z', z1, DOOR.x1, x1, 0, h);
  wallPart('-z', z1, DOOR.x0, DOOR.x1, DOOR.h, h);
  // Hallway walls (beyond the door)
  wallPart('-z', HALL.z1, HALL.x0, HALL.x1, 0, h, true);
  wallPart('+x', HALL.x0, HALL.z0, HALL.z1, 0, h, true);
  wallPart('-x', HALL.x1, HALL.z0, HALL.z1, 0, h, true);
  wallPart('+z', z1 + 0.02, HALL.x0, DOOR.x0, 0, h, true); // hallway side of the room's front wall
  wallPart('+z', z1 + 0.02, DOOR.x1, HALL.x1, 0, h, true);
  wallPart('+z', z1 + 0.02, DOOR.x0, DOOR.x1, DOOR.h, h, true);

  // Chair rail, baseboard and crown
  const run = (len, a, b, y, depth, ht, mat) => lightBox(scene, len, ht, depth, mat, a, y, b);
  const W = x1 - x0, D = z1 - z0;
  run(W, 0, z0 + 0.02, 1.0, 0.04, 0.06, rail); run(W, 0, z1 - 0.02, 1.0, 0.04, 0.06, rail);
  run(0.04, x0 + 0.02, (z0 + z1) / 2, 1.0, D, 0.06, rail); run(0.04, x1 - 0.02, (z0 + z1) / 2, 1.0, D, 0.06, rail);
  run(W, 0, z0 + 0.025, 0.06, 0.05, 0.12, trim); run(W, 0, z1 - 0.025, 0.06, 0.05, 0.12, trim);
  run(0.05, x0 + 0.025, (z0 + z1) / 2, 0.06, D, 0.12, trim); run(0.05, x1 - 0.025, (z0 + z1) / 2, 0.06, D, 0.12, trim);

  // Ceilings (room + hallway)
  const ceilMat = std(0xffffff, { map: repeat(ceilingTexture(), W / 1.2, D / 1.2), roughness: 1 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, h, (z0 + z1) / 2); scene.add(ceil);
  const hc = new THREE.Mesh(new THREE.PlaneGeometry(HALL.x1 - HALL.x0, HALL.z1 - HALL.z0), std(0xdde6f2, { map: repeat(ceilingTexture(), (HALL.x1 - HALL.x0) / 1.2, (HALL.z1 - HALL.z0) / 1.2), roughness: 1 }));
  hc.rotation.x = Math.PI / 2; hc.position.set(0, h, (HALL.z0 + HALL.z1) / 2); scene.add(hc);
  // Switched-off troffer lights in the room
  for (const [x, z] of [[-1.2, 0.9], [1.2, 0.9], [-1.2, 2.9], [1.2, 2.9]]) {
    lightBox(scene, 1.2, 0.03, 0.6, std(0xdfe5ec, { roughness: 0.6, emissive: 0x0a0c10 }), x, h - 0.015, z);
  }

  // Door frame, open door leaf (hinged at the right jamb, swung into the hallway), threshold
  const frameMat = std(0xe8edf3, { roughness: 0.5 });
  lightBox(scene, 0.07, DOOR.h + 0.06, 0.16, frameMat, DOOR.x0 - 0.02, (DOOR.h + 0.06) / 2, z1);
  lightBox(scene, 0.07, DOOR.h + 0.06, 0.16, frameMat, DOOR.x1 + 0.02, (DOOR.h + 0.06) / 2, z1);
  lightBox(scene, DOOR.x1 - DOOR.x0 + 0.1, 0.07, 0.16, frameMat, (DOOR.x0 + DOOR.x1) / 2, DOOR.h + 0.03, z1);
  lightBox(scene, DOOR.x1 - DOOR.x0, 0.012, 0.14, std(0xaab4c0, { metalness: 0.8, roughness: 0.3 }), (DOOR.x0 + DOOR.x1) / 2, 0.006, z1);
  // The leaf is opened a full half turn: it rests flat against the inside of the wall.
  const hinge = new THREE.Group(); hinge.position.set(DOOR.x1 + 0.03, 0, z1 - 0.08); hinge.rotation.y = Math.PI; scene.add(hinge);
  lightBox(hinge, 0.84, 2.04, 0.045, std(0xffffff, { map: woodTexture('#a98456', 17), roughness: 0.55 }), -0.42, 1.02, 0);
  lightBox(hinge, 0.04, 0.04, 0.1, std(0xc0c8d2, { metalness: 0.9, roughness: 0.25 }), -0.78, 1.0, 0.03);
  lightBox(hinge, 0.2, 0.3, 0.012, std(0x1c3550, { roughness: 0.4 }), -0.42, 1.55, 0.03); // small view panel on the door

  return { hallPaint };
}

/* ---------- hallway and nurses' station (visible through the door, not reachable in scene 1) ---------- */

export function buildHallway(scene) {
  const hallWood = std(0xffffff, { map: woodTexture('#b99a6c', 81), roughness: 0.4 });
  const teal = std(0x477a83, { roughness: 0.5 });
  const dark = std(0x26303d, { roughness: 0.6 });
  const metal = std(0xc3cfdd, { roughness: 0.32, metalness: 0.85 });
  const z = HALL.z1;
  const stationX = 2.1;

  // Ceiling lights in the hallway: on, cool white, simple emissive panels
  const lit = new THREE.MeshBasicMaterial({ color: 0xe9f5ff, toneMapped: false });
  for (const [x, zz] of [[0.4, 5.0], [3.6, 5.0], [-2.8, 5.0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.45), lit); m.position.set(x, ROOM.h - 0.015, zz); scene.add(m);
  }

  // Counter (transaction top toward the hallway), desk, chair, screens, lamp, phone
  const grp = new THREE.Group(); scene.add(grp);
  lightBox(grp, 3.6, 1.06, 0.1, teal, stationX, 0.53, 5.7);                // front panel
  lightBox(grp, 3.7, 0.05, 0.55, hallWood, stationX, 1.085, 5.82);          // counter top
  lightBox(grp, 0.1, 1.06, 0.9, teal, stationX - 1.8, 0.53, 6.1);           // end panels
  lightBox(grp, 0.1, 1.06, 0.9, teal, stationX + 1.8, 0.53, 6.1);
  lightBox(grp, 3.4, 0.04, 0.7, hallWood, stationX, 0.75, 6.2);             // desk
  lightBox(grp, 0.5, 0.72, 0.6, dark, stationX + 1.45, 0.38, 6.2);          // drawers
  // Screens turned a little toward the hallway
  for (const [dx, ry, seed] of [[-0.55, 0.35, 3], [0.45, -0.35, 5]]) {
    const s = new THREE.Group(); s.position.set(stationX + dx, 1.0, 6.18); s.rotation.y = Math.PI + ry; grp.add(s);
    lightBox(s, 0.52, 0.34, 0.03, dark, 0, 0, 0);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), new THREE.MeshBasicMaterial({ map: deskScreenTexture(seed), toneMapped: false }));
    scr.position.set(0, 0, 0.017); s.add(scr);
    lightBox(s, 0.05, 0.18, 0.04, metal, 0, -0.22, -0.02);
  }
  lightBox(grp, 0.4, 0.015, 0.14, dark, stationX - 0.1, 0.77, 5.95);        // keyboard
  lightBox(grp, 0.2, 0.08, 0.18, std(0xe9eff6), stationX + 1.05, 0.8, 6.0);   // phone
  lightBox(grp, 0.2, 0.03, 0.05, std(0xdde4ee), stationX + 1.05, 0.865, 6.0);
  // Desk lamp
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }));
  lampBulb.position.set(stationX - 1.3, 1.02, 6.0); grp.add(lampBulb);
  lightBox(grp, 0.1, 0.02, 0.1, metal, stationX - 1.3, 0.78, 6.15);
  lightBox(grp, 0.02, 0.26, 0.02, metal, stationX - 1.3, 0.91, 6.15);
  lightBox(grp, 0.16, 0.04, 0.14, std(0xe8d8b8, { emissive: 0x6a5632 }), stationX - 1.3, 1.03, 6.05);
  // Chair
  const chair = new THREE.Group(); chair.position.set(stationX - 0.1, 0, 6.2 - 0.0); grp.add(chair);
  lightBox(chair, 0.46, 0.07, 0.46, std(0x1d3a5c, { roughness: 0.8 }), 0, 0.5, -0.35);
  lightBox(chair, 0.44, 0.5, 0.07, std(0x1d3a5c, { roughness: 0.8 }), 0.0, 0.8, -0.58);
  lightBox(chair, 0.04, 0.4, 0.04, metal, 0, 0.27, -0.35);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; lightBox(chair, 0.3, 0.025, 0.035, metal, Math.sin(a) * 0.14, 0.05, -0.35 + Math.cos(a) * 0.14).rotation.y = a; }
  // Wall behind: whiteboard, clock, sign
  lightBox(grp, 1.5, 0.84, 0.03, std(0xffffff, { map: whiteboardTexture(), roughness: 0.35 }), stationX - 0.9, 1.7, z - 0.03);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.26), new THREE.MeshBasicMaterial({ map: labelTexture(512, 84, '#16314f', '#f3f7fb', "NURSES' STATION", 46), toneMapped: false }));
  sign.position.set(stationX + 0.8, 2.3, z - 0.02); sign.rotation.y = Math.PI; grp.add(sign);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshBasicMaterial({ color: 0xf1f4f7 }));
  clock.position.set(stationX + 1.45, 1.8, z - 0.02); clock.rotation.y = Math.PI; grp.add(clock);
  // Medication cart in the hallway
  const cart = new THREE.Group(); cart.position.set(-0.9, 0, 5.1); grp.add(cart);
  lightBox(cart, 0.7, 0.8, 0.45, std(0xd9e1ea, { roughness: 0.4 }), 0, 0.5, 0);
  lightBox(cart, 0.72, 0.03, 0.47, metal, 0, 0.92, 0);
  for (let i = 0; i < 4; i++) lightBox(cart, 0.6, 0.15, 0.01, std(i % 2 ? 0x5a8fcf : 0x2e9e5b, { roughness: 0.4 }), 0, 0.22 + i * 0.18, 0.226);
  // Hallway handrail along the far wall and a green exit sign
  lightBox(grp, 5.5, 0.05, 0.05, std(0xcfb99a, { roughness: 0.5 }), stationX - 3.2, 0.95, z - 0.06);
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16), new THREE.MeshBasicMaterial({ map: labelTexture(256, 100, '#0d6b36', '#ffffff', 'EXIT', 54), toneMapped: false }));
  exit.position.set(-3.5, 2.5, z - 0.02); exit.rotation.y = Math.PI; grp.add(exit);

  return { stationX, group: grp };
}

/* ---------- soft glows (sprites, no bloom pass) ---------- */

export function addGlow(scene, pos, color, size, opacity) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  sp.position.copy(pos); sp.scale.set(size, size, 1); sp.userData.glow = true; scene.add(sp); return sp;
}

/* ---------- surface upgrades on the existing furniture ---------- */

export function upgradeSurfaces(parts) {
  const c = parts.curtain.mesh.material;
  c.map = repeat(fabricTexture({ pleats: 8, seed: 5 }), 1, 1); c.color.set(0x68a8a3); c.roughness = 1; c.needsUpdate = true;
  const s = parts.sheet.material;
  s.map = repeat(fabricTexture({ twill: true, seed: 8 }), 3, 3); s.color.set(0x9fb2cc); s.roughness = 0.95; s.needsUpdate = true;
  const t = parts.tableTop.material;
  t.map = woodTexture('#b88a55', 12); t.color.set(0xffffff); t.roughness = 0.38; t.needsUpdate = true;
}
