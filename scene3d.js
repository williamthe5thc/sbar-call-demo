// The 3D bedside room, built only from Three.js primitives and procedural textures.
// No models, no image files. The canvas conveys nothing the page does not already say
// in HTML: every finding, label and value is real text outside the canvas. The hotspots
// are the same <button>s as the 2D view; this module only moves them to follow the objects.
import * as THREE from './vendor/three/three.module.min.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { monitorData } from './illustrations.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/* ---------- small builders ---------- */

export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...o });
const glass = (color, opacity = 0.35, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0, transparent: true, opacity, depthWrite: false, ...o });
const shadowy = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
const put = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = shadowy(new THREE.Mesh(geo, mat)); m.position.set(x, y, z); parent.add(m); return m; };
const box = (p, w, h, d, mat, x, y, z) => put(p, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const cyl = (p, rt, rb, h, mat, x, y, z, seg = 20) => put(p, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
const sph = (p, r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = put(p, new THREE.SphereGeometry(r, 28, 18), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
const UP = new THREE.Vector3(0, 1, 0);
function limb(p, a, b, r, mat) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = put(p, new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.001), 6, 14), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return m;
}
function tube(p, pts, r, mat) {
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
  return put(p, new THREE.TubeGeometry(curve, 48, r, 7, false), mat);
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return { tex: t, ctx, canvas: c };
}

// Small deterministic random numbers so the sky looks the same every time.
export function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

/* ---------- procedural textures ---------- */

const floorTexture = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#3b4658'; g.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 3 + r() * 10, 2 + r() * 6); }
  g.strokeStyle = 'rgba(10,16,28,.55)'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
});

const wallTexture = () => canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#556a86'); gr.addColorStop(1, '#6b7f98');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(11);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.035})`; g.fillRect(r() * w, r() * h, 2 + r() * 12, 2 + r() * 12); }
});

