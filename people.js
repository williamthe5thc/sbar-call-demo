// Semi-realistic people for the hand-built SVG scenes: shaded faces, hair, scrubs,
// a white coat, stethoscope, handset. Pure inline SVG strings, no images or libraries.
// Colors are literal here (the people are lit by the room, not themed per color scheme).
// Every id is prefixed with the scene's prefix `p`, so scenes on one page never clash.

export const SKIN = {
  patient: { base: '#b07a56', hi: '#d09b75', lo: '#7a4c33', lip: '#8e4f40' },
  nurse: { base: '#dfae88', hi: '#f1caa6', lo: '#b3805c', lip: '#b8666a' },
  doctor: { base: '#8a5a3e', hi: '#aa785a', lo: '#573626', lip: '#6c382f' },
};
const HAIR = {
  patient: ['#3b3633', '#8f8c8a'],
  nurse: ['#2a1810', '#6a4228'],
  doctor: ['#17110f', '#473630'],
};

export const peopleDefs = (p, keys) => keys.map((k) => {
  const c = SKIN[k];
  return `
  <radialGradient id="${p}-sk-${k}" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="${c.hi}"/><stop offset=".5" stop-color="${c.base}"/><stop offset="1" stop-color="${c.lo}"/></radialGradient>
  <linearGradient id="${p}-sl-${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.lo}"/><stop offset=".45" stop-color="${c.base}"/><stop offset="1" stop-color="${c.lo}"/></linearGradient>`;
}).join('') + `
  <linearGradient id="${p}-scrub" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46bfae"/><stop offset=".55" stop-color="#27968a"/><stop offset="1" stop-color="#15594f"/></linearGradient>
  <linearGradient id="${p}-navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34527a"/><stop offset="1" stop-color="#14233a"/></linearGradient>
  <linearGradient id="${p}-coat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfdff"/><stop offset=".6" stop-color="#d6dfea"/><stop offset="1" stop-color="#9aa9bd"/></linearGradient>
  <linearGradient id="${p}-hset" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a475e"/><stop offset=".4" stop-color="#18202f"/><stop offset="1" stop-color="#090d15"/></linearGradient>
  <linearGradient id="${p}-steth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8eef6"/><stop offset=".5" stop-color="#8a9bb2"/><stop offset="1" stop-color="#4d5c72"/></linearGradient>
  <filter id="${p}-pb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>`;

/* ---------- face (local origin = head center; about 52 wide, 62 tall) ---------- */

const MOODS = {
  calm: { brows: ['M-18 -10 Q-11 -14 -4 -11', 'M4 -11 Q11 -14 18 -10'], eye: 'open', look: 0, mouth: 'smile' },
  unsure: { brows: ['M-18 -11 Q-11 -18 -4 -13.5', 'M4 -10 L18 -9'], eye: 'open', look: 1.8, mouth: 'side' },
  confused: { brows: ['M-18 -6.5 L-4 -13.5', 'M4 -13.5 L18 -6.5'], eye: 'wide', look: 0, mouth: 'wave' },
  pain: { brows: ['M-18 -12 Q-10 -11 -4 -7.5', 'M4 -7.5 Q10 -11 18 -12'], eye: 'half', look: 0, mouth: 'tight' },
  rest: { brows: ['M-18 -9 Q-11 -11.5 -4 -9.5', 'M4 -9.5 Q11 -11.5 18 -9'], eye: 'closed', look: 0, mouth: 'soft' },
};

