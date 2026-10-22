// The hallway and the nurses' station for the immersive scene 2: a counter, a desk with a phone
// and a computer showing a simple EHR screen drawn from the scenario's chart, a chair, a warm
// task light, and the provider who walks to Room 12 at the end. All primitives and
// CanvasTextures: no models, no files. The canvas is decorative (aria-hidden); the chart on the
// EHR screen is also text in the call notepad's Chart section.
import * as THREE from './vendor/three/three.module.min.js';
import { canvasTex, rng, std } from './scene3d.js';
import { ROOM, HALL, DOOR, lightBox, woodTexture, labelTexture, whiteboardTexture } from './room1.js';

export const STATION = {
  // Where things are, in metres, so the world can place spots, lights and collision.
  counter: [1.2, 5.1, 5.0, 5.84],      // x0 z0 x1 z1 (the front counter)
  sidePanel: [4.9, 5.2, 5.02, 8.0],
  desk: [0.55, 7.2, 4.85, 8.0],
  chair: { x: 1.7, z: 7.0 },
  cart: [-1.8, 4.7, -1.0, 5.2],
  phone: { x: 3.55, y: 0.8, z: 7.5 },
  screen: { x: 2.35, y: 1.07, z: 7.8 },
  lamp: { x: 0.95, y: 1.18, z: 7.55 },
};

/* ---------- the EHR screen: a CanvasTexture drawn from the scenario's chart ---------- */

function wrap(g, text, x, y, maxW, lh, maxLines) {
  const words = String(text).split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((l, i, arr) => g.fillText(i === arr.length - 1 && lines.length > maxLines ? `${l}...` : l, x, y + i * lh));
}

export function ehrTexture(chart) {
  const first = chart.vitals[0], last = chart.vitals[chart.vitals.length - 1];
  const short = (c) => c.replace(/\s*\(.*\)/, '').replace('Drain output', 'Drain');
  return canvasTex(640, 400, (g, w, h) => {
    g.fillStyle = '#eef3f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b4f7d'; g.fillRect(0, 0, w, 44);
    g.fillStyle = '#ffffff'; g.font = '700 22px system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillText('EHR  |  Patient chart', 16, 23);
    g.textAlign = 'right'; g.font = '600 18px system-ui, sans-serif'; g.fillText(last.time, w - 16, 23); g.textAlign = 'left';
    g.fillStyle = '#dce6f0'; g.fillRect(0, 44, w, 34);
    g.fillStyle = '#10243a'; g.font = '700 19px system-ui, sans-serif'; g.fillText(chart.patient, 16, 62);
    // Vital signs: label, first row, latest row
    g.fillStyle = '#10243a'; g.font = '700 17px system-ui, sans-serif'; g.textBaseline = 'alphabetic';
    let y = 106;
    g.fillText('Vital signs', 16, y);
    g.textAlign = 'right'; g.fillText(first.time, 440, y); g.fillText(last.time, 610, y); g.textAlign = 'left';
    g.fillStyle = '#9fb3c6'; g.fillRect(16, y + 8, w - 32, 2);
    g.font = '500 17px system-ui, sans-serif';
    chart.vitalsColumns.forEach((c, i) => {
      y += 24;
      if (i % 2 === 0) { g.fillStyle = '#e3ebf3'; g.fillRect(16, y - 17, w - 32, 24); }
      g.fillStyle = '#10243a'; g.textAlign = 'left'; g.fillText(short(c), 24, y);
      g.textAlign = 'right';
      g.fillText(first.values[i], 440, y);
      g.fillStyle = i === 0 || i === 1 ? '#a01818' : '#10243a'; g.font = '700 17px system-ui, sans-serif';
      g.fillText(last.values[i], 610, y); g.font = '500 17px system-ui, sans-serif';
    });
    g.textAlign = 'left';
    y += 34;
    g.fillStyle = '#10243a'; g.font = '700 17px system-ui, sans-serif'; g.fillText('Latest nursing note', 16, y);
    g.font = '500 16px system-ui, sans-serif';
    wrap(g, chart.notes[0], 16, y + 24, w - 32, 21, 2);
  }).tex;
}

/* ---------- small makers ---------- */

const metal = () => std(0xc3cfdd, { roughness: 0.32, metalness: 0.85 });

