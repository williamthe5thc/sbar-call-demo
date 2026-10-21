// Hand-built inline SVG scenes. The bedside room is in room.js and the shaded
// people are in people.js. Gradients, blurred shadows and light falloff give a
// semi-realistic night-room look; shared shapes sit in <defs>. Monitor colors still
// come from CSS custom properties (--il-*, defined in styles.css). No images,
// libraries or canvas.
//
// Decorative scenes are aria-hidden (the page text already says the same thing).
// The monitor is informative: role="img" with a name built from the data, and
// every number in it is real <text>, not a path.

import { roomSvg } from './room.js';
import { peopleDefs, bust, coil } from './people.js';

const f = (t) => `fill="var(--il-${t})"`;
const s = (t, w = 2) => `stroke="var(--il-${t})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const decorative = (cls, viewBox, inner) => `
  <div class="scene ${cls}">
    <svg viewBox="${viewBox}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>
  </div>`;

/* ---------- 1. Intro: the bedside room at 2 a.m. (decorative) ---------- */

export function introScene(chart) {
  return `
  <div class="scene scene-intro">${roomSvg({ id: 'iw', mode: 'night', data: monitorData(chart) })}</div>`;
}

/* ---------- 2. Chart review: the bedside monitor (informative) ---------- */

const hoursOf = (label, fallback) => {
  const m = /(\d{1,2}):?(\d{2})?\s*([ap])/i.exec(label);
  if (!m) return fallback;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'p') h += 12;
  let t = h + Number(m[2] || 0) / 60;
  return t;
};

export function monitorData(chart) {
  const col = (re) => chart.vitalsColumns.findIndex((c) => re.test(c));
  const ci = { hr: col(/heart/i), bp: col(/blood pressure/i), rr: col(/resp/i), spo2: col(/spo2/i) };
  const rows = chart.vitals;
  // Clock times wrap past midnight, so keep hours increasing down the table.
  let prev = -1, wrap = 0;
  const hours = rows.map((r, i) => {
    let h = hoursOf(r.time, i);
    if (h + wrap < prev) wrap += 24;
    prev = h + wrap;
    return prev;
  });
  const num = (r, k) => parseFloat(r.values[ci[k]]);
  const sys = (r) => parseFloat(r.values[ci.bp].split('/')[0]);
  const first = rows[0], last = rows[rows.length - 1];
  return {
    hours,
    times: rows.map((r) => r.time),
    hr: rows.map((r) => num(r, 'hr')),
    sys: rows.map(sys),
    firstBp: first.values[ci.bp], lastBp: last.values[ci.bp],
    last: {
      hr: last.values[ci.hr], bp: last.values[ci.bp], rr: last.values[ci.rr], spo2: last.values[ci.spo2],
    },
    firstHr: first.values[ci.hr],
    firstTime: first.time, lastTime: last.time,
  };
}

export function monitorLabel(d) {
  const dir = (a, b) => (b > a ? 'up' : b < a ? 'down' : 'unchanged');
  const hr0 = parseFloat(d.firstHr), hr1 = parseFloat(d.last.hr);
  const bp0 = parseFloat(d.firstBp), bp1 = parseFloat(d.last.bp);
  return `Bedside monitor: heart rate ${dir(hr0, hr1)} from ${d.firstHr} to ${d.last.hr}, blood pressure ${dir(bp0, bp1)} from ${d.firstBp} to ${d.last.bp} since ${d.firstTime}. Latest at ${d.lastTime}: respiratory rate ${d.last.rr}, SpO2 ${d.last.spo2}. Placeholder values.`;
}

function spark({ x, y, w, h, hours, values, tone, shape, title, startLabel, endLabel, times }) {
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const h0 = hours[0], hs = hours[hours.length - 1] - h0 || 1;
  const px = (i) => x + ((hours[i] - h0) / hs) * w;
  const py = (v) => y + h - ((v - lo) / span) * h;
  const pts = values.map((v, i) => [px(i), py(v)]);
  const dash = shape === 'square' ? ' stroke-dasharray="7 4"' : '';
  const mark = ([cx, cy]) => (shape === 'square'
    ? `<rect x="${cx - 4}" y="${cy - 4}" width="8" height="8" ${f(tone)}/>`
    : `<circle cx="${cx}" cy="${cy}" r="4.5" ${f(tone)}/>`);
  const [ex, ey] = pts[pts.length - 1], [sx, sy] = pts[0];
  return `
    <text x="${x}" y="${y - 30}" font-size="18" font-weight="700" ${f('text')}>${esc(title)}</text>
    <line x1="${x}" y1="${y + h + 8}" x2="${x + w}" y2="${y + h + 8}" ${s('grid', 1)}/>
    <polyline points="${pts.map((p) => p.join(',')).join(' ')}" ${s(tone, 3)}${dash}/>
    ${pts.map(mark).join('')}
    <text x="${sx}" y="${sy - 9}" font-size="18" font-weight="700" ${f('text')}>${esc(startLabel)}</text>
    <text x="${ex}" y="${ey - 9}" font-size="18" font-weight="700" text-anchor="end" ${f('text')}>${esc(endLabel)}</text>
    <text x="${x}" y="${y + h + 28}" font-size="16" ${f('muted')}>${esc(times[0])}</text>
    <text x="${x + w}" y="${y + h + 28}" font-size="16" text-anchor="end" ${f('muted')}>${esc(times[times.length - 1])}</text>`;
}

export function monitorFigure(chart, placeholderTag) {
  const d = monitorData(chart);
  const tiles = [
    ['HR', d.last.hr, '/min', 'hr'],
    ['BP', d.last.bp, 'mmHg', 'bp'],
    ['RR', d.last.rr, '/min', 'text'],
    ['SpO2', d.last.spo2, '', 'text'],
  ];
  const tw = 104, gap = 8, x0 = 20;
  const tileSvg = tiles.map(([name, val, unit, tone], i) => {
    const x = x0 + i * (tw + gap);
    return `
      <rect x="${x}" y="52" width="${tw}" height="76" rx="6" ${f('screen2')}/>
      <text x="${x + 10}" y="72" font-size="18" font-weight="700" ${f('muted')}>${esc(name)}</text>
      ${unit ? `<text x="${x + tw - 8}" y="72" font-size="15" text-anchor="end" ${f('muted')}>${esc(unit)}</text>` : ''}
      <text x="${x + tw / 2}" y="112" font-size="${String(val).length > 4 ? 28 : 36}" font-weight="700" text-anchor="middle" ${f(tone)}>${esc(val)}</text>`;
  }).join('');
  const sparkW = 190;
  const svg = `
    <svg viewBox="0 0 480 320" role="img" aria-label="${esc(monitorLabel(d))}" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <rect width="480" height="320" rx="14" ${f('frame')}/>
      <rect x="8" y="8" width="464" height="304" rx="10" ${f('screen')}/>
      <text x="20" y="36" font-size="18" font-weight="700" ${f('text')}>Bedside monitor, ${esc(d.lastTime)}</text>
      <circle class="blink" cx="458" cy="30" r="5" ${f('ok')}/>
      ${tileSvg}
      <text x="20" y="162" font-size="17" ${f('muted')}>Trend since ${esc(d.firstTime)}</text>
      ${spark({ x: 24, y: 232, w: sparkW, h: 44, hours: d.hours, values: d.hr, tone: 'hr', shape: 'circle',
        title: 'Heart rate (solid)', startLabel: d.firstHr, endLabel: d.last.hr, times: d.times })}
      ${spark({ x: 266, y: 232, w: sparkW, h: 44, hours: d.hours, values: d.sys, tone: 'bp', shape: 'square',
        title: 'Systolic BP (dashed)', startLabel: d.firstBp.split('/')[0], endLabel: d.last.bp.split('/')[0], times: d.times })}
    </svg>`;
  return `
    <figure class="scene monitor">
      ${svg}
      <figcaption class="scene-cap">Latest values (${esc(d.lastTime)}). The full table is in the chart. ${placeholderTag}</figcaption>
    </figure>`;
}

/* ---------- 3. Build step: the nurse at the station (decorative) ---------- */

// Night window with a city skyline, used behind the characters. `p` keeps ids unique per SVG.
const cityWindow = (p, x, y, w, h) => {
  const b = [[6, 40, 18], [26, 54, 20], [48, 34, 16], [66, 62, 24], [92, 44, 18], [112, 56, 22]]
    .map(([bx, bh, bw]) => `<rect x="${x + 8 + bx * (w - 16) / 134}" y="${y + h - 8 - bh * h / 104}" width="${bw * (w - 16) / 134}" height="${bh * h / 104}"/>`).join('');
  return `
    <rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="6" fill="#0b1424" opacity=".55" filter="url(#${p}-b4)"/>
    <rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="5" fill="#2d4263"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#${p}-sky)"/>
    <g clip-path="url(#${p}-win)"><circle cx="${x + w * .78}" cy="${y + h * .3}" r="9" fill="#f6f0d6"/><circle cx="${x + w * .78 + 4}" cy="${y + h * .3 - 3}" r="8" fill="#12274c"/>
      <g fill="#0a1426">${b}</g><g fill="url(#${p}-lights)">${b}</g></g>
    ${Array.from({ length: 5 }, (_, i) => `<rect x="${x}" y="${y + i * 7}" width="${w}" height="5" rx="1.4" fill="url(#${p}-slat)"/>`).join('')}
    <rect x="${x - 6}" y="${y + h + 4}" width="${w + 12}" height="7" rx="3" fill="url(#${p}-metalv)"/>`;
};

const sceneDefs = (p, W, H, win) => `
  <defs>
    <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2b46"/><stop offset="1" stop-color="#0e1829"/></linearGradient>
    <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a1a"/><stop offset=".7" stop-color="#17305a"/><stop offset="1" stop-color="#2a4a7c"/></linearGradient>
    <linearGradient id="${p}-slat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8294b4"/><stop offset="1" stop-color="#3a4a68"/></linearGradient>
    <linearGradient id="${p}-metalv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f5fb"/><stop offset=".45" stop-color="#9fb0c6"/><stop offset="1" stop-color="#56667e"/></linearGradient>
    <linearGradient id="${p}-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a47a58"/><stop offset=".5" stop-color="#7a5640"/><stop offset="1" stop-color="#4a3224"/></linearGradient>
    <linearGradient id="${p}-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a20"/><stop offset="1" stop-color="#150e0a"/></linearGradient>
    <linearGradient id="${p}-bezel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a5b76"/><stop offset=".4" stop-color="#26334a"/><stop offset="1" stop-color="#0d1524"/></linearGradient>
    <linearGradient id="${p}-glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${p}-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc977" stop-opacity=".5"/><stop offset=".45" stop-color="#ffb55c" stop-opacity=".18"/><stop offset="1" stop-color="#ff9f3f" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-mon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#78c0ff" stop-opacity=".34"/><stop offset=".5" stop-color="#4f9bf0" stop-opacity=".12"/><stop offset="1" stop-color="#3b82e0" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <pattern id="${p}-lights" width="7" height="8" patternUnits="userSpaceOnUse"><rect x="1.5" y="2" width="2.2" height="2.6" fill="#ffd47a" opacity=".85"/></pattern>
    <filter id="${p}-b4" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${W + 40}" height="${H + 40}"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="${p}-b9" filterUnits="userSpaceOnUse" x="-20" y="-20" width="${W + 40}" height="${H + 40}"><feGaussianBlur stdDeviation="9"/></filter>
    <clipPath id="${p}-win"><rect x="${win[0]}" y="${win[1]}" width="${win[2]}" height="${win[3]}" rx="2"/></clipPath>
    ${peopleDefs(p, ['nurse', 'doctor'])}
  </defs>`;

export function nurseStationScene() {
  const p = 'ns';
  const steam = `<path class="ring" d="M528 146 q-5 -8 0 -14 q5 -6 0 -12 M536 146 q-5 -8 0 -14 q5 -6 0 -12" fill="none" stroke="#dfe8f3" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
  return decorative('scene-station', '0 0 640 220', `
    ${sceneDefs(p, 640, 220, [36, 24, 140, 96])}
    <rect width="640" height="220" fill="url(#${p}-wall)"/>
    <rect y="150" width="640" height="24" fill="#0b1424" opacity=".35"/>
    ${cityWindow(p, 36, 24, 140, 96)}
    <!-- notice board -->
    <rect x="470" y="22" width="120" height="62" rx="4" fill="#5a4030"/><rect x="474" y="26" width="112" height="54" rx="2" fill="#8a6a4d"/>
    <rect x="482" y="34" width="26" height="20" fill="#f2e9b8" transform="rotate(-3 495 44)"/><rect x="516" y="32" width="30" height="24" fill="#dfeaf6" transform="rotate(2 531 44)"/><rect x="554" y="36" width="22" height="18" fill="#f6d8d8" transform="rotate(-2 565 45)"/>
    <path d="M486 62 h40 M486 68 h28 M540 62 h30" stroke="#d8c6a4" stroke-width="2"/>
    <!-- monitor glow and lamp glow -->
    <circle cx="470" cy="120" r="170" fill="url(#${p}-mon)"/>
    <circle cx="590" cy="130" r="150" fill="url(#${p}-lamp)"/>
    <!-- computer screen with chart lines -->
    <rect x="388" y="70" width="116" height="78" rx="7" fill="url(#${p}-bezel)"/>
    <rect x="394" y="76" width="104" height="62" rx="3" fill="#07111f"/>
    <path d="M394 76 H460 L420 138 H394z" fill="#fff" opacity=".05"/>
    <path d="M394 96 H498 M394 116 H498 M420 76 V138 M446 76 V138 M472 76 V138" stroke="#1d3a4f" stroke-width=".8"/>
    <polyline points="398,126 412,112 424,118 440,92 454,100 470,86 492,94" fill="none" stroke="#ffb454" stroke-width="2" stroke-linejoin="round"/>
    <polyline points="398,130 414,124 430,128 448,116 466,120 492,110" fill="none" stroke="#7fd4ff" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="400" y="80" width="28" height="4" rx="1" fill="#53627a"/><rect x="396" y="78" width="100" height="58" rx="2" fill="url(#${p}-glare)" opacity=".6"/>
    <rect x="438" y="148" width="22" height="10" fill="url(#${p}-metalv)"/><rect x="424" y="156" width="52" height="5" rx="2" fill="#2a3446"/>
    <!-- nurse on the phone -->
    <ellipse cx="250" cy="150" rx="100" ry="14" fill="#000" opacity=".4" filter="url(#${p}-b9)"/>
    ${bust({ p, skin: 'nurse', hair: 'tied', mood: 'calm', garment: 'scrub', side: 1, x: 250, y: 76, s: 1.25 })}
    <path class="ring" d="M312 52 q9 12 0 24 M322 46 q15 18 0 36" fill="none" stroke="#ffc857" stroke-width="2.4" stroke-linecap="round"/>
    <!-- desk, phone base, coiled cord, keyboard, coffee, lamp -->
    <rect x="0" y="170" width="640" height="50" fill="url(#${p}-front)"/>
    <rect x="0" y="166" width="640" height="10" fill="url(#${p}-desk)"/><rect x="0" y="167" width="640" height="2.4" fill="#fff" opacity=".35"/><rect x="0" y="174" width="640" height="3" fill="#000" opacity=".4"/>
    <path d="M0 150 H640" stroke="#fff" stroke-opacity="0" />
    <rect x="320" y="150" width="62" height="16" rx="4" fill="#1b2434"/><rect x="326" y="146" width="34" height="8" rx="3" fill="#10161f"/><rect x="322" y="152" width="58" height="3" rx="1.5" fill="#fff" opacity=".12"/>
    <g fill="#2a3446"><rect x="330" y="158" width="6" height="4" rx="1"/><rect x="340" y="158" width="6" height="4" rx="1"/><rect x="350" y="158" width="6" height="4" rx="1"/></g>
    ${coil(298, 112, 340, 150, 12, '#1b2434')}
    <rect x="394" y="160" width="116" height="7" rx="3" fill="#161e2c"/><rect x="396" y="161" width="112" height="2" rx="1" fill="#fff" opacity=".12"/>
    <path d="M520 150 h22 l-3 14 q-8 3 -16 0z" fill="#e9eef5"/><path d="M523 152 h16 l-1 6 h-14z" fill="#6b4a32"/><path d="M542 154 q8 2 0 8" fill="none" stroke="#e9eef5" stroke-width="3"/><path d="M524 152 l-1 10" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
    ${steam}
    <path d="M580 166 V138 L598 112" fill="none" stroke="#10161f" stroke-width="5" stroke-linecap="round"/><path d="M580 166 V138 L598 112" fill="none" stroke="url(#${p}-metalv)" stroke-width="3" stroke-linecap="round"/>
    <path d="M590 104 Q606 96 622 106 L628 116 L584 116z" fill="#ffdca0"/><ellipse cx="606" cy="116.5" rx="22" ry="3.4" fill="#fff4d4"/>
    <rect x="560" y="164" width="50" height="4" rx="2" fill="#10161f"/>
    <rect width="640" height="220" fill="url(#${p}-vig)"/>`);
}

