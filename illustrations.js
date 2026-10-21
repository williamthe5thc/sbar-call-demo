// Hand-built inline SVG scenes. One flat style: simple shapes, a small palette.
// Colors are CSS custom properties (--il-*, defined in styles.css), so both
// color schemes are tuned in one place. No images, libraries or canvas.
//
// Decorative scenes are aria-hidden (the page text already says the same thing).
// The monitor is informative: role="img" with a name built from the data, and
// every number in it is real <text>, not a path.

const f = (t) => `fill="var(--il-${t})"`;
const s = (t, w = 2) => `stroke="var(--il-${t})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const decorative = (cls, viewBox, inner) => `
  <div class="scene ${cls}">
    <svg viewBox="${viewBox}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${inner}</svg>
  </div>`;

/* ---------- shared pieces ---------- */

// Round monitor heartbeat line. The dot blinks three times, then stays still.
const heartbeat = (x, y, w) => `
  <polyline points="${x},${y} ${x + w * .25},${y} ${x + w * .32},${y - 9} ${x + w * .4},${y + 9} ${x + w * .48},${y - 16} ${x + w * .56},${y} ${x + w},${y}" ${s('ok', 2)}/>
  <circle class="blink" cx="${x + w + 5}" cy="${y}" r="3" ${f('ok')}/>`;

const window_ = (x, y, w, h, sky, sun) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ${f('frame')}/>
  <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="3" ${f(sky)}/>
  ${sun}
  <path d="M${x + w / 2} ${y + 6} V${y + h - 6} M${x + 6} ${y + h / 2} H${x + w - 6}" ${s('frame', 4)}/>
  <rect x="${x - 6}" y="${y + h}" width="${w + 12}" height="7" rx="3" ${f('frame')}/>`;

const nightSky = (x, y) => `
  <circle cx="${x + 78}" cy="${y + 30}" r="17" ${f('moon')}/>
  <circle cx="${x + 86}" cy="${y + 25}" r="15" ${f('sky')}/>
  <circle cx="${x + 26}" cy="${y + 24}" r="1.8" ${f('moon')}/><circle cx="${x + 44}" cy="${y + 58}" r="1.5" ${f('moon')}/>
  <circle cx="${x + 100}" cy="${y + 68}" r="1.8" ${f('moon')}/><circle cx="${x + 62}" cy="${y + 12}" r="1.5" ${f('moon')}/>`;

const bed = (x, y, withPatient, blanket) => `
  <rect x="${x - 14}" y="${y - 26}" width="14" height="${70}" rx="3" ${f('wood')}/>
  <rect x="${x + 250}" y="${y + 6}" width="10" height="38" rx="3" ${f('wood')}/>
  <rect x="${x - 4}" y="${y + 36}" width="256" height="8" rx="3" ${f('wood')}/>
  <rect x="${x}" y="${y}" width="250" height="38" rx="9" ${f('sheet')}/>
  ${withPatient ? `
  <ellipse cx="${x + 38}" cy="${y + 2}" rx="34" ry="13" ${f('pillow')}/>
  <path d="M${x + 14} ${y - 4} q2 -26 26 -22 q20 3 18 24 z" ${f('hair')}/>
  <circle cx="${x + 38}" cy="${y - 8}" r="19" ${f('skin3')}/>
  <path d="M${x + 19} ${y - 14} q4 -16 22 -15 q15 1 17 15 q-9 -9 -39 0z" ${f('hair')}/>
  <path d="M${x + 27} ${y - 8} q4 3 8 0 M${x + 42} ${y - 8} q4 3 8 0" ${s('ink', 1.8)}/>
  <path d="M${x + 33} ${y + 2} q5 3 10 0" ${s('ink', 1.8)}/>` : ''}
  <path d="M${x + 70} ${y - 6} q70 -8 180 -2 v32 q0 8 -9 8 h-162 q-9 0 -9 -8z" ${f(blanket)}/>
  <path d="M${x + 70} ${y + 6} h180" ${s('sheet', 3)} opacity=".7"/>`;