function deskPhone(parent, p) {
  const g = new THREE.Group(); g.position.set(p.x, p.y - 0.04, p.z); g.rotation.y = Math.PI + 0.25; parent.add(g);
  const body = std(0xdfe5ee, { roughness: 0.4 }), dark = std(0x1d242e, { roughness: 0.5 });
  lightBox(g, 0.24, 0.06, 0.22, body, 0, 0.03, 0);                         // base
  lightBox(g, 0.2, 0.012, 0.12, dark, 0, 0.066, 0.02);                     // keypad pad
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) lightBox(g, 0.025, 0.008, 0.02, std(0xf4f7fb), -0.05 + i * 0.05, 0.073, -0.02 + j * 0.032);
  const hs = lightBox(g, 0.07, 0.045, 0.27, body, 0.0, 0.09, -0.0);        // handset across the top
  hs.position.set(0, 0.095, 0.0);
  lightBox(g, 0.08, 0.05, 0.07, body, 0, 0.09, 0.12);
  lightBox(g, 0.08, 0.05, 0.07, body, 0, 0.09, -0.12);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7dff9a, toneMapped: false }));
  led.position.set(0.1, 0.066, -0.08); g.add(led);
  return g;
}

function computer(parent, s, chart) {
  const g = new THREE.Group(); g.position.set(s.x, 0.76, s.z); parent.add(g);
  const dark = std(0x1c232d, { roughness: 0.5 });
  lightBox(g, 0.3, 0.015, 0.2, dark, 0, 0.008, 0);
  lightBox(g, 0.05, 0.22, 0.04, dark, 0, 0.12, 0.02);
  const frame = lightBox(g, 0.7, 0.45, 0.03, dark, 0, 0.42, 0);
  frame.position.set(0, 0.42, 0);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.4), new THREE.MeshBasicMaterial({ map: ehrTexture(chart), toneMapped: false }));
  scr.position.set(0, 0.42, -0.017); scr.rotation.y = Math.PI; g.add(scr);
  g.rotation.y = 0.0;
  return g;
}

function chairMesh(parent, c) {
  const g = new THREE.Group(); g.position.set(c.x, 0, c.z); g.rotation.y = 0.5; parent.add(g);
  const fabric = std(0x1d3a5c, { roughness: 0.85 });
  lightBox(g, 0.5, 0.08, 0.48, fabric, 0, 0.5, 0);
  lightBox(g, 0.46, 0.5, 0.08, fabric, 0, 0.82, -0.26);
  lightBox(g, 0.05, 0.4, 0.05, metal(), 0, 0.27, 0);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const sp = lightBox(g, 0.3, 0.025, 0.04, metal(), Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); sp.rotation.y = a; }
  lightBox(g, 0.05, 0.04, 0.3, std(0x10151d), 0.27, 0.68, 0.0); lightBox(g, 0.05, 0.04, 0.3, std(0x10151d), -0.27, 0.68, 0.0);
  return g;
}

function taskLamp(parent, l) {
  const g = new THREE.Group(); g.position.set(l.x, 0.76, l.z); parent.add(g);
  const m = metal();
  lightBox(g, 0.18, 0.02, 0.18, m, 0, 0.01, 0);
  const a = lightBox(g, 0.018, 0.34, 0.018, m, 0, 0.18, 0); a.rotation.z = -0.25; a.position.x = 0.04;
  const b = lightBox(g, 0.018, 0.3, 0.018, m, 0, 0.0, 0); b.rotation.z = 1.05; b.position.set(0.12, 0.38, 0);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 20, 1, true), std(0xf2e2c2, { roughness: 0.6, side: THREE.DoubleSide, emissive: 0x8a6a30, emissiveIntensity: 0.9 }));
  shade.position.set(0.24, 0.42, 0); shade.rotation.z = Math.PI + 0.1; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }));
  bulb.position.set(0.24, 0.395, 0); g.add(bulb);
  return g;
}

/* ---------- the hallway and the station ---------- */