const skyTexture = () => canvasTex(512, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#07122b'); gr.addColorStop(0.7, '#16294f'); gr.addColorStop(1, '#2a3f68');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(3);
  for (let i = 0; i < 110; i++) { g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.6})`; const s = r() > 0.9 ? 2.4 : 1.3; g.fillRect(r() * w, r() * h * 0.7, s, s); }
  const glow = g.createRadialGradient(130, 120, 4, 130, 120, 110);
  glow.addColorStop(0, 'rgba(255,250,220,.55)'); glow.addColorStop(1, 'rgba(255,250,220,0)');
  g.fillStyle = glow; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(130, 120, 26, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#0b1220';
  let x = 0;
  const r2 = rng(5);
  while (x < w) { const bw = 28 + r2() * 46, bh = 70 + r2() * 120; g.fillRect(x, h - bh, bw, bh); x += bw + 2; }
  const r3 = rng(9);
  for (let i = 0; i < 90; i++) { g.fillStyle = r3() > 0.3 ? '#ffd27a' : '#9fd0ff'; g.fillRect(r3() * w, h - 10 - r3() * 150, 3, 4); }
});

const clockTexture = () => canvasTex(256, 256, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#f2f4f7'; g.beginPath(); g.arc(c, c, c - 6, 0, 7); g.fill();
  g.strokeStyle = '#27303c'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#27303c';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillRect(c + Math.sin(a) * 100 - 4, c - Math.cos(a) * 100 - 4, 8, 8); }
  g.lineCap = 'round'; g.strokeStyle = '#1b222c';
  g.lineWidth = 12; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(Math.PI / 3) * 58, c - Math.cos(Math.PI / 3) * 58); g.stroke(); // 2:00
  g.lineWidth = 7; g.beginPath(); g.moveTo(c, c); g.lineTo(c, c - 92); g.stroke();
});

function screenTexture(label, color) {
  return canvasTex(128, 80, (g, w, h) => {
    g.fillStyle = '#06121a'; g.fillRect(0, 0, w, h);
    g.fillStyle = color; g.font = 'bold 30px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(label, w / 2, 38);
    g.fillRect(14, 52, w - 28, 8); g.fillStyle = '#06121a'; g.fillRect(14 + (w - 28) * 0.62, 52, 4, 8);
  }).tex;
}

/* ---------- the patient monitor, drawn from the scenario's vitals ---------- */

function ecg(p) {
  const g = (c, w, a) => a * Math.exp(-Math.pow((p - c) / w, 2));
  return g(0.16, 0.035, 0.14) + g(0.27, 0.011, -0.12) + g(0.3, 0.012, 1) + g(0.335, 0.012, -0.28) + g(0.56, 0.05, 0.26);
}

function makeMonitor(data) {
  const hr = parseFloat(data.last.hr) || 70;
  const { tex, ctx, canvas } = canvasTex(512, 320, () => {});
  const W = canvas.width, H = canvas.height, tw = 330;
  function draw(t) {
    ctx.fillStyle = '#04090f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,170,220,.16)'; ctx.lineWidth = 1;
    for (let x = 0; x <= tw; x += 33) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(tw, y); ctx.stroke(); }
    const speed = 120;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6dff9c'; ctx.lineWidth = 3.5; ctx.beginPath();
    for (let x = 0; x < tw - 8; x += 2) {
      const tt = t - (tw - x) / speed;
      const ph = ((tt * hr / 60) % 1 + 1) % 1;
      const y = 112 - ecg(ph) * 82;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x < tw - 8; x += 3) {
      const tt = t - (tw - x) / speed;
      const ph = ((tt * hr / 60) % 1 + 1) % 1;
      const y = 250 - (Math.pow(Math.sin(Math.PI * Math.min(1, ph * 1.6)), 2) * 0.9 + (ph > 0.55 ? 0.12 * Math.sin((ph - 0.55) * 14) : 0)) * 44;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = '600 20px system-ui, sans-serif';
    const row = (y, label, val, color, size = 78) => {
      ctx.fillStyle = '#c9d6e8'; ctx.font = '600 20px system-ui, sans-serif'; ctx.fillText(label, 348, y);
      ctx.fillStyle = color; ctx.font = `700 ${size}px system-ui, sans-serif`; ctx.fillText(val, 348, y + size * 0.82);
    };
    row(24, 'HR /min', data.last.hr, '#ffb454');
    row(130, 'BP mmHg', data.last.bp, '#7fd4ff', 52);
    row(214, 'RR', data.last.rr, '#e8eef7', 36);
    ctx.fillStyle = '#c9d6e8'; ctx.font = '600 20px system-ui, sans-serif'; ctx.fillText('SpO2', 430, 214);
    ctx.fillStyle = '#7ee2a0'; ctx.font = '700 36px system-ui, sans-serif'; ctx.fillText(data.last.spo2, 430, 252);
    tex.needsUpdate = true;
  }
  draw(0);
  return { tex, draw };
}

/* ---------- the room ---------- */

// opts.noShell: skip the floor, walls and ceiling (the immersive scene builds its own, with richer textures).
export function buildRoom(scene, data, opts = {}) {
  const parts = {};
  const mWall = std(0xffffff, { map: wallTexture().tex, roughness: 0.95 });
  const mTrim = std(0xcfd8e6, { roughness: 0.7 });
  const mMetal = std(0xc3cfdd, { roughness: 0.32, metalness: 0.85 });
  const mDark = std(0x2a3340, { roughness: 0.55 });
  const mPlastic = std(0xe9eff6, { roughness: 0.38 });
  const mSheet = std(0xc7d3e2, { roughness: 0.92 });
  const mSkin = std(0xc58f6c, { roughness: 0.6 });

  const WZ = -1.45, H = 2.8;
  if (!opts.noShell) {
    // Floor
    const ft = floorTexture().tex; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(5, 4);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), std(0xffffff, { map: ft, roughness: 0.38, metalness: 0.05 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 0.8); floor.receiveShadow = true; scene.add(floor);

    // Walls, with an opening for the window
    const wallBox = (w, h, x, y) => box(scene, w, h, 0.1, mWall, x, y, WZ - 0.05);
    wallBox(9, 1.0, 0, 0.5);                      // below the window
    wallBox(9, H - 2.2, 0, 2.2 + (H - 2.2) / 2);  // above the window
    wallBox(5.4, 1.2, -1.8, 1.6);                 // left of the window (x -4.5 to 0.9)
    wallBox(2.4, 1.2, 3.3, 1.6);                  // right of the window (x 2.1 to 4.5)
    box(scene, 0.1, H, 8, mWall, -3.6, H / 2, 0.8);
    box(scene, 0.1, H, 8, mWall, 3.6, H / 2, 0.8);
    box(scene, 9, 0.12, 0.04, mTrim, 0, 0.06, WZ + 0.02); // baseboard
    box(scene, 9, 0.05, 0.05, mTrim, 0, 0.98, WZ + 0.03); // handrail
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), std(0x2a3446, { roughness: 1 }));
    ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, H, 0.8); scene.add(ceiling);
  }

  // Window: night sky, city lights, moon
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: skyTexture().tex, fog: false }));
  sky.position.set(1.5, 1.6, WZ - 0.25); scene.add(sky);
  const mFrame = std(0xdfe6f0, { roughness: 0.5 });
  box(scene, 1.28, 0.06, 0.14, mFrame, 1.5, 2.2, WZ + 0.0);
  box(scene, 1.28, 0.06, 0.14, mFrame, 1.5, 1.0, WZ + 0.0);
  box(scene, 0.06, 1.2, 0.14, mFrame, 0.9, 1.6, WZ + 0.0);
  box(scene, 0.06, 1.2, 0.14, mFrame, 2.1, 1.6, WZ + 0.0);
  box(scene, 0.04, 1.2, 0.1, mFrame, 1.5, 1.6, WZ + 0.0);
  box(scene, 1.28, 0.03, 0.1, mFrame, 1.5, 1.6, WZ + 0.0);
  box(scene, 1.45, 0.05, 0.3, mTrim, 1.5, 0.97, WZ + 0.12); // sill

  // Wall clock
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.17, 40), new THREE.MeshBasicMaterial({ map: clockTexture().tex, toneMapped: false }));
  clock.position.set(-0.55, 2.28, WZ + 0.02); scene.add(clock);

  // Privacy curtain on a ceiling track, partly drawn on the left
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0, 40, 8), std(0x5e9a96, { roughness: 1, side: THREE.DoubleSide }));
  curtain.position.set(-2.55, 1.35, -0.85); curtain.castShadow = true; curtain.receiveShadow = true; scene.add(curtain);
  const cBase = Float32Array.from(curtain.geometry.attributes.position.array);
  box(scene, 2.2, 0.04, 0.04, mMetal, -2.4, 2.37, -0.85);
  box(curtain, 1.0, 0.16, 0.012, std(0xe3eeee, { roughness: 1 }), 0, 0.92, 0.02);
  parts.curtain = { mesh: curtain, base: cBase };

  // Headwall unit with O2 and suction
  const hx = -1.1;
  box(scene, 1.5, 0.5, 0.08, std(0xd7dfea, { roughness: 0.5 }), hx, 1.25, WZ + 0.06);
  box(scene, 1.5, 0.05, 0.1, mMetal, hx, 1.52, WZ + 0.1);
  box(scene, 1.5, 0.05, 0.1, mMetal, hx, 0.98, WZ + 0.1);
  for (const [i, c] of [0x2e9e5b, 0xf0d24a, 0xdde4ee].entries()) {
    cyl(scene, 0.04, 0.04, 0.05, std(c, { roughness: 0.4 }), hx - 0.5 + i * 0.16, 1.32, WZ + 0.13).rotation.x = Math.PI / 2;
  }
  const fm = glass(0xcfe8f4, 0.55); // oxygen flowmeter
  cyl(scene, 0.03, 0.03, 0.26, fm, hx + 0.18, 1.3, WZ + 0.15);
  sph(scene, 0.016, std(0x2e9e5b), hx + 0.18, 1.3, WZ + 0.18);
  cyl(scene, 0.035, 0.035, 0.08, std(0x2e9e5b), hx + 0.18, 1.12, WZ + 0.15);
  cyl(scene, 0.09, 0.09, 0.3, glass(0xe7f1f7, 0.5), hx + 0.52, 1.25, WZ + 0.2); // suction canister
  cyl(scene, 0.092, 0.092, 0.05, std(0xf0d24a), hx + 0.52, 1.43, WZ + 0.2);

  // Reading lamp over the bed head
  const lampX = -1.0, lampY = 1.88;
  box(scene, 0.04, 0.34, 0.04, mMetal, lampX, 1.7, WZ + 0.08);
  limb(scene, [lampX, 1.86, WZ + 0.08], [lampX, 1.9, WZ + 0.4], 0.016, mMetal);
  const shade = cyl(scene, 0.05, 0.13, 0.12, std(0xf4e7cf, { roughness: 0.5 }), lampX, lampY, WZ + 0.45);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }));
  bulb.position.set(lampX, lampY - 0.07, WZ + 0.45); scene.add(bulb);
  parts.lampPos = new THREE.Vector3(lampX, lampY - 0.06, WZ + 0.45);
  shade.castShadow = false;

  // Bed (patient lies along x, head at left)
  const bed = new THREE.Group(); bed.position.set(0, 0, -0.55); scene.add(bed);
  const mFrameBed = std(0x9aa8b8, { roughness: 0.35, metalness: 0.6 });
  box(bed, 2.16, 0.1, 0.92, mFrameBed, 0, 0.34, 0);
  for (const x of [-0.95, 0.95]) for (const z of [-0.38, 0.38]) {
    cyl(bed, 0.04, 0.04, 0.26, mFrameBed, x, 0.19, z);
    cyl(bed, 0.05, 0.05, 0.05, mDark, x, 0.035, z).rotation.z = Math.PI / 2;
  }
  box(bed, 2.1, 0.16, 0.95, std(0x9fb3c9, { roughness: 0.8 }), 0, 0.54, 0); // mattress
  box(bed, 0.07, 0.62, 1.0, std(0x6e7f95, { roughness: 0.6 }), -1.1, 0.83, 0); // headboard
  box(bed, 0.06, 0.4, 1.0, std(0x6e7f95, { roughness: 0.6 }), 1.1, 0.74, 0); // footboard
  const rail = (x0, x1, z) => {
    const m = mMetal, y0 = 0.7, y1 = 0.98;
    limb(bed, [x0, y1, z], [x1, y1, z], 0.015, m);
    limb(bed, [x0, y0 + 0.08, z], [x1, y0 + 0.08, z], 0.015, m);
    for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 5) limb(bed, [x, y0 + 0.02, z], [x, y1, z], 0.013, m);
  };
  // The near-side rail is lowered, so the patient stays in view.
  rail(-1.0, 1.0, -0.5);   // far side

  // Pillow and patient
  const mGown = std(0x9fc4e6, { roughness: 0.88 });
  sph(bed, 0.2, std(0xf6f8fb, { roughness: 0.95 }), -0.86, 0.69, 0, 1.3, 0.38, 1.05);
  const patient = new THREE.Group(); bed.add(patient);
  const torso = sph(patient, 0.5, mGown, -0.17, 0.745, 0, 1, 0.24, 0.42);
  sph(patient, 0.19, mGown, -0.52, 0.73, 0.14, 1, 0.65, 1); // near shoulder
  sph(patient, 0.19, mGown, -0.52, 0.73, -0.14, 1, 0.65, 1); // far shoulder
  limb(patient, [-0.7, 0.72, 0], [-0.6, 0.72, 0], 0.062, mSkin); // neck
  const head = new THREE.Group(); head.position.set(-0.8, 0.8, 0.01); patient.add(head);
  sph(head, 0.112, mSkin, 0, 0, 0, 1.08, 0.96, 0.92);
  sph(head, 0.115, std(0x8c8f96, { roughness: 0.9 }), -0.035, -0.006, -0.005, 0.95, 0.95, 0.95); // gray hair, toward the crown
  sph(head, 0.018, mSkin, 0.065, 0.04, 0.085, 1, 1, 1.3); // nose
  sph(head, 0.022, std(0xb77d5e), 0.085, 0.0, 0.1, 1, 0.6, 0.7); // cheek
  for (const dz of [-0.04, 0.04]) sph(head, 0.011, std(0x2a1f1a), 0.045, 0.092, dz + 0.04, 1.5, 0.35, 0.7); // closed eyes
  // Near arm resting beside the body, forearm toward the camera
  limb(patient, [-0.5, 0.74, 0.29], [-0.24, 0.69, 0.34], 0.055, mGown); // upper arm
  limb(patient, [-0.24, 0.69, 0.34], [0.12, 0.665, 0.34], 0.045, mSkin); // forearm
  sph(patient, 0.052, mSkin, 0.17, 0.665, 0.34, 1.2, 0.7, 0.9); // hand
  // IV cannula and tape on the forearm
  cyl(patient, 0.012, 0.012, 0.04, std(0xffe08a), 0.0, 0.715, 0.34);
  box(patient, 0.07, 0.006, 0.05, std(0xf1e8d2), 0.0, 0.714, 0.34);
  // Surgical dressing on the abdomen, just above the sheet's folded edge
  const tTop = (x, z) => 0.745 + 0.12 * Math.sqrt(Math.max(0, 1 - Math.pow((x + 0.17) / 0.5, 2) - Math.pow(z / 0.21, 2)));
  box(patient, 0.17, 0.01, 0.11, std(0xfafcff, { roughness: 0.9 }), -0.14, tTop(-0.14, 0) + 0.004, 0);
  for (const dx of [-0.07, 0.07]) box(patient, 0.014, 0.006, 0.15, std(0xe9ddc5), -0.14 + dx, tTop(-0.14 + dx, 0) + 0.007, 0);

  // Sheet: a height field draped over the abdomen and legs, tucked in at the sides
  const SH = new THREE.PlaneGeometry(1.1, 1.3, 56, 30);
  SH.rotateX(-Math.PI / 2);
  const sp = SH.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i) + 0.55, z = sp.getZ(i);
    const leg = (z0) => Math.exp(-Math.pow((z - z0) / 0.12, 2));
    let y = 0.64
      + 0.11 * (leg(0.12) + leg(-0.12)) * smooth(0.3, 0.55, x) * (1 - 0.35 * smooth(0.95, 1.1, x))
      + 0.006 * Math.sin(x * 26 + z * 9) + 0.004 * Math.sin(z * 31 - x * 7);
    const t = 1 - Math.pow((x + 0.17) / 0.5, 2) - Math.pow(z / 0.21, 2); // inside the torso when t > 0
    const body = t > 0 ? 0.105 + 0.12 * (Math.sqrt(t) - 1) + 0.12 : 0.105 * Math.exp(t * 7);
    y = Math.max(y, 0.64 + body + 0.022 + 0.02 * Math.exp(-Math.pow((x - 0.03) / 0.035, 2)) * (t > -0.3 ? 1 : 0)); // follows the body, with a turned-down lip
    y = y + (0.42 - y) * smooth(0.47, 0.64, Math.abs(z));
    y = y + (0.42 - y) * smooth(1.03, 1.14, x);
    sp.setXYZ(i, x, y, z);
  }
  SH.computeVertexNormals();
  const sheet = shadowy(new THREE.Mesh(SH, mSheet)); bed.add(sheet);
  parts.sheet = sheet;

  // IV pole, pump and bag (world space, to the left)
  const iv = new THREE.Group(); iv.position.set(-1.55, 0, -0.1); scene.add(iv);
  cyl(iv, 0.016, 0.016, 2.0, mMetal, 0, 1.0, 0);
  cyl(iv, 0.05, 0.06, 0.04, mMetal, 0, 0.05, 0);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; limb(iv, [0, 0.05, 0], [Math.sin(a) * 0.27, 0.04, Math.cos(a) * 0.27], 0.015, mMetal); sph(iv, 0.028, mDark, Math.sin(a) * 0.27, 0.028, Math.cos(a) * 0.27); }
  limb(iv, [-0.2, 2.02, 0], [0.2, 2.02, 0], 0.012, mMetal);
  const bagG = new THREE.Group(); bagG.position.set(-0.12, 1.76, 0.0); iv.add(bagG);
  box(bagG, 0.19, 0.26, 0.05, glass(0xe9f4fb, 0.28), 0, 0, 0);
  const fluid = box(bagG, 0.17, 0.12, 0.04, glass(0x9fd9f2, 0.7, { roughness: 0.1 }), 0, -0.06, 0); // about half full
  limb(bagG, [0, 0.13, 0], [0, 0.26, 0], 0.007, mDark);
  cyl(bagG, 0.018, 0.018, 0.07, glass(0xe9f4fb, 0.6), 0, -0.15, 0);
  const pump = new THREE.Group(); pump.position.set(0.13, 1.3, 0.0); iv.add(pump);
  box(pump, 0.23, 0.3, 0.16, mPlastic, 0, 0, 0.0);
  const pscr = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.09), new THREE.MeshBasicMaterial({ map: screenTexture('RUN', '#7ee2a0'), toneMapped: false }));
  pscr.position.set(0, 0.07, 0.082); pump.add(pscr);
  box(pump, 0.14, 0.05, 0.02, std(0x5a7ca3), 0, -0.07, 0.085);
  cyl(pump, 0.035, 0.035, 0.1, mDark, 0.06, -0.19, 0.0);
  tube(iv, [[-0.12, 1.59, 0.02], [-0.1, 1.5, 0.06], [0.1, 1.4, 0.09], [0.1, 1.22, 0.09], [0.35, 1.0, 0.13], [0.9, 0.9, 0.24], [1.45, 0.82, 0.4]], 0.007, glass(0xeaf6fb, 0.7));

  // PCA pump on its own small stand, near the camera
  const pca = new THREE.Group(); pca.position.set(-1.12, 0, 0.3); scene.add(pca);
  cyl(pca, 0.015, 0.015, 0.78, mMetal, 0, 0.45, 0);
  cyl(pca, 0.14, 0.15, 0.03, mMetal, 0, 0.03, 0);
  box(pca, 0.3, 0.17, 0.2, std(0xdbe5f1, { roughness: 0.35 }), 0, 0.92, 0);
  box(pca, 0.14, 0.12, 0.012, glass(0x7fb0d8, 0.55), -0.06, 0.93, 0.104); // locked door
  const pcs = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.06), new THREE.MeshBasicMaterial({ map: screenTexture('PCA', '#7fd4ff'), toneMapped: false }));
  pcs.position.set(0.09, 0.945, 0.103); pca.add(pcs);
  sph(pca, 0.012, std(0x7ee2a0, { emissive: 0x7ee2a0, emissiveIntensity: 1 }), 0.1, 0.89, 0.104);
  tube(pca, [[-0.06, 0.84, 0.05], [-0.1, 0.65, 0.14], [0.2, 0.55, 0.2], [0.55, 0.62, 0.15], [1.0, 0.65, 0.0], [1.27, 0.7, -0.15]], 0.006, std(0xd8e2ec, { roughness: 0.3 }));

  // Monitor on a wall arm
  const mon = new THREE.Group(); mon.position.set(0.15, 1.62, WZ + 0.25); mon.rotation.x = -0.12; scene.add(mon);
  box(mon, 0.8, 0.52, 0.08, std(0x1e2630, { roughness: 0.4 }), 0, 0, 0);
  const mdata = makeMonitor(data);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.46), new THREE.MeshBasicMaterial({ map: mdata.tex, toneMapped: false }));
  screen.position.set(0, 0, 0.042); mon.add(screen);
  limb(scene, [0.15, 1.45, WZ + 0.05], [0.15, 1.55, WZ + 0.25], 0.025, mMetal);
  box(scene, 0.1, 0.1, 0.03, mMetal, 0.15, 1.42, WZ + 0.02);
  parts.monitorDraw = mdata.draw;
  parts.monitorPos = new THREE.Vector3(0.15, 1.58, WZ + 0.45);

  // Surgical drain: tubing from under the gown over the rail to a bulb
  const bulbMat = glass(0xf1f5f8, 0.4);
  tube(bed, [[0.24, 0.79, 0.2], [0.26, 0.77, 0.4], [0.28, 0.68, 0.52], [0.3, 0.56, 0.57], [0.3, 0.46, 0.57]], 0.009, glass(0xf2f2f2, 0.55));
  const jb = new THREE.Group(); jb.position.set(0.3, 0.34, 0.57); bed.add(jb);
  sph(jb, 0.095, bulbMat, 0, 0, 0, 1, 1.25, 0.9);
  sph(jb, 0.085, std(0xb3262d, { roughness: 0.2, transparent: true, opacity: 0.88, emissive: 0x3a0508, emissiveIntensity: 0.6 }), 0, -0.012, 0, 1, 1.12, 0.75);
  cyl(jb, 0.024, 0.024, 0.06, mPlastic, 0, 0.15, 0);

  // Urine bag hanging on the foot of the bed
  const ub = new THREE.Group(); ub.position.set(0.88, 0.33, 0.55); bed.add(ub);
  box(ub, 0.2, 0.3, 0.03, glass(0xeff6fa, 0.32), 0, 0, 0);
  box(ub, 0.18, 0.1, 0.022, glass(0xe6c445, 0.82, { emissive: 0x4a3a00, emissiveIntensity: 0.3 }), 0, -0.09, 0);
  limb(ub, [-0.05, 0.15, 0], [-0.05, 0.24, 0], 0.012, mDark);
  limb(ub, [0, -0.15, 0], [0, -0.19, 0.0], 0.012, mDark);
  tube(bed, [[0.7, 0.66, 0.15], [0.78, 0.6, 0.38], [0.83, 0.58, 0.54], [0.83, 0.57, 0.55], [0.83, 0.57, 0.55]], 0.008, glass(0xece08a, 0.8));
  tube(bed, [[0.83, 0.57, 0.55], [0.83, 0.5, 0.56], [0.83, 0.46, 0.55]], 0.008, glass(0xece08a, 0.8));

  // Overbed table with the chart
  const tb = new THREE.Group(); tb.position.set(1.52, 0, -0.1); scene.add(tb);
  parts.tableTop = box(tb, 0.9, 0.04, 0.45, std(0xc9b79a, { roughness: 0.45 }), 0, 0.95, 0);
  box(tb, 0.9, 0.012, 0.47, mMetal, 0, 0.925, 0);
  cyl(tb, 0.025, 0.025, 0.9, mMetal, 0.3, 0.47, 0);
  box(tb, 0.08, 0.04, 0.7, mMetal, 0.3, 0.04, 0);
  for (const z of [-0.3, 0.3]) sph(tb, 0.03, mDark, 0.3, 0.025, z);
  const clip = new THREE.Group(); clip.position.set(-0.05, 0.99, 0.02); clip.rotation.set(-0.12, 0.25, 0); tb.add(clip);
  box(clip, 0.26, 0.012, 0.34, std(0x7a5a3c, { roughness: 0.6 }), 0, 0, 0);
  box(clip, 0.23, 0.004, 0.3, std(0xfafbfd, { roughness: 0.9 }), 0, 0.008, 0.01);
  box(clip, 0.1, 0.016, 0.03, mMetal, 0, 0.012, -0.15);
  for (let i = 0; i < 6; i++) box(clip, 0.17 - (i % 2) * 0.04, 0.002, 0.008, std(0x7b8798), -0.01, 0.0105, -0.08 + i * 0.04);
  cyl(tb, 0.038, 0.032, 0.09, glass(0xe7f2f8, 0.55), 0.3, 1.0, 0.1); // cup
  cyl(tb, 0.01, 0.01, 0.14, std(0x5a8fcf), 0.28, 1.04, -0.1).rotation.z = 1.2; // pen

  // Breathing and curtain sway update
  parts.breathe = (t) => {
    const s = Math.sin(t * 1.5);
    torso.scale.set(1 + 0.006 * s, 0.24 * (1 + 0.07 * s), 0.42 * (1 + 0.025 * s));
    head.rotation.z = 0.01 * s;
  };
  parts.sway = (t) => {
    const pos = curtain.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = cBase[i * 3], y = cBase[i * 3 + 1];
      const hang = (1 - (y + 1) / 2);
      pos.setZ(i, 0.05 * Math.sin(x * 52) + hang * 0.018 * Math.sin(t * 0.9 + x * 4 + y));
    }
    pos.needsUpdate = true;
  };
  parts.sway(0);
  parts.patient = patient;
  return parts;
}

/* ---------- camera views ---------- */

const HOME_POS = new THREE.Vector3(0.2, 1.5, 3.0);
const HOME_LOOK = new THREE.Vector3(0.0, 0.9, -0.55);
const PIVOT = new THREE.Vector3(0, 0, -0.55);
const YAW_STEP = THREE.MathUtils.degToRad(13);
const MAX_YAW = 2;
// How close the camera comes for each object (metres from its anchor).
const CLOSE = { ivpump: 1.35, pca: 1.1, skin: 1.25, monitor: 1.7, ivsite: 0.95, drain: 1.05, dressing: 1.05, abdomen: 1.3, urine: 1.1, chart: 1.15 };

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function homeView(yawIdx) {
  const a = yawIdx * YAW_STEP;
  const pos = HOME_POS.clone().sub(PIVOT).applyAxisAngle(UP, a).add(PIVOT);
  const look = HOME_LOOK.clone().sub(PIVOT).applyAxisAngle(UP, a * 0.4).add(PIVOT);
  return { pos, look };
}

/* ---------- the scene controller ---------- */

export function createScene3D({ host, list, hotspots, chart, animating = true, reduced = false, onView, onLost }) {
  const data = monitorData(chart);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the room is static, so shadows are drawn once (cheap on weak GPUs)
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true'); // decorative: all information is HTML
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1220);
  scene.fog = new THREE.Fog(0x0a1220, 7, 16);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.16;

  const room = buildRoom(scene, data);

  // Lighting: warm lamp, cool monitor glow, moonlight, dim ambient
  scene.add(new THREE.HemisphereLight(0x8fa6cf, 0x2a2f3d, 0.38));
  const lamp = new THREE.SpotLight(0xffb066, 190, 9, 0.9, 0.85, 1.6);
  lamp.position.copy(room.lampPos); lamp.target.position.set(-0.45, 0.6, -0.5);
  lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); lamp.shadow.bias = -0.0006; lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target);
  const lampFill = new THREE.PointLight(0xffb36b, 5, 4.5, 2); lampFill.position.copy(room.lampPos).add(new THREE.Vector3(0, -0.1, 0.1)); scene.add(lampFill);
  const glow = new THREE.PointLight(0x74b9ff, 4.5, 4.2, 2); glow.position.copy(room.monitorPos); scene.add(glow);
  const moon = new THREE.DirectionalLight(0x86a6ff, 0.95);
  moon.position.set(2.6, 2.7, -1.2); moon.target.position.set(-0.4, 0.4, 0.2);
  moon.castShadow = true; moon.shadow.mapSize.set(512, 512);
  Object.assign(moon.shadow.camera, { left: -4, right: 4, top: 3.5, bottom: -3, near: 0.5, far: 12 });
  moon.shadow.bias = -0.0008; moon.shadow.radius = 5;
  scene.add(moon, moon.target);

  const camera = new THREE.PerspectiveCamera(42, 1.6, 0.1, 30);
  let yaw = 0;
  let current = 'home'; // 'home' or a hotspot id
  const hv = homeView(0);
  camera.position.copy(hv.pos);
  const camLook = hv.look.clone();
  camera.lookAt(camLook);

  const items = hotspots.map((h) => {
    const li = list.querySelector(`[data-id="${h.id}"]`)?.closest('li');
    return { id: h.id, p: new THREE.Vector3(...h.pos3d), li, w: 120, h: 44, x: 0, y: 0 };
  });
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  /* ---- sizing ---- */
  let W = 0, H = 0, narrow = false;
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    narrow = W < 640;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const base = 42, ref = 1.6; // keep the same horizontal view on tall, narrow canvases
    camera.fov = camera.aspect >= ref ? base : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(base / 2)) * ref / camera.aspect));
    camera.updateProjectionMatrix();
    for (const it of items) if (it.li) { it.w = it.li.offsetWidth || it.w; it.h = it.li.offsetHeight || it.h; }
    dirty = true; request();
  }

  /* ---- hotspot projection ---- */
  const v = new THREE.Vector3();
  function placeHotspots() {
    if (narrow || !W) return;
    camera.updateMatrixWorld();
    const mInv = camera.matrixWorldInverse;
    for (const it of items) {
      v.copy(it.p).applyMatrix4(mInv);
      let nx, ny;
      if (v.z < -0.15) {
        v.copy(it.p).project(camera); nx = v.x; ny = v.y;
      } else { // behind the camera: push toward the edge in the same screen direction
        const len = Math.hypot(v.x, v.y) || 1; nx = (v.x / len) * 3; ny = (v.y / len) * 3 - 0.2;
      }
      it.x = (nx * 0.5 + 0.5) * W;
      it.y = (-ny * 0.5 + 0.5) * H - it.h * 0.75; // label sits just above the object
    }
    const gap = 6;
    const clampAll = () => {
      for (const it of items) {
        it.x = Math.min(W - it.w / 2 - gap, Math.max(it.w / 2 + gap, it.x));
        it.y = Math.min(H - it.h / 2 - gap, Math.max(it.h / 2 + gap, it.y));
      }
    };
    clampAll();
    // Keep labels from covering each other: place them in order of height, moving a label
    // down (or up, near the bottom) past any label it would overlap.
    const order = items.map((_, i) => i).sort((p, q) => items[p].y - items[q].y || p - q);
    const placed = [];
    const hitOf = (it, y) => placed.find((o) => Math.abs(o.x - it.x) < (o.w + it.w) / 2 + gap && Math.abs(o.y - y) < (o.h + it.h) / 2 + gap);
    for (const i of order) {
      const it = items[i];
      let y = it.y;
      for (let k = 0, hit; k < 24 && (hit = hitOf(it, y)); k++) y = hit.y + (hit.h + it.h) / 2 + gap;
      if (y > H - it.h / 2 - gap) {
        y = it.y;
        for (let k = 0, hit; k < 24 && (hit = hitOf(it, y)); k++) y = hit.y - (hit.h + it.h) / 2 - gap;
        y = Math.max(y, it.h / 2 + gap);
      }
      it.y = y;
      placed.push(it);
    }
    for (const it of items) if (it.li) {
      it.li.style.setProperty('--x', `${it.x.toFixed(1)}px`);
      it.li.style.setProperty('--y', `${it.y.toFixed(1)}px`);
    }
  }

  /* ---- camera animation ---- */
  let anim = null;
  let instant = reduced;
  function viewFor(id) {
    if (id === 'home') return homeView(yaw);
    const it = byId[id];
    const home = homeView(yaw).pos;
    const dir = home.clone().sub(it.p).normalize(); dir.y = Math.max(dir.y, 0.4); dir.normalize();
    const d = CLOSE[id] || 1.2;
    return { pos: it.p.clone().addScaledVector(dir, d), look: it.p.clone().add(new THREE.Vector3(0, -0.02, 0)) };
  }
  function moveTo(id) {
    current = id;
    const to = viewFor(id);
    if (instant) {
      anim = null; camera.position.copy(to.pos); camLook.copy(to.look); camera.lookAt(camLook);
    } else {
      anim = { t0: performance.now(), dur: 800, p0: camera.position.clone(), l0: camLook.clone(), to };
    }
    host.dataset.cam = id; host.dataset.yaw = String(yaw); host.dataset.moving = String(!!anim);
    dirty = true; request();
    onView && onView({ view: id, yaw });
  }

  /* ---- render loop: on demand, 30 fps for idle animation ---- */
  let raf = 0, dirty = true, last = 0, disposed = false, onScreen = true, pageVisible = !document.hidden, active = true;
  let playing = animating, clockT = 0, lastTick = 0, frames = 0, lastMon = 0;
  function request() { if (!raf && !disposed && active && onScreen && pageVisible) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    if (disposed || !active) return;
    let moving = false;
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / anim.dur), e = ease(k);
      camera.position.lerpVectors(anim.p0, anim.to.pos, e);
      camLook.lerpVectors(anim.l0, anim.to.look, e);
      camera.lookAt(camLook);
      moving = k < 1;
      if (!moving) { anim = null; host.dataset.moving = 'false'; }
    }
    const idle = playing && !moving;
    if (idle && !dirty && now - last < 33) { request(); return; }
    if (playing) { clockT += lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0; room.breathe(clockT); room.sway(clockT); if (now - lastMon > 60) { room.monitorDraw(clockT); lastMon = now; } }
    lastTick = playing ? now : 0;
    renderer.render(scene, camera);
    placeHotspots();
    frames += 1; host.dataset.frames = String(frames);
    dirty = false; last = now;
    if (moving || playing) request();
  }

  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; if (onScreen) { lastTick = 0; dirty = true; request(); } });
  io.observe(host);
  const onVis = () => { pageVisible = !document.hidden; if (pageVisible) { lastTick = 0; dirty = true; request(); } };
  document.addEventListener('visibilitychange', onVis);
  const onCtxLost = (e) => { e.preventDefault(); onLost && onLost(); };
  canvas.addEventListener('webglcontextlost', onCtxLost);

  host.dataset.animating = String(playing);
  host.dataset.cam = 'home';
  resize();
  if (W) { renderer.render(scene, camera); placeHotspots(); dirty = false; frames = 1; host.dataset.frames = '1'; }

  return {
    select: (id) => moveTo(byId[id] ? id : 'home'),
    home: () => moveTo('home'),
    look(dir) {
      const n = Math.max(-MAX_YAW, Math.min(MAX_YAW, yaw + dir));
      if (n === yaw && current === 'home') return;
      yaw = n; moveTo('home');
    },
    get yaw() { return yaw; },
    get current() { return current; },
    maxYaw: MAX_YAW,
    setActive(on) { active = !!on; if (active) { lastTick = 0; dirty = true; request(); } }, // false while the 2D view is showing
    setPlaying(on) { playing = !!on; host.dataset.animating = String(playing); lastTick = 0; dirty = true; request(); },
    setInstant(on) { instant = !!on; if (on && anim) { anim = null; const to = viewFor(current); camera.position.copy(to.pos); camLook.copy(to.look); camera.lookAt(camLook); dirty = true; request(); } },
    refresh() { resize(); dirty = true; request(); },
    dispose() {
      disposed = true; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onCtxLost);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map && x.map.dispose(); x.dispose(); }); });
      pm.dispose(); renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* ignore */ }
      canvas.remove();
    },
  };
}