function eyes(m, hairCol) {
  const one = (cx, flip) => {
    const k = flip ? -1 : 1;
    const x = (v) => cx + v * k;
    if (m.eye === 'closed') {
      return `<path d="M${x(-5)} -3 Q${x(0)} 1 ${x(5)} -3" fill="none" stroke="#2a1a14" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M${x(-4)} -2 l-1 2 M${x(0)} -.5 l0 2 M${x(4)} -2 l1 2" stroke="#2a1a14" stroke-width=".8" stroke-linecap="round"/>`;
    }
    const w = m.eye === 'wide' ? 1.25 : 1;
    const h = m.eye === 'half' ? 3.2 : m.eye === 'wide' ? 5.6 : 4.4;
    const ir = m.eye === 'wide' ? 2.5 : 2.7;
    const lid = m.eye === 'half' ? `<path d="M${x(-5.6 * w)} -3.2 Q${x(0)} ${-3.6 - 0} ${x(5.6 * w)} -3.2 L${x(5.6 * w)} -6.2 Q${x(0)} ${-9.6} ${x(-5.6 * w)} -6.2z" fill="${'currentColor'}" opacity="0"/>` : '';
    return `
      <path d="M${x(-5.6 * w)} -3 Q${x(0)} ${-3 - h * 1.6} ${x(5.6 * w)} -3 Q${x(0)} ${-3 + h * .7} ${x(-5.6 * w)} -3z" fill="#f1ebe3"/>
      <circle cx="${x(m.look)}" cy="-3" r="${ir}" fill="#2b1b12"/><circle cx="${x(m.look)}" cy="-3" r="1.1" fill="#07070a"/>
      <circle cx="${x(m.look + .9)}" cy="-4" r=".75" fill="#fff" opacity=".9"/>
      <path d="M${x(-6 * w)} -3 Q${x(0)} ${-3 - h * 1.7} ${x(6 * w)} -3" fill="none" stroke="#1c110c" stroke-width="1.6" stroke-linecap="round"/>
      ${m.eye === 'half' ? `<path d="M${x(-5.6)} -3 Q${x(0)} -4.2 ${x(5.6)} -3 Q${x(0)} -9.6 ${x(-5.6)} -3z" fill="url(#LID)" opacity=".55"/>` : ''}
      <path d="M${x(-5)} -2 Q${x(0)} ${-3 + h * .8} ${x(5)} -2" fill="none" stroke="#000" stroke-opacity=".18" stroke-width=".7"/>${lid}`;
  };
  return one(-10, false) + one(10, true);
}

function mouth(kind, lip) {
  const dark = '#3a1b17';
  const line = (d) => `<path d="${d}" fill="none" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>`;
  const upper = (d) => `<path d="${d}" fill="${lip}"/>`;
  switch (kind) {
    case 'smile':
      return upper('M-8.5 18 Q-4 15.8 0 17.3 Q4 15.8 8.5 18 Q0 19.4 -8.5 18z')
        + `<path d="M-8.5 18 Q0 20.2 8.5 18 Q5 25.5 0 25.5 Q-5 25.5 -8.5 18z" fill="${lip}"/><path d="M-4 22.4 Q0 24 4 22.4" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"/>`
        + line('M-9.5 17.2 Q-9 18.4 -8 18.6 M9.5 17.2 Q9 18.4 8 18.6 M-8.5 18 Q0 20.4 8.5 18');
    case 'side':
      return upper('M-7 20.5 Q-3 18.6 1 19.4 Q5 18.4 8 18.6 Q2 21 -7 20.5z')
        + `<path d="M-7 20.5 Q1 22 8 18.6 Q4 24 -1 23.6 Q-5 23 -7 20.5z" fill="${lip}"/>` + line('M-7 20.5 Q1 21.4 8 18.6');
    case 'wave':
      return `<path d="M-5.5 21.5 Q0 16.5 5.5 21.5 Q0 26.5 -5.5 21.5z" fill="${dark}"/><path d="M-3 23.2 Q0 25 3 23.2" fill="none" stroke="${lip}" stroke-width="1.4" opacity=".8"/>`
        + `<path d="M-8 20.5 Q-5.5 19 -5.5 21.5 M8 20.5 Q5.5 19 5.5 21.5" fill="none" stroke="${dark}" stroke-width="1" opacity=".5"/>`;
    case 'tight':
      return upper('M-7 20.2 Q0 17.8 7 20.2 Q0 21.4 -7 20.2z') + `<path d="M-7 20.4 Q0 23.6 7 20.4 Q4 24 0 24 Q-4 24 -7 20.4z" fill="${lip}" opacity=".85"/>` + line('M-7.4 20.4 Q0 18.9 7.4 20.4');
    default: // soft
      return upper('M-6.5 20 Q-3 18.4 0 19 Q3 18.4 6.5 20 Q0 21 -6.5 20z') + `<path d="M-6.5 20 Q0 22.4 6.5 20 Q3 25 0 25 Q-3 25 -6.5 20z" fill="${lip}" opacity=".9"/>` + line('M-6.7 20 Q0 21.3 6.7 20');
  }
}