export function buildHallway(scene, chart) {
  const hallWood = std(0xffffff, { map: woodTexture('#7d6446', 81), roughness: 0.4 });
  const teal = std(0x477a83, { roughness: 0.5 });
  const dark = std(0x26303d, { roughness: 0.6 });
  const steel = metal();
  const z = HALL.z1;
  const grp = new THREE.Group(); scene.add(grp);

  // Ceiling lights in the hallway: on, cool white
  const lit = new THREE.MeshBasicMaterial({ color: 0xeef7ff, toneMapped: false });
  const lights = [];
  for (const x of [-4.4, -1.6, 1.2, 4.0]) for (const zz of [5.0, 7.0]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.45), lit); m.position.set(x, ROOM.h - 0.015, zz); scene.add(m); lights.push([x, zz]);
  }

  // Counter with a transaction top toward the hallway, side panel, desk behind it
  const [cx0, cz0, cx1] = STATION.counter;
  const cw = cx1 - cx0 - 0.1, ccx = (cx0 + cx1) / 2;
  lightBox(grp, cw, 1.06, 0.1, teal, ccx, 0.53, cz0 + 0.1);
  lightBox(grp, cw + 0.1, 0.05, 0.64, hallWood, ccx, 1.085, cz0 + 0.42);
  lightBox(grp, cw, 0.03, 0.1, std(0x10151d), ccx, 0.015, cz0 + 0.1);
  lightBox(grp, 0.1, 1.06, 2.7, teal, 4.97, 0.53, 6.65);
  const [dx0, dz0, dx1, dz1] = STATION.desk;
  lightBox(grp, dx1 - dx0, 0.04, dz1 - dz0, hallWood, (dx0 + dx1) / 2, 0.74, (dz0 + dz1) / 2);
  lightBox(grp, 0.05, 0.72, dz1 - dz0 - 0.05, teal, dx0 + 0.03, 0.37, (dz0 + dz1) / 2);
  lightBox(grp, 0.55, 0.72, dz1 - dz0 - 0.05, dark, dx1 - 0.3, 0.37, (dz0 + dz1) / 2);
  for (const dz of [0.0]) lightBox(grp, 0.4, 0.015, 0.012, steel, dx1 - 0.3, 0.55, dz0 - 0.01 + dz);
  lightBox(grp, dx1 - dx0 - 0.6, 0.02, 0.04, std(0x10151d), (dx0 + dx1 - 0.6) / 2, 0.025, dz0 + 0.03);

  // Desk top: computer (the EHR), keyboard, phone, task lamp, mug, papers
  computer(grp, STATION.screen, chart);
  lightBox(grp, 0.42, 0.018, 0.14, dark, STATION.screen.x, 0.77, STATION.screen.z - 0.38);
  lightBox(grp, 0.1, 0.015, 0.08, dark, STATION.screen.x + 0.35, 0.77, STATION.screen.z - 0.38);
  const phone = deskPhone(grp, STATION.phone);
  taskLamp(grp, STATION.lamp);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 16), std(0xe8ecf1, { roughness: 0.4 }));
  mug.position.set(1.65, 0.8, 7.55); grp.add(mug);
  lightBox(grp, 0.3, 0.012, 0.22, std(0xf3f5f8), 4.3, 0.766, 7.5).rotation.y = 0.2;
  lightBox(grp, 0.28, 0.012, 0.2, std(0xe5eaf0), 4.28, 0.778, 7.52).rotation.y = -0.15;
  lightBox(grp, 0.24, 0.02, 0.32, std(0x5a7fb0, { roughness: 0.6 }), 3.0, 0.77, 7.3).rotation.y = 0.12; // clipboard
  chairMesh(grp, STATION.chair);

  // Wall behind: whiteboard, clock, sign
  lightBox(grp, 1.7, 0.9, 0.03, std(0xffffff, { map: whiteboardTexture(), roughness: 0.35 }), 2.5, 1.85, z - 0.03);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.3), new THREE.MeshBasicMaterial({ map: labelTexture(512, 86, '#16314f', '#f3f7fb', "NURSES' STATION", 46), toneMapped: false }));
  sign.position.set(3.0, 2.45, z - 0.02); sign.rotation.y = Math.PI; grp.add(sign);
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.17, 32), new THREE.MeshBasicMaterial({ color: 0xf1f4f7, toneMapped: false }));
  clock.position.set(4.2, 1.9, z - 0.02); clock.rotation.y = Math.PI; grp.add(clock);
  lightBox(grp, 0.012, 0.1, 0.01, dark, 4.2, 1.93, z - 0.03); lightBox(grp, 0.08, 0.012, 0.01, dark, 4.23, 1.9, z - 0.03);

  // Hallway: medication cart, handrails, exit sign, room plates, closed doors, sanitizer
  const cart = new THREE.Group(); cart.position.set(-1.4, 0, 4.95); cart.rotation.y = 0.15; grp.add(cart);
  lightBox(cart, 0.7, 0.8, 0.45, std(0xd9e1ea, { roughness: 0.4 }), 0, 0.5, 0);
  lightBox(cart, 0.72, 0.03, 0.47, steel, 0, 0.92, 0);
  for (let i = 0; i < 4; i++) lightBox(cart, 0.6, 0.15, 0.01, std(i % 2 ? 0x5a8fcf : 0x2e9e5b, { roughness: 0.4 }), 0, 0.22 + i * 0.18, 0.226);
  lightBox(grp, 8.0, 0.05, 0.05, std(0xcfb99a, { roughness: 0.5 }), -2.0, 0.95, z - 0.06);
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.17), new THREE.MeshBasicMaterial({ map: labelTexture(256, 100, '#0d6b36', '#ffffff', 'EXIT', 54), toneMapped: false }));
  exit.position.set(-4.6, 2.45, z - 0.02); exit.rotation.y = Math.PI; grp.add(exit);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ map: labelTexture(200, 96, '#16314f', '#f3f7fb', '12', 62), toneMapped: false }));
  plate.position.set(DOOR.x0 - 0.3, 1.55, ROOM.z1 + 0.035); grp.add(plate);
  const doorMat = std(0xffffff, { map: woodTexture('#a98456', 29), roughness: 0.55 });
  for (const [dx, n] of [[-3.4, '10'], [-0.4, '11'], [5.0, '14']]) {
    lightBox(grp, 1.0, 2.05, 0.05, doorMat, dx, 1.025, ROOM.z1 + 0.05);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), new THREE.MeshBasicMaterial({ map: labelTexture(200, 96, '#16314f', '#f3f7fb', n, 62), toneMapped: false }));
    pl.position.set(dx + 0.7, 1.55, ROOM.z1 + 0.035); grp.add(pl);
  }
  lightBox(grp, 0.14, 0.22, 0.06, std(0xf2f5f8), 0.9, 1.3, ROOM.z1 + 0.05); // sanitizer
  lightBox(grp, 0.06, 0.05, 0.05, std(0x2e7ad1), 0.9, 1.22, ROOM.z1 + 0.09);
  // A bulletin board on the hall's far wall
  const bb = lightBox(grp, 1.4, 0.9, 0.025, std(0xb98d5a, { roughness: 0.9 }), -3.0, 1.7, z - 0.03);
  const r = rng(77);
  for (let i = 0; i < 7; i++) lightBox(grp, 0.2, 0.26, 0.01, std([0xf3f5f8, 0xcfe3f5, 0xf7e9b8, 0xdff0df][i % 4]), -3.55 + (i % 4) * 0.34 + r() * 0.05, 1.55 + Math.floor(i / 4) * 0.34, z - 0.05).rotation.z = (r() - 0.5) * 0.2;

  return { group: grp, phone, ceilingLights: lights, bulletin: bb };
}