/* ---------- 1. Intro: a dim room at 2 a.m. (decorative) ---------- */

export function introScene() {
  return decorative('scene-intro', '0 0 640 220', `
    <rect width="640" height="220" ${f('wall')}/>
    <rect y="172" width="640" height="48" ${f('floor')}/>
    ${window_(36, 26, 132, 104, 'sky', nightSky(36, 26))}
    <!-- wall clock at 2:00 -->
    <circle cx="372" cy="52" r="20" ${f('frame')}/><circle cx="372" cy="52" r="16" ${f('clock')}/>
    <path d="M372 52 V40 M372 52 L381 57" ${s('ink', 2)}/>
    <!-- bedside lamp: the one warm light in the room -->
    <circle cx="205" cy="128" r="46" ${f('lamp')} opacity=".09"/>
    <rect x="182" y="146" width="46" height="30" rx="3" ${f('wood')}/>
    <rect x="203" y="132" width="4" height="14" ${f('frame')}/>
    <path d="M190 132 L198 108 H212 L220 132 z" ${f('lamp')}/>
    ${bed(244, 120, true, 'blanket')}
    <!-- IV pole -->
    <path d="M500 54 V172 M486 54 H514" ${s('metal', 3)}/>
    <ellipse cx="500" cy="174" rx="18" ry="4" ${f('metal')}/>
    <rect x="490" y="62" width="20" height="34" rx="6" ${f('iv')}/>
    <path d="M500 96 V116 Q500 126 488 126 L486 126" ${s('iv', 1.5)}/>
    <!-- bedside monitor on a stand -->
    <path d="M580 134 V172" ${s('metal', 4)}/><ellipse cx="580" cy="174" rx="22" ry="4" ${f('metal')}/>
    <rect x="538" y="78" width="84" height="58" rx="7" ${f('frame')}/>
    <rect x="544" y="84" width="72" height="46" rx="3" ${f('screen')}/>
    ${heartbeat(549, 108, 54)}
`);
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

export function nurseStationScene() {
  return decorative('scene-station', '0 0 640 150', `
    <rect width="640" height="150" ${f('wall')}/>
    ${window_(30, 12, 120, 84, 'sky', nightSky(30, 12))}
    <rect y="118" width="640" height="32" ${f('floor')}/>
    <!-- desk and the glowing lamp -->
    <circle cx="520" cy="84" r="46" ${f('lamp')} opacity=".09"/>
    <path d="M520 118 V96 L534 78" ${s('metal', 3)}/>
    <path d="M522 72 L546 72 L554 84 L530 84 z" ${f('lamp')} transform="rotate(-18 538 78)"/>
    <rect x="150" y="104" width="400" height="14" rx="4" ${f('desk')}/>
    <rect x="170" y="118" width="360" height="32" ${f('desk2')}/>
    <!-- screen with chart lines -->
    <rect x="384" y="50" width="84" height="54" rx="5" ${f('frame')}/>
    <rect x="389" y="55" width="74" height="40" rx="2" ${f('screen')}/>
    <polyline points="395,86 410,76 424,80 440,64 456,70" ${s('hr', 2)}/>
    <rect x="418" y="98" width="16" height="6" ${f('frame')}/>
    <!-- nurse -->
    <path d="M214 118 Q214 78 256 74 Q298 78 298 118 z" ${f('scrub')}/>
    <path d="M244 74 L256 90 L268 74" ${s('scrubdark', 3)}/>
    <rect x="248" y="58" width="16" height="20" rx="6" ${f('skin2')}/>
    <circle cx="256" cy="42" r="23" ${f('skin2')}/>
    <path d="M233 42 Q232 16 258 16 Q282 18 279 42 Q270 28 256 28 Q244 28 233 42z" ${f('hair2')}/>
    <circle cx="272" cy="14" r="9" ${f('hair2')}/>
    <circle cx="249" cy="44" r="2.4" ${f('ink')}/><circle cx="264" cy="44" r="2.4" ${f('ink')}/>
    <path d="M250 53 Q257 58 264 53" ${s('ink', 2)}/>
    <!-- phone at her ear -->
    <rect x="279" y="30" width="10" height="30" rx="5" ${f('phone')} transform="rotate(8 284 45)"/>
    <path d="M296 36 q8 9 0 18 M303 32 q13 13 0 26" class="ring" ${s('lamp', 2)}/>
    <!-- hand -->
    <circle cx="281" cy="58" r="6" ${f('skin2')}/>
    <!-- coffee -->
    <rect x="330" y="88" width="16" height="16" rx="3" ${f('cup')}/><path d="M346 92 q8 3 0 10" ${s('cup', 2.5)}/>`);
}

/* ---------- 4. Feedback: the provider on the other end (decorative) ---------- */

export const MOODS = {
  calm: { word: 'calm', text: 'The provider sounds calm and gives orders.' },
  unsure: { word: 'unsure', text: 'The provider sounds unsure and asks a question.' },
  confused: { word: 'confused', text: 'The provider sounds confused.' },
};

// calm: all four met; unsure: two or three met; confused: zero or one met.
export const moodFor = (metCount) => (metCount === 4 ? 'calm' : metCount >= 2 ? 'unsure' : 'confused');

function providerFace(mood) {
  const eyes = mood === 'unsure'
    ? `<circle cx="530" cy="66" r="3.2" ${f('ink')}/><circle cx="554" cy="66" r="3.2" ${f('ink')}/>`
    : `<circle cx="529" cy="68" r="3.2" ${f('ink')}/><circle cx="553" cy="68" r="3.2" ${f('ink')}/>`;
  const faces = {
    calm: `<path d="M520 57 Q529 53 537 57 M545 57 Q553 53 561 57" ${s('ink', 2.2)}/>
           <path d="M527 82 Q541 94 555 82" ${s('ink', 2.4)}/>`,
    unsure: `<path d="M520 55 Q529 49 538 54 M545 58 L561 58" ${s('ink', 2.2)}/>
             <path d="M530 85 Q536 82 541 85 T553 84" ${s('ink', 2.4)}/>
             <text x="582" y="40" font-size="26" font-weight="700" ${f('lamp')}>?</text>`,
    confused: `<path d="M519 61 L537 54 M545 54 L563 61" ${s('ink', 2.2)}/>
               <path d="M528 86 q4 -6 8 0 t8 0 t8 0" ${s('ink', 2.4)}/>
               <path d="M572 48 q6 9 0 14 q-6 -5 0 -14z" ${f('iv')}/>
               <text x="582" y="40" font-size="26" font-weight="700" ${f('lamp')}>?</text><text x="598" y="62" font-size="20" font-weight="700" ${f('lamp')}>?</text>`,
  };
  return eyes + faces[mood];
}

export function providerScene(mood) {
  return `
  <div class="scene scene-call" data-provider-mood="${mood}">
    <svg viewBox="0 0 640 170" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" data-provider-mood="${mood}">
      <rect width="640" height="170" ${f('wall')}/>
      <!-- the call -->
      <path d="M158 64 Q324 -14 494 64" ${s('line', 3)} stroke-dasharray="2 8"/>
      <circle cx="326" cy="25" r="16" ${f('phone')}/>
      <path d="M319 19 q-2 8 7 12 q3 -2 4 -4 l-4 -3 -2 2 q-3 -1 -4 -5 l2 -2 -3 -4 q-3 1 -0 4z" ${f('lamp')}/>
      <!-- nurse, from the side -->
      <path d="M62 170 Q62 120 108 114 Q154 120 154 170 z" ${f('scrub')}/>
      <rect x="100" y="94" width="16" height="22" rx="6" ${f('skin2')}/>
      <circle cx="108" cy="72" r="26" ${f('skin2')}/>
      <path d="M82 72 Q80 40 110 42 Q136 44 134 72 Q124 58 108 58 Q92 58 82 72z" ${f('hair2')}/>
      <circle cx="102" cy="74" r="2.6" ${f('ink')}/><circle cx="121" cy="74" r="2.6" ${f('ink')}/>
      <path d="M103 86 Q112 92 121 86" ${s('ink', 2)}/>
      <rect x="134" y="58" width="10" height="30" rx="5" ${f('phone')} transform="rotate(6 139 73)"/>
      <circle cx="137" cy="88" r="6" ${f('skin2')}/>
      <!-- provider -->
      <path d="M458 170 Q458 124 540 116 Q622 124 622 170 z" ${f('coat')}/>
      <path d="M520 118 L540 146 L560 118" ${s('coatline', 3)}/>
      <path d="M512 124 Q512 150 530 152" ${s('metal', 3)}/><circle cx="531" cy="153" r="5" ${f('metal')}/>
      <rect x="532" y="94" width="16" height="24" rx="6" ${f('skin3')}/>
      <circle cx="540" cy="70" r="31" ${f('skin3')}/>
      <path d="M509 66 Q506 34 542 36 Q574 38 571 66 Q560 52 540 52 Q520 52 509 66z" ${f('hair')}/>
      <rect x="496" y="56" width="11" height="32" rx="5" ${f('phone')} transform="rotate(-6 501 72)"/>
      <circle cx="505" cy="88" r="6" ${f('skin3')}/>
      ${providerFace(mood)}
    </svg>
  </div>`;
}

/* ---------- 5. Mastery: a calm morning (decorative) ---------- */

export function sunriseScene() {
  return decorative('scene-dawn', '0 0 640 200', `
    <rect width="640" height="200" ${f('wall2')}/>
    <rect y="158" width="640" height="42" ${f('floor2')}/>
    <rect x="254" y="22" width="132" height="104" rx="6" ${f('frame2')}/>
    <rect x="260" y="28" width="120" height="92" rx="3" ${f('dawn1')}/>
    <circle cx="320" cy="108" r="30" ${f('sun')}/>
    <path d="M260 120 V104 q20 -12 40 0 q20 -12 40 0 q22 -10 40 2 V120z" ${f('hill')}/>
    <path d="M320 28 V120 M260 74 H380" ${s('frame2', 4)}/>
    <rect x="248" y="126" width="144" height="7" rx="3" ${f('frame2')}/>
    <!-- patient resting -->
    <g transform="translate(-130 22)">${bed(244, 120, true, 'blanket2')}</g>
    <!-- steady monitor -->
    <path d="M530 134 V176" ${s('metal', 4)}/><ellipse cx="530" cy="178" rx="22" ry="4" ${f('metal')}/>
    <rect x="490" y="88" width="82" height="52" rx="7" ${f('frame2')}/>
    <rect x="496" y="94" width="70" height="40" rx="3" ${f('screen')}/>
    ${heartbeat(501, 114, 52)}
    <!-- plant -->
    <rect x="598" y="150" width="22" height="26" rx="3" ${f('pot')}/>
    <path d="M609 150 q-16 -20 -4 -34 q12 12 4 34 M609 150 q14 -18 4 -36 q-14 14 -4 36" ${f('leaf')}/>`);
}


/* ---------- 6. Assess the patient: the bedside scene (decorative) ----------
   800 x 500 units. Hotspot positions in scenario.js are percentages of this box.
   Everything here is aria-hidden: the findings are all in HTML. */

export function assessSvg(chart, hotspots = []) {
  const d = monitorData(chart);
  const mound = 'M284 346 C286 324 298 314 322 314 L382 312 C396 306 420 297 452 296 C486 296 510 306 530 316 L574 322 C604 322 630 320 646 330 L654 346 Z';
  const leaders = hotspots.filter((h) => h.tx != null).map((h) => {
    const [x1, y1, x2, y2] = [h.x * 8, h.y * 5, h.tx * 8, h.ty * 5];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#08101f" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${s('lamp', 2)}/>
      <circle cx="${x2}" cy="${y2}" r="6" ${f('lamp')} stroke="#08101f" stroke-width="2.5"/>`;
  }).join('');
  const city = [[612, 168, 14, 16], [630, 158, 16, 26], [652, 164, 12, 20], [670, 150, 18, 34], [694, 160, 14, 24], [712, 168, 16, 16]]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${f('floor')}/>
      <rect x="${x + 3}" y="${y + 4}" width="3" height="3" ${f('lamp')} opacity=".8"/><rect x="${x + w - 7}" y="${y + 11}" width="3" height="3" ${f('lamp')} opacity=".6"/>`).join('');
  const hrPts = '268,100 288,100 294,91 301,108 308,86 315,100 336,100 342,95 349,100 392,100';
  return `
  <svg viewBox="0 0 800 500" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="il-mound"><path d="${mound}"/></clipPath>
      <clipPath id="il-bag"><path d="M566 408 h44 q8 0 8 8 v20 q0 12 -12 12 h-36 q-12 0 -12 -12 v-20 q0 -8 8 -8z"/></clipPath>
    </defs>
    <!-- room -->
    <rect width="800" height="500" ${f('wall')}/>
    <rect y="356" width="800" height="144" ${f('floor')}/>
    <rect y="350" width="800" height="9" ${f('floor2')}/>
    <path d="M0 400 H800 M0 440 H800 M0 478 H800" ${s('floor2', 1.5)} opacity=".6"/>
    ${window_(590, 40, 170, 150, 'sky', nightSky(590, 40) + city)}
    <circle cx="540" cy="82" r="24" ${f('frame')}/><circle cx="540" cy="82" r="19" ${f('clock')}/>
    <path d="M540 66 V69 M556 82 H553 M540 98 V95 M524 82 H527" ${s('ink', 1.5)}/>
    <path d="M540 82 V68 M540 82 L548 86" ${s('ink', 2.2)}/>
    <!-- headwall rail, outlet and reading light -->
    <rect x="196" y="252" width="420" height="8" rx="3" ${f('frame2')}/>
    <rect x="566" y="232" width="30" height="22" rx="3" ${f('frame')}/><circle cx="576" cy="243" r="3" ${f('ink')}/><circle cx="587" cy="243" r="3" ${f('ink')}/>
    <path d="M488 206 L440 330 L548 330 Z" ${f('lamp')} opacity=".06"/>
    <path d="M470 252 V220 L490 206" ${s('metal', 4)}/>
    <path d="M482 198 L506 212 L496 218 L476 206 Z" ${f('lamp')}/>
    <!-- bedside monitor on a wall arm (the data-driven numbers) -->
    <rect x="322" y="184" width="16" height="30" ${f('frame2')}/><rect x="308" y="212" width="44" height="8" rx="3" ${f('frame2')}/>
    <rect x="252" y="64" width="156" height="122" rx="10" ${f('frame2')}/>
    <rect x="258" y="70" width="144" height="110" rx="7" ${f('frame')}/>
    <rect x="263" y="75" width="134" height="100" rx="4" ${f('screen')}/>
    <polyline points="${hrPts}" ${s('ok', 2)}/><circle class="blink" cx="396" cy="100" r="2.6" ${f('ok')}/>
    <text x="270" y="124" font-size="11" font-weight="700" ${f('muted')}>HR</text>
    <text x="270" y="150" font-size="27" font-weight="700" ${f('hr')}>${esc(d.last.hr)}</text>
    <text x="326" y="124" font-size="11" font-weight="700" ${f('muted')}>BP</text>
    <text x="326" y="148" font-size="21" font-weight="700" ${f('bp')}>${esc(d.last.bp)}</text>
    <text x="270" y="168" font-size="11" ${f('text')}>RR ${esc(d.last.rr)}</text>
    <text x="326" y="168" font-size="11" ${f('text')}>SpO2 ${esc(d.last.spo2)}</text>
    <!-- bed: shadow, headboard, frame, wheels, far rail -->
    <ellipse cx="430" cy="450" rx="270" ry="10" fill="#000" opacity=".35"/>
    <rect x="176" y="236" width="26" height="176" rx="7" ${f('wood')}/><rect x="182" y="246" width="6" height="150" rx="3" fill="#000" opacity=".18"/>
    <rect x="664" y="330" width="18" height="82" rx="6" ${f('wood')}/>
    <rect x="214" y="408" width="10" height="28" ${f('frame2')}/><rect x="640" y="408" width="10" height="28" ${f('frame2')}/>
    <circle cx="219" cy="442" r="10" ${f('phone')}/><circle cx="219" cy="442" r="3.5" ${f('metal')}/>
    <circle cx="645" cy="442" r="10" ${f('phone')}/><circle cx="645" cy="442" r="3.5" ${f('metal')}/>
    <rect x="196" y="392" width="470" height="16" rx="4" ${f('frame2')}/>
    <rect x="212" y="284" width="190" height="58" rx="8" ${s('metal', 5)}/>
    <path d="M246 284 V342 M280 284 V342 M314 284 V342 M348 284 V342 M382 284 V342" ${s('metal', 4)}/>
    <!-- mattress -->
    <rect x="200" y="342" width="462" height="50" rx="10" ${f('mattress')}/>
    <path d="M206 345 H656" ${s('pillow', 2)} opacity=".7"/>
    <path d="M204 370 H658" ${s('sheet2', 1.5)}/>
    <!-- patient: pillow, head, neck -->
    <ellipse cx="246" cy="336" rx="54" ry="17" ${f('pillow')}/>
    <path d="M194 338 q52 22 104 0 q-6 14 -52 14 q-46 0 -52 -14z" ${f('sheet2')} opacity=".55"/>
    <rect x="266" y="326" width="26" height="24" rx="8" ${f('skin3')}/>
    <ellipse cx="226" cy="314" rx="4.5" ry="8" ${f('skin3')}/><ellipse cx="278" cy="314" rx="4.5" ry="8" ${f('skin3')}/>
    <circle cx="252" cy="312" r="26" ${f('skin3')}/>
    <path d="M226 310 C222 280 248 274 262 281 C277 287 281 298 279 310 C270 297 246 292 226 310 z" ${f('hair')}/>
    <path d="M239 307 l11 -3 M266 307 l-11 -3" ${s('ink', 2)}/>
    <path d="M240 316 q5 4 10 0 M256 316 q5 4 10 0" ${s('ink', 2)}/>
    <path d="M247 330 q6 -5 12 0" ${s('ink', 2)}/>
    <!-- body under the sheet, gown, abdomen with dressing, blanket -->
    <g clip-path="url(#il-mound)">
      <path d="${mound}" ${f('sheet')}/>
      <rect x="284" y="330" width="380" height="20" ${f('sheet2')} opacity=".6"/>
      <path d="M330 346 q10 -14 30 -20 M560 346 q8 -12 22 -16 M600 346 q6 -10 18 -12" ${s('sheet2', 2)}/>
      <rect x="284" y="296" width="114" height="54" ${f('gown')}/>
      <rect x="284" y="334" width="114" height="16" ${f('gown2')} opacity=".7"/>
      <g ${f('gown2')}><circle cx="306" cy="326" r="2.2"/><circle cx="328" cy="336" r="2.2"/><circle cx="350" cy="324" r="2.2"/><circle cx="372" cy="334" r="2.2"/><circle cx="388" cy="322" r="2.2"/><circle cx="316" cy="342" r="2.2"/><circle cx="362" cy="343" r="2.2"/></g>
      <path d="M398 296 V350" ${s('gown2', 3)}/>
      <rect x="400" y="290" width="88" height="56" rx="6" ${f('skin3')}/>
      <rect x="400" y="326" width="88" height="20" ${f('ink')} opacity=".18"/>
      <rect x="406" y="299" width="72" height="35" rx="5" ${f('tape')}/>
      <rect x="412" y="305" width="60" height="23" rx="3" ${f('gauze')}/>
      <path d="M420 312 H464 M420 319 H456" ${s('sheet2', 1.5)}/>
      <rect x="520" y="286" width="150" height="70" ${f('blanket')}/>
      <rect x="520" y="286" width="16" height="70" ${f('pillow')} opacity=".35"/>
      <path d="M560 300 V350 M600 300 V350" ${s('sheet', 2)} opacity=".18"/>
      <path d="M322 314 L382 312 C396 306 420 297 452 296 C486 296 510 306 530 316" ${s('pillow', 2)} opacity=".6" transform="translate(0 2)"/>
    </g>
    <path d="M284 346 C286 324 298 314 322 314" ${s('sheet2', 1.5)} opacity=".0"/>
    <!-- near foot-end rail and urine tubing -->
    <rect x="548" y="326" width="102" height="48" rx="8" ${s('metal', 5)}/>
    <path d="M582 326 V374 M616 326 V374" ${s('metal', 4)}/>
    <path d="M572 410 C566 392 540 386 522 378 C508 372 504 360 508 346" fill="none" stroke="var(--il-urinetube)" stroke-width="3" stroke-linecap="round"/>
    <!-- arm, IV tape, wristband, pulse oximeter -->
    <ellipse cx="300" cy="336" rx="19" ry="15" ${f('gown')}/><ellipse cx="300" cy="342" rx="19" ry="9" ${f('gown2')} opacity=".6"/>
    <path d="M306 342 C318 339 336 338 352 342 L352 355 C336 357 318 357 306 355 z" ${f('skin3')}/>
    <path d="M306 352 C318 355 336 355 352 353 V355 C336 358 318 358 306 355z" ${f('ink')} opacity=".25"/>
    <ellipse cx="364" cy="349" rx="14" ry="7" ${f('skin3')}/>
    <rect x="368" y="342" width="11" height="14" rx="3" ${f('phone')}/><circle cx="373" cy="349" r="2" ${f('hr')}/>
    <rect x="344" y="341" width="8" height="15" rx="2" ${f('pillow')}/>
    <rect x="328" y="340" width="13" height="14" rx="2" ${f('tape')} transform="rotate(-8 334 347)"/>
    <!-- drain bulb clipped to the gown -->
    <rect x="394" y="314" width="9" height="16" rx="2" ${f('metal')} stroke="var(--il-ink)" stroke-width="1"/>
    <path d="M402 326 H408" ${s('metal', 3)}/>
    <path d="M410 328 C410 318 416 316 424 316" fill="none" stroke="var(--il-iv)" stroke-width="3" stroke-linecap="round"/>
    <rect x="404" y="326" width="12" height="9" rx="2" ${f('phone')}/>
    <ellipse cx="410" cy="352" rx="14" ry="18" ${f('bagplastic')} stroke="var(--il-metal)" stroke-width="2"/>
    <path d="M397 354 q13 8 26 0 v4 q0 12 -13 14 q-13 -2 -13 -14z" ${f('blood')}/>
    <path d="M401 346 q9 3 18 0 M401 361 q9 3 18 0" ${s('metal', 1.2)} opacity=".6"/>
    <ellipse cx="403" cy="344" rx="3" ry="6" fill="#fff" opacity=".55"/>
    <!-- PCA handset and cable -->
    <path d="M160 366 C220 414 330 404 376 364" ${s('ink', 2.5)}/>
    <rect x="372" y="358" width="20" height="11" rx="5" ${f('lamp')} stroke="var(--il-ink)" stroke-width="1.5"/>
    <!-- urine bag on the bed frame -->
    <rect x="580" y="404" width="16" height="8" rx="2" ${f('metal')}/>
    <path d="M566 408 h44 q8 0 8 8 v20 q0 12 -12 12 h-36 q-12 0 -12 -12 v-20 q0 -8 8 -8z" ${f('bagplastic')} stroke="var(--il-metal)" stroke-width="2"/>
    <rect x="558" y="428" width="64" height="26" ${f('urine')} clip-path="url(#il-bag)"/>
    <path d="M566 422 h9 M566 432 h9 M566 442 h9" ${s('ink', 1.5)} opacity=".5"/>
    <rect x="584" y="448" width="8" height="5" rx="1" ${f('ink')}/>
    <!-- over-bed table, chart on a clipboard, cup -->
    <rect x="756" y="356" width="10" height="76" ${f('frame2')}/><rect x="724" y="430" width="74" height="8" rx="3" ${f('frame2')}/>
    <circle cx="732" cy="442" r="5" ${f('phone')}/><circle cx="790" cy="442" r="5" ${f('phone')}/>
    <rect x="640" y="346" width="150" height="11" rx="4" ${f('desk')}/><rect x="640" y="353" width="150" height="4" rx="2" ${f('desk2')}/>
    <g transform="rotate(-5 730 346)">
      <rect x="702" y="288" width="56" height="60" rx="4" ${f('desk2')}/>
      <rect x="707" y="296" width="46" height="48" rx="2" ${f('paper')}/>
      <polyline points="711,312 719,312 722,304 726,318 730,308 734,312 748,312" ${s('hr', 1.6)}/>
      <path d="M711 324 H748 M711 331 H742 M711 338 H746" ${s('grid', 1.5)}/>
      <rect x="720" y="283" width="20" height="10" rx="2" ${f('metal')}/>
    </g>
    <rect x="662" y="322" width="18" height="24" rx="3" ${f('cup')}/><path d="M676 318 L672 336" ${s('lamp', 2)}/>
    <!-- IV pole, fluid bag, drip chamber, infusion pump, PCA pump -->
    <path d="M128 92 V436 M100 92 H156" ${s('metal', 4)}/>
    <path d="M128 436 L96 448 M128 436 L160 448 M128 436 V450" ${s('metal', 4)}/>
    <circle cx="96" cy="452" r="4" ${f('phone')}/><circle cx="160" cy="452" r="4" ${f('phone')}/><circle cx="128" cy="454" r="4" ${f('phone')}/>
    <path d="M110 102 h36 q6 0 6 6 v46 q0 18 -24 18 q-24 0 -24 -18 v-46 q0 -6 6 -6z" ${f('bagplastic')} stroke="var(--il-metal)" stroke-width="2"/>
    <path d="M104 134 h48 v20 q0 18 -24 18 q-24 0 -24 -18z" ${f('fluid')}/>
    <circle cx="128" cy="110" r="3" ${f('ink')}/>
    <rect x="121" y="188" width="14" height="18" rx="4" ${f('bagplastic')} stroke="var(--il-metal)" stroke-width="1.5"/><circle cx="128" cy="198" r="2" ${f('fluid')}/>
    <path d="M128 172 V188 M128 206 V240" ${s('iv', 2)}/>
    <rect x="96" y="240" width="64" height="54" rx="6" ${f('pump')} stroke="var(--il-pump2)" stroke-width="2"/>
    <rect x="103" y="247" width="50" height="22" rx="3" ${f('screen')}/>
    <text x="128" y="263" font-size="12" font-weight="700" text-anchor="middle" ${f('ok')}>RUN</text>
    <circle cx="110" cy="282" r="4" ${f('pump2')}/><circle cx="128" cy="282" r="4" ${f('pump2')}/><circle cx="146" cy="282" r="4" ${f('ok')}/>
    <path d="M160 270 C215 236 330 236 336 340" ${s('iv', 2.5)}/>
    <rect x="96" y="332" width="64" height="52" rx="6" ${f('pump')} stroke="var(--il-pump2)" stroke-width="2"/>
    <rect x="102" y="338" width="52" height="16" rx="3" ${f('screen')}/>
    <rect x="106" y="343" width="36" height="6" rx="2" ${f('bagplastic')}/><path d="M142 346 H150" ${s('metal', 2)}/>
    <rect x="104" y="362" width="18" height="12" rx="3" ${f('pump2')}/><rect x="126" y="362" width="18" height="12" rx="3" ${f('pump2')}/>
    <circle cx="148" cy="372" r="3.5" ${f('ok')}/>
    <g class="leaders">${leaders}</g>
  </svg>`;
}