function hairFront(kind, col, hi, gray) {
  const cap = 'M-26.5 -1 C-31 -26 -14 -36.5 1 -36 C18 -36 31 -25 26.5 -1 C24.5 -11 20.5 -19 13 -23 C4 -19.5 -10 -17.5 -17 -23.5 C-22 -19 -25 -12 -26.5 -1z';
  const part = 'M-26.5 0 C-32 -26 -15 -37.5 0 -37 C16 -37 32 -26 26.5 0 C25 -10 22 -21 13 -26 C7 -21 2 -20.5 -2 -23.5 C-7 -20 -15 -21 -19.5 -27 C-24 -19 -26 -9 -26.5 0z';
  const base = kind === 'tied' ? part : cap;
  return `<path d="${base}" fill="${col}"/>
    <path d="${base}" fill="url(#GLOSS)" opacity=".35"/>
    <path d="M-14 -31 Q0 -36.5 15 -30 M-20 -24 Q-8 -33 8 -33 M-8 -27 Q4 -32 18 -26" fill="none" stroke="${hi}" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>
    ${kind === 'tied' ? `<path d="M-2 -23.5 Q-6 -31 -4 -36.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/>` : ''}
    ${gray ? `<path d="M-26.5 -1 C-27 -9 -25 -14 -22 -18 L-20 -10 L-22 0z M26.5 -1 C27 -9 25 -14 22 -18 L20 -10 L22 0z" fill="${gray}" opacity=".85"/>` : ''}`;
}

/* The head. o: { p, skin, hair:'short'|'tied', mood, glasses, gray, sweat } */
export function head(o) {
  const { p, skin, mood, hair = 'short' } = o;
  const m = MOODS[mood] || MOODS.calm;
  const c = SKIN[skin];
  const [hc, hh] = HAIR[skin];
  const id = (n) => `${p}-${n}-${skin}`;
  const bun = hair === 'tied'
    ? `<ellipse cx="3" cy="-41" rx="12.5" ry="10" fill="${hc}"/><path d="M-6 -44 Q3 -50 12 -43 M-7 -40 Q3 -46 13 -38" fill="none" stroke="${hh}" stroke-opacity=".6" stroke-width="1.3"/><path d="M-9 -34 Q3 -30 15 -34" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1"/>`
    : '';
  return `<g>
    <defs>
      <linearGradient id="${id('lid')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.lo}"/><stop offset="1" stop-color="${c.base}"/></linearGradient>
      <linearGradient id="${id('gloss')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    ${bun}
    <ellipse cx="-26.4" cy="3" rx="4.2" ry="7" fill="${c.base}"/><ellipse cx="26.4" cy="3" rx="4.2" ry="7" fill="${c.lo}"/>
    <path d="M-27.4 0 q-1.8 3 0 6 M27.4 0 q1.8 3 0 6" fill="none" stroke="${c.lo}" stroke-width="1.1"/>
    <path d="M0 -31 C16 -31 26 -20 26 -2 C26 16 14 30.5 0 31 C-14 30.5 -26 16 -26 -2 C-26 -20 -16 -31 0 -31z" fill="url(#${p}-sk-${skin})"/>
    <path d="M-26 2 C-24 20 -12 30 0 31 C-8 24 -20 14 -22 -2z" fill="#000" opacity=".12"/>
    <path d="M26 -2 C26 16 14 30.5 0 31 C12 26 22 14 21 -4z" fill="#000" opacity=".2"/>
    <ellipse cx="-12" cy="-19" rx="10" ry="6" fill="#fff" opacity=".1"/>
    <ellipse cx="-14" cy="9" rx="6" ry="4.5" fill="${c.hi}" opacity=".25"/>
    <ellipse cx="16" cy="12" rx="5" ry="3.5" fill="${c.lip}" opacity="${skin === 'nurse' ? '.22' : '.12'}"/>
    <path d="M-20 -3 Q-10 -9 -3 -3 M3 -3 Q10 -9 20 -3" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="3"/>
    ${o.glasses ? '' : ''}
    ${eyes(m, hc).replace(/url\(#LID\)/g, `url(#${id('lid')})`)}
    <path d="${m.brows[0]}" fill="none" stroke="${hc}" stroke-width="2.4" stroke-linecap="round"/><path d="${m.brows[1]}" fill="none" stroke="${hc}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M1.2 -2 C2.4 4 4.2 7.5 5.6 10.4 Q1 13.6 -4.6 10.6" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-1.4 -3 C-1.2 3 -.6 7 -.2 9" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="-3.4" cy="11" rx="1.3" ry=".9" fill="#2a120d" opacity=".55"/><ellipse cx="3.8" cy="11" rx="1.3" ry=".9" fill="#2a120d" opacity=".55"/>
    ${mouth(m.mouth, c.lip)}
    ${o.stubble ? `<path d="M-19 8 C-18 24 -8 30 0 30 C8 30 18 24 19 8 C14 20 6 22 0 22 C-6 22 -14 20 -19 8z" fill="#2c2623" opacity=".22"/>` : ''}
    ${hairFront(hair, hc, hh, o.gray ? '#a3a09e' : '')
      .replace(/url\(#GLOSS\)/g, `url(#${id('gloss')})`)}
    ${o.glasses ? `<g fill="#fff" fill-opacity=".07" stroke="#252a35" stroke-width="1.5"><rect x="-18" y="-9.5" width="15" height="11.5" rx="4.5"/><rect x="3" y="-9.5" width="15" height="11.5" rx="4.5"/></g>
      <path d="M-3 -5 Q0 -7 3 -5 M-18 -6 L-26 -4 M18 -6 L26 -4" fill="none" stroke="#252a35" stroke-width="1.4"/><path d="M-15 -8 L-8 -8 M6 -8 L13 -8" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/>` : ''}
    ${o.sweat ? `<g fill="#e8f3fb" opacity=".8"><ellipse cx="-11" cy="-15.5" rx="1" ry="1.4"/><ellipse cx="7" cy="-15" rx=".9" ry="1.3"/><ellipse cx="15" cy="-12" rx=".9" ry="1.3"/><ellipse cx="-2" cy="-14.5" rx=".8" ry="1.1"/></g>` : ''}
  </g>`;
}

/* ---------- bust: neck, shoulders, garment, stethoscope, handset (local origin = head center) ---------- */

const coil = (x1, y1, x2, y2, n, col) => {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  let out = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n, sag = Math.sin(t * Math.PI) * 10;
    out += `<ellipse cx="${(x1 + dx * t).toFixed(1)}" cy="${(y1 + dy * t + sag).toFixed(1)}" rx="2.6" ry="5" transform="rotate(${(ang + 20).toFixed(0)} ${(x1 + dx * t).toFixed(1)} ${(y1 + dy * t + sag).toFixed(1)})"/>`;
  }
  return `<g fill="none" stroke="${col}" stroke-width="1.4" opacity=".95">${out}</g>`;
};
export { coil };

export function bust(o) {
  const { p, skin, hair, mood, garment = 'scrub', side = 1, x, y, s = 1, tilt = 0 } = o;
  const c = SKIN[skin];
  const sk = `url(#${p}-sk-${skin})`;
  const body = garment === 'coat'
    ? `<path d="M-76 140 L-76 70 C-76 52 -58 44 -34 40 L-12 36 L0 58 L12 36 L34 40 C58 44 76 52 76 140z" fill="url(#${p}-navy)"/>
       <path d="M-14 36 L0 62 L14 36 L10 34 L0 50 L-10 34z" fill="#e9eef5" opacity=".85"/>
       <path d="M-80 140 L-80 70 C-80 52 -62 44 -36 40 L-16 34 L-26 60 L-18 78 L-22 140z" fill="url(#${p}-coat)"/>
       <path d="M80 140 L80 70 C80 52 62 44 36 40 L16 34 L26 60 L18 78 L22 140z" fill="url(#${p}-coat)"/>
       <path d="M-16 34 L-26 60 L-18 78 M16 34 L26 60 L18 78" fill="none" stroke="#7d8ea6" stroke-width="1.6"/>
       <path d="M-26 60 L-36 54 M26 60 L36 54" stroke="#7d8ea6" stroke-width="1.2"/>
       <path d="M-60 96 Q-52 118 -56 140 M60 98 Q54 118 58 140 M-40 60 Q-46 70 -44 84" fill="none" stroke="#6f819b" stroke-opacity=".5" stroke-width="2"/>
       <path d="M36 50 Q56 56 66 76" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
       <rect x="-62" y="88" width="14" height="10" rx="1.5" fill="#fff" stroke="#9aa9bd" stroke-width="1" transform="rotate(-4 -55 93)"/>
       <rect x="34" y="82" width="12" height="16" rx="2" fill="#f4f7fb" stroke="#6f819b" stroke-width="1"/><rect x="37" y="86" width="6" height="6" rx="1" fill="#3a5f8f"/><path d="M38 95 h4" stroke="#6f819b" stroke-width="1"/>`
    : `<path d="M-14 34 L0 64 L14 34z" fill="${c.lo}"/><path d="M-14 34 L0 64 L14 34z" fill="#000" opacity=".15"/>
       <path d="M-76 140 L-76 72 C-76 52 -58 44 -34 40 L-13 35 L0 62 L13 35 L34 40 C58 44 76 52 76 140z" fill="url(#${p}-scrub)"/>
       <path d="M-13 35 L0 62 L13 35" fill="none" stroke="#0f4a42" stroke-width="3" stroke-linejoin="round"/>
       <path d="M-12 36 L0 59 L12 36" fill="none" stroke="#7fe0d0" stroke-opacity=".55" stroke-width="1.2"/>
       <path d="M-56 96 Q-48 118 -52 140 M-24 74 Q-30 100 -28 140 M44 80 Q50 110 46 140" fill="none" stroke="#0b3b35" stroke-opacity=".45" stroke-width="2.2"/>
       <path d="M34 48 Q56 54 66 76 M-58 54 Q-66 64 -68 80" fill="none" stroke="#bff3ea" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>
       <rect x="28" y="90" width="26" height="22" rx="3" fill="#1f8478" stroke="#0f4a42" stroke-width="1.2"/><path d="M28 96 H54" stroke="#0f4a42" stroke-width="1"/>`;
  const steth = `<path d="M-12 33 C-25 66 -20 94 -2 96 C18 94 25 66 12 33" fill="none" stroke="#10151f" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M-12.4 33 C-25 66 -20 94 -2 96" fill="none" stroke="#5a6a82" stroke-width="1" stroke-linecap="round" opacity=".7"/>
    <circle cx="5" cy="100" r="7.5" fill="url(#${p}-steth)" stroke="#2c3647" stroke-width="1.2"/><circle cx="5" cy="100" r="4.2" fill="#2b3547"/><circle cx="3.6" cy="98.6" r="1.3" fill="#fff" opacity=".7"/>
    <path d="M-2 96 L5 93" stroke="#10151f" stroke-width="3"/>`;
  // Raised forearm holding a handset at the ear on `side` (1 = screen right, -1 = screen left).
  const k = side;
  const handset = `
    <g transform="scale(${k} 1)">
      <path d="M54 54 C74 62 80 84 72 104" fill="none" stroke="${garment === 'coat' ? '#8d9db3' : '#0f4a42'}" stroke-width="27" stroke-linecap="round" opacity=".55"/>
      <path d="M54 54 C74 62 80 84 72 104" fill="none" stroke="${garment === 'coat' ? 'url(#' + p + '-coat)' : 'url(#' + p + '-scrub)'}" stroke-width="24" stroke-linecap="round"/>
      <path d="M50 52 C66 56 72 70 70 86" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3" stroke-linecap="round"/>
      <path d="M72 96 C86 84 78 44 52 14" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="15" stroke-linecap="round" filter="url(#${p}-pb)"/>
      <path d="M72 94 C85 82 77 44 51 14" fill="none" stroke="url(#${p}-sl-${skin})" stroke-width="12" stroke-linecap="round"/>
      <path d="M69 88 C80 76 73 46 49 17" fill="none" stroke="${c.hi}" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
      <rect x="31" y="-14" width="11" height="42" rx="5.5" fill="url(#${p}-hset)" transform="rotate(7 36 7)"/>
      <rect x="27" y="-17" width="15" height="12" rx="5" fill="#0c1220" transform="rotate(7 36 7)"/><rect x="29" y="23" width="14" height="9" rx="4" fill="#0c1220" transform="rotate(7 36 7)"/>
      <path d="M35 -10 L36.5 20" stroke="#fff" stroke-opacity=".28" stroke-width="1.2" stroke-linecap="round"/>
      <ellipse cx="40" cy="12" rx="6.5" ry="9" fill="${sk}" transform="rotate(10 40 12)"/>
      <path d="M35 4 q6 1 7 4 M35 9 q6 1 7 4 M36 14 q6 1 6 4" fill="none" stroke="${c.lo}" stroke-width="1.1" stroke-linecap="round"/>
    </g>`;
  const shoulderShade = `<ellipse cx="0" cy="40" rx="22" ry="9" fill="#000" opacity=".35" filter="url(#${p}-pb)"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(${tilt})">
    ${body}
    <path d="M-10 18 L-12 38 Q0 46 12 38 L10 18z" fill="url(#${p}-sl-${skin})"/>
    ${shoulderShade}
    <path d="M-10 28 Q0 36 10 28 L10 34 Q0 42 -10 34z" fill="#000" opacity=".18"/>
    ${steth}
    ${head({ p, skin, hair, mood, glasses: o.glasses, gray: o.gray, stubble: o.stubble, sweat: o.sweat })}
    ${o.noPhone ? '' : handset}
  </g>`;
}