/* ---------- the provider: a simple figure in a white coat (blob style) ---------- */

export function buildProvider() {
  const g = new THREE.Group();
  const coat = std(0xf3f6fa, { roughness: 0.75, emissive: 0x2a3140 }), navy = std(0x20324f, { roughness: 0.7, emissive: 0x0a1220 });
  const skin = std(0x8a5a3e, { roughness: 0.6, emissive: 0x4a2c1a }), hair = std(0x17110f, { roughness: 0.8 });
  const legs = []; const arms = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.1, 0.9, 0); g.add(leg);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.7, 6, 12), navy); l.position.y = -0.4; leg.add(l);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), std(0x10151d)); shoe.scale.set(1, 0.6, 1.5); shoe.position.set(0, -0.84, 0.05); leg.add(shoe);
    legs.push(leg);
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 8, 16), coat); body.position.y = 1.2; body.scale.set(1.1, 1, 0.8); g.add(body);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.29, 0.5, 20), coat); hem.position.y = 0.98; hem.scale.set(1.1, 1, 0.82); g.add(hem);
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 0.26, 1.46, 0); g.add(arm);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.52, 6, 12), coat); a.position.y = -0.3; arm.add(a);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skin); hand.position.y = -0.64; arm.add(hand);
    arms.push(arm);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin); head.position.y = 1.68; head.scale.set(0.95, 1.1, 1); g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.136, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), hair); cap.position.set(0, 1.705, -0.012); cap.scale.set(0.97, 1.1, 1.03); cap.rotation.x = -0.3; g.add(cap);
  for (const sx of [-1, 1]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), std(0x10151d)); eye.position.set(sx * 0.052, 1.69, 0.126); g.add(eye); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), skin); nose.position.set(0, 1.665, 0.132); g.add(nose);
  const gl = std(0x252a35, { roughness: 0.4 });
  for (const sx of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 6, 16), gl); rim.position.set(sx * 0.052, 1.69, 0.122); g.add(rim); }
  lightBox(g, 0.05, 0.006, 0.006, gl, 0, 1.695, 0.125);
  const steth = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 24, Math.PI), std(0x10151d)); steth.position.set(0, 1.45, 0.04); steth.rotation.set(0, 0, Math.PI); g.add(steth);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { legs, arms };
  return g;
}

// Swing the legs and arms and bob a little: `t` is the walk phase in radians.
export function poseWalk(fig, t, moving = true) {
  const { legs, arms } = fig.userData;
  const s = moving ? Math.sin(t) * 0.5 : 0;
  legs[0].rotation.x = s; legs[1].rotation.x = -s; arms[0].rotation.x = -s * 0.8; arms[1].rotation.x = s * 0.8;
}