/* ---------- 4. Feedback: the provider on the other end (decorative) ---------- */

export const MOODS = {
  calm: { word: 'calm', text: 'The provider sounds calm and gives orders.' },
  unsure: { word: 'unsure', text: 'The provider sounds unsure and asks a question.' },
  confused: { word: 'confused', text: 'The provider sounds confused.' },
};

// calm: all four met; unsure: two or three met; confused: zero or one met.
export const moodFor = (metCount) => (metCount === 4 ? 'calm' : metCount >= 2 ? 'unsure' : 'confused');

const qmark = (x, y, size, rot) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" transform="rotate(${rot} ${x} ${y})" fill="#ffc857" stroke="#08101f" stroke-width="3" paint-order="stroke">?</text>`;

export function providerScene(mood) {
  const p = 'pv';
  const extras = {
    calm: '',
    unsure: qmark(588, 58, 30, 8),
    confused: `${qmark(584, 58, 30, 10)}${qmark(606, 96, 22, -8)}
      <path d="M600 36 q6 10 0 15 q-6 -5 0 -15z" fill="#bfe6f6" stroke="#4a86b0" stroke-width="1"/>`,
  };
  return `
  <div class="scene scene-call" data-provider-mood="${mood}">
    <svg viewBox="0 0 640 200" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" data-provider-mood="${mood}">
      ${sceneDefs(p, 640, 200, [30, 20, 100, 80])}
      <defs>
        <linearGradient id="${p}-two" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14263f"/><stop offset=".42" stop-color="#14263f"/><stop offset=".58" stop-color="#3a2e30"/><stop offset="1" stop-color="#2a2024"/></linearGradient>
        <linearGradient id="${p}-wallR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a3c"/><stop offset="1" stop-color="#241a1e"/></linearGradient>
      </defs>
      <rect width="640" height="200" fill="url(#${p}-two)"/>
      ${cityWindow(p, 30, 20, 100, 80)}
      <circle cx="140" cy="120" r="150" fill="url(#${p}-mon)"/>
      <!-- the provider's side: a warm lamp, a framed picture, a bookshelf edge -->
      <circle cx="610" cy="70" r="150" fill="url(#${p}-lamp)"/>
      <rect x="400" y="30" width="62" height="46" rx="3" fill="#2a2024" stroke="#6a5048" stroke-width="3"/><path d="M406 70 L424 50 L436 62 L446 54 L458 70z" fill="#4a6a5a"/><circle cx="446" cy="42" r="5" fill="#d9a066"/>
      <rect x="590" y="116" width="50" height="84" fill="#1a1316"/><path d="M590 146 H640 M590 176 H640" stroke="#4a3a3c" stroke-width="2"/>
      <path d="M570 130 V98 L590 74" fill="none" stroke="#10161f" stroke-width="5" stroke-linecap="round"/><path d="M570 130 V98 L590 74" fill="none" stroke="url(#${p}-metalv)" stroke-width="3" stroke-linecap="round"/>
      <path d="M580 68 Q598 58 616 70 L622 82 L574 82z" fill="#ffdca0"/><ellipse cx="598" cy="83" rx="24" ry="3.6" fill="#fff4d4"/>
      <!-- the call -->
      <path d="M190 56 Q320 -6 452 58" fill="none" stroke="#9fc2ea" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/>
      <circle cx="321" cy="24" r="17" fill="#101c30" stroke="#9fc2ea" stroke-width="1.6"/>
      <path d="M314 18 q-2 8 7 12 q3 -2 4 -4 l-4 -3 -2 2 q-3 -1 -4 -5 l2 -2 -3 -4 q-3 1 0 4z" fill="#ffc857" class="ring"/>
      <!-- nurse (left) and provider (right) -->
      <ellipse cx="120" cy="196" rx="86" ry="10" fill="#000" opacity=".45" filter="url(#${p}-b9)"/>
      ${bust({ p, skin: 'nurse', hair: 'tied', mood: 'calm', garment: 'scrub', side: 1, x: 118, y: 92, s: 1.3 })}
      ${bust({ p, skin: 'doctor', hair: 'short', mood, garment: 'coat', side: -1, x: 520, y: 92, s: 1.3, glasses: true, gray: true, sweat: mood === 'confused', tilt: mood === 'unsure' ? -3 : 0 })}
      ${extras[mood]}
      <rect width="640" height="200" fill="url(#${p}-vig)"/>
    </svg>
  </div>`;
}

/* ---------- 5. Mastery: the same room at sunrise (decorative) ---------- */

export function sunriseScene() {
  return `
  <div class="scene scene-dawn">${roomSvg({ id: 'im', mode: 'dawn' })}</div>`;
}

/* ---------- 6. Assess the patient: the bedside scene (decorative) ----------
   800 x 500 units. Hotspot positions in scenario.js are percentages of this box.
   Everything here is aria-hidden: the findings are all in HTML. */

export function assessSvg(chart, hotspots = []) {
  return roomSvg({ id: 'ia', mode: 'night', data: monitorData(chart), hotspots });
}
