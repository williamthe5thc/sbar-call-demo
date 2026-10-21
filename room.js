// The bedside room, hand-built as one inline SVG (800 x 500 units).
// Night: lit by the warm reading lamp and the cool glow of the monitor.
// Dawn: the same room at sunrise, light through the blinds, patient resting.
// Hotspot positions in scenario.js are percentages of this box (x * 8, y * 5 units).
// Everything is decorative (aria-hidden); every finding is also in HTML.
// Shared shapes and gradients live in <defs>; ids carry a prefix so scenes never clash.
import { head, peopleDefs } from './people.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const THEME = {
  night: {
    wallA: '#1c2b46', wallB: '#0f1a2e', wain: '#18263d', wain2: '#0b1424', floorA: '#142239', floorB: '#050a14',
    skyA: '#040a1a', skyB: '#17305a', skyC: '#2a4a7c',
  },
  dawn: {
    wallA: '#6c6577', wallB: '#47445a', wain: '#5a4f5c', wain2: '#352f40', floorA: '#4a3d46', floorB: '#251f2b',
    skyA: '#52639a', skyB: '#f19a66', skyC: '#ffd9a0',
  },
};

export function roomSvg({ id = 'ia', mode = 'night', chart = null, data = null, hotspots = [] }) {
  const p = id;
  const dawn = mode === 'dawn';
  const T = THEME[mode];
  const u = (n) => `url(#${p}-${n})`;
  const d = data;

  /* ---------- defs: gradients, filters, repeated shapes ---------- */
  const defs = `
  <defs>
    <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wallA}"/><stop offset="1" stop-color="${T.wallB}"/></linearGradient>
    <linearGradient id="${p}-wain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wain}"/><stop offset="1" stop-color="${T.wain2}"/></linearGradient>
    <linearGradient id="${p}-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.floorA}"/><stop offset="1" stop-color="${T.floorB}"/></linearGradient>
    <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.skyA}"/><stop offset=".65" stop-color="${T.skyB}"/><stop offset="1" stop-color="${T.skyC}"/></linearGradient>
    <linearGradient id="${p}-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d8da4"/><stop offset=".3" stop-color="#eef3fa"/><stop offset=".55" stop-color="#a5b4c8"/><stop offset="1" stop-color="#5c6b82"/></linearGradient>
    <linearGradient id="${p}-metalv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f5fb"/><stop offset=".45" stop-color="#9fb0c6"/><stop offset="1" stop-color="#56667e"/></linearGradient>
    <linearGradient id="${p}-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6247"/><stop offset=".5" stop-color="#6a4a35"/><stop offset="1" stop-color="#4a3224"/></linearGradient>
    <linearGradient id="${p}-woodv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a47a58"/><stop offset="1" stop-color="#5a3d2b"/></linearGradient>
    <linearGradient id="${p}-mat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6e0ee"/><stop offset="1" stop-color="#8797b2"/></linearGradient>
    <linearGradient id="${p}-linen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f6fb"/><stop offset=".6" stop-color="#cdd8e7"/><stop offset="1" stop-color="#9aaac3"/></linearGradient>
    <linearGradient id="${p}-pillow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3eaf4"/><stop offset="1" stop-color="#aebbd0"/></linearGradient>
    <linearGradient id="${p}-blanket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa0c4"/><stop offset=".5" stop-color="#3f84aa"/><stop offset="1" stop-color="#27607f"/></linearGradient>
    <linearGradient id="${p}-plastic" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="#fff" stop-opacity=".12"/><stop offset=".7" stop-color="#cfe6f4" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>
    <linearGradient id="${p}-fluid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8f8"/><stop offset="1" stop-color="#6fb9db"/></linearGradient>
    <linearGradient id="${p}-urine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c23c"/><stop offset="1" stop-color="#b98a14"/></linearGradient>
    <linearGradient id="${p}-blood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c13a40"/><stop offset="1" stop-color="#7d1820"/></linearGradient>
    <linearGradient id="${p}-straw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1dc9a"/><stop offset="1" stop-color="#d1b25a"/></linearGradient>
    <linearGradient id="${p}-pump" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset=".5" stop-color="#cdd8e6"/><stop offset="1" stop-color="#8d9db5"/></linearGradient>
    <linearGradient id="${p}-pca" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6c8196"/><stop offset=".5" stop-color="#46586b"/><stop offset="1" stop-color="#2a3646"/></linearGradient>
    <linearGradient id="${p}-bezel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a5b76"/><stop offset=".4" stop-color="#26334a"/><stop offset="1" stop-color="#0d1524"/></linearGradient>
    <linearGradient id="${p}-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07111f"/><stop offset="1" stop-color="#0b1a2e"/></linearGradient>
    <linearGradient id="${p}-glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${p}-slat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dawn ? '#f2e4d6' : '#8294b4'}"/><stop offset="1" stop-color="${dawn ? '#a8927f' : '#3a4a68'}"/></linearGradient>
    <linearGradient id="${p}-pleat" x1="0" y1="0" x2=".21" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="${dawn ? '#7a8a96' : '#3b586c'}"/><stop offset=".5" stop-color="${dawn ? '#a2b2bc' : '#628299'}"/><stop offset="1" stop-color="${dawn ? '#7a8a96' : '#3b586c'}"/></linearGradient>
    <linearGradient id="${p}-lampcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd089" stop-opacity=".5"/><stop offset="1" stop-color="#ffb255" stop-opacity="0"/></linearGradient>
    <linearGradient id="${p}-beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".42"/><stop offset="1" stop-color="#ffb070" stop-opacity=".02"/></linearGradient>
    <radialGradient id="${p}-lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffc977" stop-opacity=".52"/><stop offset=".4" stop-color="#ffb55c" stop-opacity=".2"/><stop offset="1" stop-color="#ff9f3f" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-mon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#78c0ff" stop-opacity=".34"/><stop offset=".5" stop-color="#4f9bf0" stop-opacity=".12"/><stop offset="1" stop-color="#3b82e0" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".6"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}-vig" cx=".5" cy=".46" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dawn ? '.4' : '.62'}"/></radialGradient>
    <radialGradient id="${p}-ball" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#8fd0ee"/></radialGradient>
    <pattern id="${p}-print" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#b9d0e8"/><path d="M6 1.5 L9 6 L6 10.5 L3 6z" fill="#7d9fc6"/><circle cx="0" cy="0" r="1.6" fill="#8fb0d4"/><circle cx="12" cy="12" r="1.6" fill="#8fb0d4"/><circle cx="12" cy="0" r="1.6" fill="#8fb0d4"/><circle cx="0" cy="12" r="1.6" fill="#8fb0d4"/></pattern>
    <pattern id="${p}-lights" width="7" height="8" patternUnits="userSpaceOnUse"><rect x="1.5" y="2" width="2.2" height="2.6" fill="#ffd47a" opacity="${dawn ? '.35' : '.85'}"/></pattern>
    <pattern id="${p}-grid" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0 H0 V8" fill="none" stroke="#1d3a4f" stroke-width=".5"/></pattern>
    <filter id="${p}-b2" filterUnits="userSpaceOnUse" x="0" y="0" width="800" height="500"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="${p}-b4" filterUnits="userSpaceOnUse" x="0" y="0" width="800" height="500"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="${p}-b9" filterUnits="userSpaceOnUse" x="0" y="0" width="800" height="500"><feGaussianBlur stdDeviation="9"/></filter>
    <clipPath id="${p}-mound"><path d="M276 349 C277 322 292 306 320 302 L382 300 C396 292 420 284 452 283 C486 283 510 294 530 306 L574 313 C604 313 630 312 646 322 L656 349 Z"/></clipPath>
    <clipPath id="${p}-ubag"><path d="M566 410 h44 q8 0 8 8 v20 q0 12 -12 12 h-36 q-12 0 -12 -12 v-20 q0 -8 8 -8z"/></clipPath>
    <clipPath id="${p}-ivbag"><path d="M110 104 h36 q6 0 6 6 v44 q0 20 -24 20 q-24 0 -24 -20 v-44 q0 -6 6 -6z"/></clipPath>
    <clipPath id="${p}-win"><rect x="599" y="49" width="152" height="132" rx="2"/></clipPath>
    <clipPath id="${p}-tr1"><rect x="254" y="86" width="92" height="30"/></clipPath>
    <clipPath id="${p}-tr2"><rect x="254" y="122" width="92" height="22"/></clipPath>
    <clipPath id="${p}-tr3"><rect x="254" y="86" width="150" height="38"/></clipPath>
    <clipPath id="${p}-tr4"><rect x="254" y="130" width="150" height="38"/></clipPath>
    <clipPath id="${p}-scr"><rect x="252" y="70" width="156" height="102" rx="4"/></clipPath>
    <g id="${p}-caster"><rect x="-5" y="0" width="10" height="26" fill="url(#${p}-metal)"/><circle cx="0" cy="34" r="10" fill="#10161f"/><circle cx="0" cy="34" r="10" fill="none" stroke="#3a4558" stroke-width="2"/><circle cx="0" cy="34" r="4.2" fill="url(#${p}-metal)"/><path d="M-6 28 A8 8 0 0 1 2 26" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/></g>
    <g id="${p}-slatg"><rect width="158" height="5" rx="1.4" fill="url(#${p}-slat)"/><rect y="4" width="158" height="1.6" fill="#000" opacity=".3"/></g>
    <g id="${p}-wheel"><circle r="4" fill="#10161f"/><circle r="1.8" fill="#9aabc2"/></g>
    ${peopleDefs(p, ['patient'])}
  </defs>`;

  /* ---------- room shell ---------- */
  const floorLines = [];
  for (let x0 = -500; x0 <= 1300; x0 += 140) floorLines.push(`M${(400 + (x0 - 400) * 0.58).toFixed(0)} 358 L${x0} 500`);
  const shell = `
    <rect width="800" height="360" fill="${u('wall')}"/>
    <rect y="302" width="800" height="58" fill="${u('wain')}"/>
    <rect y="298" width="800" height="6" fill="url(#${p}-metalv)" opacity=".35"/>
    <rect y="302" width="800" height="1.5" fill="#000" opacity=".4"/>
    <rect y="356" width="800" height="144" fill="${u('floor')}"/>
    <rect y="354" width="800" height="7" fill="#05080f" opacity=".7"/>
    <rect y="350" width="800" height="4" fill="#fff" opacity=".07"/>
    <path d="${floorLines.join(' ')} M0 384 H800 M0 418 H800 M0 462 H800" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="1.2"/>
    ${dawn ? '' : `<ellipse cx="250" cy="446" rx="190" ry="15" fill="#ffb55c" opacity=".16" filter="url(#${p}-b4)"/>
    <ellipse cx="345" cy="474" rx="150" ry="9" fill="#78b4ff" opacity=".16" filter="url(#${p}-b4)"/>
    <path d="M326 462 H336 V500 H326z" fill="#78b4ff" opacity=".1" filter="url(#${p}-b4)"/><rect x="125" y="462" width="6" height="34" fill="#aebdd2" opacity=".14" filter="url(#${p}-b2)"/>
    <rect x="216" y="474" width="6" height="22" fill="#ffc46b" opacity=".16" filter="url(#${p}-b2)"/>`}
    <path d="M668 372 L706 372 L760 500 L650 500z" fill="${dawn ? '#ffd9a0' : '#8fb4ee'}" opacity="${dawn ? '.16' : '.07'}" filter="url(#${p}-b4)"/>`;

  /* ---------- privacy curtain on a track ---------- */
  const rings = Array.from({ length: 8 }, (_, i) => `<circle cx="${6 + i * 11}" cy="19" r="2.6" fill="none" stroke="#c9d4e3" stroke-width="1.2"/>`).join('');
  const curtain = `
    <rect x="0" y="9" width="410" height="5" rx="2" fill="${u('metalv')}"/>
    <rect x="0" y="14" width="410" height="2" fill="#000" opacity=".35"/>
    <rect x="408" y="8" width="5" height="9" rx="2" fill="${u('metal')}"/>
    <path d="M0 16 H92 V334 Q84 340 76 334 Q68 340 60 334 Q52 340 44 334 Q36 340 28 334 Q20 340 12 334 Q6 338 0 334z" fill="${u('pleat')}"/>
    <rect x="0" y="16" width="92" height="46" fill="#0c1626" opacity=".42"/>
    <path d="M0 24 H92 M0 32 H92 M0 40 H92 M0 48 H92 M0 56 H92 M8 16 V62 M20 16 V62 M32 16 V62 M44 16 V62 M56 16 V62 M68 16 V62 M80 16 V62" stroke="#c9d6e2" stroke-opacity=".12" stroke-width="1"/>
    <rect x="0" y="62" width="92" height="2" fill="#fff" opacity=".18"/>
    <rect x="0" y="16" width="92" height="320" fill="url(#${p}-wall)" opacity="0"/>
    <path d="M92 20 V334" stroke="#000" stroke-opacity=".35" stroke-width="3" filter="url(#${p}-b2)"/>
    ${rings}`;

  /* ---------- window, blinds, skyline, clock ---------- */
  const slats = Array.from({ length: dawn ? 6 : 6 }, (_, i) => `<use href="#${p}-slatg" x="596" y="${51 + i * (dawn ? 9 : 7)}"/>`).join('');
  const blindsBottom = dawn ? 51 + 6 * 9 : 51 + 6 * 7;
  const windowSvg = `
    <rect x="580" y="30" width="190" height="170" rx="7" fill="#0b1424" opacity=".55" filter="url(#${p}-b4)"/>
    <rect x="586" y="36" width="178" height="154" rx="5" fill="${dawn ? '#8a7f8e' : '#2d4263'}"/>
    <rect x="598" y="48" width="154" height="134" rx="3" fill="${u('sky')}"/>
    <g clip-path="url(#${p}-win)">
      ${dawn
    ? `<circle cx="690" cy="154" r="46" fill="${u('sun')}"/><circle cx="690" cy="156" r="14" fill="#fff3c4"/>`
    : `<circle cx="700" cy="108" r="13" fill="#f6f0d6"/><circle cx="706" cy="104" r="11.5" fill="#12274c"/><circle cx="700" cy="108" r="28" fill="#bcd2ff" opacity=".12" filter="url(#${p}-b4)"/>
      <g fill="#f6f0d6"><circle cx="618" cy="66" r="1.2"/><circle cx="650" cy="96" r="1"/><circle cx="680" cy="62" r="1.2"/><circle cx="740" cy="116" r="1"/><circle cx="636" cy="116" r="1"/></g>`}
      <g fill="${dawn ? '#6a5470' : '#0a1426'}">
        <rect x="600" y="136" width="20" height="46"/><rect x="622" y="124" width="22" height="58"/><rect x="646" y="142" width="16" height="40"/>
        <rect x="664" y="116" width="26" height="66"/><rect x="692" y="132" width="18" height="50"/><rect x="712" y="120" width="24" height="62"/><rect x="738" y="140" width="14" height="42"/>
      </g>
      <g fill="${u('lights')}"><rect x="600" y="136" width="20" height="46"/><rect x="622" y="124" width="22" height="58"/><rect x="646" y="142" width="16" height="40"/><rect x="664" y="116" width="26" height="66"/><rect x="692" y="132" width="18" height="50"/><rect x="712" y="120" width="24" height="62"/><rect x="738" y="140" width="14" height="42"/></g>
      ${dawn ? '' : `<g filter="url(#${p}-b2)"><circle cx="612" cy="150" r="3.4" fill="#ffd47a" opacity=".7"/><circle cx="676" cy="130" r="4" fill="#ff9d6a" opacity=".6"/><circle cx="724" cy="136" r="3.4" fill="#9fd0ff" opacity=".6"/></g>`}
      <rect x="599" y="49" width="152" height="40" fill="url(#${p}-glare)" opacity=".5"/>
    </g>
    <rect x="598" y="46" width="154" height="6" rx="2" fill="${u('metalv')}"/>
    ${slats}
    <rect x="596" y="${blindsBottom}" width="158" height="6" rx="2" fill="${u('metalv')}"/>
    <path d="M604 52 V${blindsBottom + 18} M744 52 V${blindsBottom + 8}" stroke="#d8e0ec" stroke-opacity=".6" stroke-width="1.3"/>
    <rect x="744" y="${blindsBottom + 6}" width="5" height="12" rx="2.5" fill="#c9d4e3"/>
    <rect x="582" y="190" width="186" height="9" rx="3" fill="${u('metalv')}"/><rect x="582" y="197" width="186" height="3" fill="#000" opacity=".35"/>
    ${dawn ? '' : `<path d="M598 182 L752 182 L772 214 L578 214z" fill="#7aa6e8" opacity=".05"/>`}
    <ellipse cx="520" cy="112" rx="26" ry="5" fill="#000" opacity=".4" filter="url(#${p}-b4)"/>
    <circle cx="523" cy="86" r="25" fill="#000" opacity=".4" filter="url(#${p}-b4)"/>
    <circle cx="520" cy="84" r="25" fill="${u('metal')}"/><circle cx="520" cy="84" r="21" fill="#e9eef5"/>
    <circle cx="520" cy="84" r="21" fill="${dawn ? '#6a5a60' : '#0a1626'}" opacity="${dawn ? '.12' : '.38'}"/>
    <path d="M520 65.5 V69 M538.5 84 H535 M520 102.5 V99 M501.5 84 H505 M529.3 68 l-1.7 3 M536 74.7 l-3 1.7 M536 93.3 l-3 -1.7 M529.3 100 l-1.7 -3 M510.7 100 l1.7 -3 M504 93.3 l3 -1.7 M504 74.7 l3 1.7 M510.7 68 l1.7 3" stroke="#2a3342" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M520 84 V70 M520 84 L527.5 79.6" stroke="#161c27" stroke-width="2.4" stroke-linecap="round"/><circle cx="520" cy="84" r="2.2" fill="#161c27"/>
    <path d="M505 72 A21 21 0 0 1 520 63" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;

  /* ---------- headwall: gas outlets, suction, call light, lamp ---------- */
  const headwall = `
    <rect x="434" y="168" width="172" height="86" rx="7" fill="#000" opacity=".35" filter="url(#${p}-b4)" transform="translate(3 4)"/>
    <rect x="434" y="168" width="172" height="86" rx="7" fill="#27384f" stroke="#41587a" stroke-width="1.5"/>
    <rect x="436" y="170" width="168" height="3" rx="1.5" fill="#fff" opacity=".12"/>
    <!-- oxygen flowmeter -->
    <rect x="446" y="180" width="22" height="58" rx="5" fill="${u('pump')}"/>
    <rect x="452" y="188" width="10" height="38" rx="3" fill="#0b1523"/>
    <circle cx="457" cy="211" r="3.6" fill="${u('ball')}"/><path d="M452 196 h3 M452 204 h3 M452 212 h3 M452 220 h3" stroke="#9fc2ea" stroke-width="1"/>
    <path d="M453 190 V224" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
    <circle cx="457" cy="232" r="4.8" fill="#2f9b63"/><circle cx="456" cy="231" r="1.6" fill="#a7f0c6"/>
    <circle cx="457" cy="176" r="0" fill="none"/>
    <circle cx="468" cy="178" r="7" fill="#2f9b63" stroke="#145a37" stroke-width="1.2"/><text x="468" y="181.2" font-size="8" font-weight="700" text-anchor="middle" fill="#fff">O2</text>
    <rect x="451" y="238" width="12" height="9" rx="2" fill="${u('metalv')}"/>
    <!-- suction regulator and canister -->
    <rect x="482" y="180" width="26" height="52" rx="6" fill="${u('pump')}"/>
    <circle cx="495" cy="198" r="9" fill="#f6f9fd" stroke="#6c7c93" stroke-width="1.4"/><path d="M495 198 L500 193" stroke="#c13a40" stroke-width="1.5" stroke-linecap="round"/><path d="M488 202 A9 9 0 0 1 502 190" fill="none" stroke="#6c7c93" stroke-width=".8" stroke-dasharray="1.4 2"/>
    <circle cx="495" cy="220" r="5.6" fill="#e8c23c" stroke="#8a6d10" stroke-width="1"/><circle cx="493.6" cy="218.6" r="1.8" fill="#fff6c9"/>
    <rect x="518" y="182" width="36" height="68" rx="7" fill="#cfe0ee" opacity=".22" stroke="#9bb2cc" stroke-width="1.6"/>
    <rect x="520" y="226" width="32" height="22" rx="5" fill="#9bc0d6" opacity=".25"/>
    <rect x="516" y="176" width="40" height="11" rx="4" fill="#e8c23c" stroke="#8a6d10" stroke-width="1"/>
    <path d="M524 196 h6 M524 206 h6 M524 216 h6 M524 226 h6 M524 236 h6" stroke="#cfe0ee" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M522 190 V244" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
    <path d="M508 192 C512 186 516 182 522 181" fill="none" stroke="#9fb4cc" stroke-width="2.4" stroke-linecap="round"/>
    <!-- outlets and nurse call -->
    <rect x="566" y="214" width="36" height="26" rx="4" fill="#dfe6ef" stroke="#8a99ae" stroke-width="1"/>
    <g fill="#2b3342"><circle cx="576" cy="223" r="2.4"/><circle cx="592" cy="223" r="2.4"/><rect x="574" y="230" width="4" height="6" rx="1"/><rect x="590" y="230" width="4" height="6" rx="1"/></g>
    <rect x="566" y="176" width="36" height="32" rx="5" fill="#eef2f8" stroke="#8a99ae" stroke-width="1"/>
    <circle cx="584" cy="191" r="8" fill="#c63b3b" stroke="#7f1d1d" stroke-width="1.2"/><circle cx="581.5" cy="188.5" r="2.4" fill="#ffb4b4" opacity=".8"/>
    <path d="M571 182 h8 M571 185 h8" stroke="#8a99ae" stroke-width="1"/>
    <path d="M594 208 C596 250 604 292 580 326" fill="none" stroke="#e8eef6" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M594 208 C596 250 604 292 580 326" fill="none" stroke="#7d8da4" stroke-width=".8" stroke-linecap="round"/>
    <rect x="196" y="250" width="420" height="9" rx="3" fill="${u('metalv')}"/><rect x="196" y="257" width="420" height="3" fill="#000" opacity=".35"/>
    <!-- hand sanitizer and glove box on the wall -->
    <rect x="641" y="218" width="26" height="46" rx="5" fill="#000" opacity=".4" filter="url(#${p}-b2)" transform="translate(2 3)"/>
    <rect x="640" y="216" width="26" height="46" rx="5" fill="${u('pump')}" stroke="#8a99ae" stroke-width="1"/>
    <rect x="645" y="226" width="16" height="30" rx="4" fill="#bfe6f6" fill-opacity=".55" stroke="#8fb4cc" stroke-width="1"/><rect x="645" y="240" width="16" height="16" rx="4" fill="#5fb4e0" opacity=".7"/>
    <rect x="648" y="208" width="10" height="9" rx="2" fill="#dfe8f3" stroke="#8a99ae" stroke-width=".8"/><path d="M650 211 H662" stroke="#8a99ae" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="673" y="227" width="32" height="27" rx="4" fill="#000" opacity=".4" filter="url(#${p}-b2)" transform="translate(2 3)"/>
    <rect x="672" y="224" width="32" height="27" rx="4" fill="#dfe8f3" stroke="#8a99ae" stroke-width="1"/><rect x="676" y="229" width="24" height="17" rx="2.5" fill="#3d83c8"/><rect x="682" y="226" width="12" height="4" rx="2" fill="#0b1523"/><path d="M684 226 q3 -6 6 0 z" fill="#8fc2f0"/>`;

  /* ---------- reading lamp over the bed head ---------- */
  const lamp = `
    <path d="M222 240 V224 C222 212 234 206 246 208" fill="none" stroke="#10161f" stroke-width="5" stroke-linecap="round"/>
    <path d="M222 240 V224 C222 212 234 206 246 208" fill="none" stroke="${u('metal')}" stroke-width="3" stroke-linecap="round"/>
    <rect x="216" y="238" width="12" height="10" rx="2" fill="${u('metalv')}"/>
    <path d="M230 207 Q248 198 264 206 L274 224 L226 224z" fill="${dawn ? '#9c8f86' : '#ffdca0'}"/>
    <path d="M230 207 Q248 198 264 206 L274 224 L226 224z" fill="url(#${p}-glare)" opacity="${dawn ? '.6' : '.9'}"/><path d="M236 212 Q248 206 258 211" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="254" cy="224.5" rx="16" ry="3.4" fill="${dawn ? '#6f655f' : '#fff4d4'}"/>
    ${dawn ? '' : `<ellipse cx="254" cy="226" rx="26" ry="8" fill="#ffd391" opacity=".55" filter="url(#${p}-b4)"/>`}`;

  /* ---------- the patient monitor (numbers are real text from the scenario data) ---------- */
  const ecg = 'M0 0 H16 Q19 -4 22 0 H26 L28 3 L31 -20 L34 8 L36 0 H46 Q51 -6 56 0 H78';
  const trace = (x0, y0, w, shape, col, cid) => {
    const n = Math.ceil(w / 78);
    const parts = Array.from({ length: n }, (_, i) => `<path d="${shape}" transform="translate(${x0 + i * 78} ${y0})"/>`).join('');
    return `<g clip-path="url(#${p}-${cid})" fill="none" stroke="${col}" stroke-linejoin="round" stroke-linecap="round">
      <g stroke-width="3.2" opacity=".35" filter="url(#${p}-b2)">${parts}</g><g stroke-width="1.5">${parts}</g></g>`;
  };
  const pleth = 'M0 0 C6 0 8 -11 14 -11 C20 -11 22 -3 26 -5 C30 -7 32 -2 36 0 H78';
  const monitorFace = d
    ? `
      <text x="258" y="80" font-size="8.5" font-weight="700" fill="var(--il-muted)">BED 12</text>
      <text x="402" y="80" font-size="8.5" text-anchor="end" fill="var(--il-muted)">${esc(d.lastTime)}</text>
      <path d="M252 84 H408 M252 118 H408 M252 144 H408 M350 84 V144 M350 144 V172" stroke="#1d3350" stroke-width="1"/>
      <text x="256" y="95" font-size="9" font-weight="700" fill="var(--il-hr)">ECG II</text>
      ${trace(256, 108, 94, ecg, 'var(--il-hr)', 'tr1')}
      <circle class="blink" cx="342" cy="91" r="2.4" fill="var(--il-hr)"/>
      <text x="355" y="95" font-size="9" font-weight="700" fill="var(--il-hr)">HR</text><text x="383" y="95" font-size="7.5" fill="var(--il-muted)">/min</text>
      <text x="355" y="115" font-size="25" font-weight="700" fill="var(--il-hr)">${esc(d.last.hr)}</text>
      <text x="256" y="128" font-size="9" font-weight="700" fill="var(--il-ok)">PLETH</text>
      ${trace(256, 139, 94, pleth, 'var(--il-ok)', 'tr2')}
      <text x="355" y="128" font-size="9" font-weight="700" fill="var(--il-ok)">SpO2</text>
      <text x="355" y="141" font-size="14" font-weight="700" fill="var(--il-ok)">${esc(d.last.spo2)}</text>
      <text x="256" y="154" font-size="9" font-weight="700" fill="var(--il-bp)">NIBP</text><text x="296" y="154" font-size="7.5" fill="var(--il-muted)">mmHg</text>
      <text x="256" y="171" font-size="19" font-weight="700" fill="var(--il-bp)">${esc(d.last.bp)}</text>
      <text x="355" y="154" font-size="9" font-weight="700" fill="var(--il-text)">RESP</text><text x="383" y="154" font-size="7.5" fill="var(--il-muted)">/min</text>
      <text x="355" y="170" font-size="16" font-weight="700" fill="var(--il-text)">${esc(d.last.rr)}</text>`
    : `
      <text x="258" y="80" font-size="8.5" font-weight="700" fill="var(--il-muted)">BED 12</text>
      <path d="M252 84 H408 M252 126 H408 M252 168 H408" stroke="#1d3350" stroke-width="1"/>
      <text x="256" y="95" font-size="9" font-weight="700" fill="var(--il-hr)">ECG II</text>
      ${trace(256, 112, 148, ecg, 'var(--il-hr)', 'tr3')}
      <text x="256" y="137" font-size="9" font-weight="700" fill="var(--il-ok)">PLETH</text>
      ${trace(256, 160, 148, pleth, 'var(--il-ok)', 'tr4')}
      <circle class="blink" cx="396" cy="92" r="2.6" fill="var(--il-hr)"/>`;
  const monitor = `
    <path d="M318 188 H342 V214 H318z" fill="${u('metal')}"/><rect x="302" y="212" width="56" height="9" rx="3" fill="${u('metalv')}"/>
    <rect x="306" y="219" width="48" height="5" rx="2" fill="#000" opacity=".35"/>
    <circle cx="330" cy="200" r="6" fill="#8394ab" stroke="#4a5a72" stroke-width="1.2"/>
    <rect x="238" y="56" width="184" height="132" rx="12" fill="#000" opacity=".5" filter="url(#${p}-b4)" transform="translate(3 6)"/>
    <rect x="238" y="56" width="184" height="132" rx="12" fill="${u('bezel')}"/>
    <rect x="239.5" y="57.5" width="181" height="129" rx="11" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.2"/>
    <rect x="246" y="64" width="168" height="114" rx="7" fill="#05090f"/>
    <rect x="252" y="70" width="156" height="102" rx="4" fill="${u('screen')}"/>
    <g clip-path="url(#${p}-scr)">
      <rect x="252" y="84" width="98" height="60" fill="${u('grid')}" opacity=".7"/>
      ${monitorFace}
      <path d="M252 70 L330 70 L270 172 L252 172z" fill="#fff" opacity=".05"/>
    </g>
    <rect x="252" y="70" width="156" height="102" rx="4" fill="url(#${p}-glare)" opacity=".5"/>
    <circle cx="256" cy="181" r="1.7" fill="#7ee2a0"/><rect x="340" y="178" width="16" height="5" rx="2.5" fill="#53627a"/><rect x="362" y="178" width="16" height="5" rx="2.5" fill="#53627a"/><rect x="384" y="178" width="16" height="5" rx="2.5" fill="#53627a"/>
    <path d="M290 188 C292 244 318 270 308 322" fill="none" stroke="#080c14" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M290 188 C292 244 318 270 308 322" fill="none" stroke="#4a5a72" stroke-width=".7" stroke-linecap="round" opacity=".7"/>
    <path d="M300 188 C306 244 326 280 316 326 M282 188 C284 240 306 286 300 328" fill="none" stroke="#10161f" stroke-width="1.2" stroke-linecap="round"/>
`;

  /* ---------- bed: shadow, headboard, frame, rails ---------- */
  const bedBack = `
    <g><ellipse cx="296" cy="468" rx="22" ry="3" fill="#000" opacity=".45" filter="url(#${p}-b2)"/><path d="M276 466 q2 -8 12 -8 q10 0 12 8 q0 4 -12 4 q-12 0 -12 -4z" fill="#3f6f8f"/><path d="M282 462 q6 -4 12 0" stroke="#9fc2ea" stroke-opacity=".5" stroke-width="1.4" fill="none"/><path d="M302 470 q2 -8 12 -8 q10 0 12 8 q0 4 -12 4 q-12 0 -12 -4z" fill="#3f6f8f"/><path d="M308 466 q6 -4 12 0" stroke="#9fc2ea" stroke-opacity=".5" stroke-width="1.4" fill="none"/></g>
    <ellipse cx="430" cy="446" rx="296" ry="13" fill="#000" opacity=".6" filter="url(#${p}-b4)"/>
    <rect x="214" y="408" width="436" height="30" fill="#02050a" opacity=".55" filter="url(#${p}-b4)"/>
    <rect x="176" y="236" width="26" height="176" rx="8" fill="${u('wood')}"/>
    <rect x="172" y="230" width="34" height="14" rx="6" fill="${u('woodv')}"/>
    <rect x="182" y="252" width="14" height="144" rx="4" fill="#000" opacity=".22"/><rect x="183" y="253" width="2" height="142" fill="#fff" opacity=".12"/>
    <rect x="664" y="330" width="18" height="82" rx="6" fill="${u('wood')}"/><rect x="662" y="326" width="22" height="9" rx="4" fill="${u('woodv')}"/>
    <rect x="669" y="344" width="8" height="58" rx="3" fill="#000" opacity=".2"/>
    <use href="#${p}-caster" x="219" y="410"/><use href="#${p}-caster" x="645" y="410"/>
    <rect x="196" y="392" width="470" height="16" rx="4" fill="${u('metalv')}"/><rect x="196" y="404" width="470" height="4" fill="#000" opacity=".4"/>
    <rect x="396" y="408" width="78" height="20" rx="3" fill="#2a3446"/><rect x="396" y="408" width="78" height="4" fill="#fff" opacity=".12"/><path d="M474 418 C500 420 520 426 540 440" fill="none" stroke="#10161f" stroke-width="2"/>
    <!-- far rail, raised at the head end -->
    <g opacity=".9">
      <rect x="212" y="282" width="190" height="7" rx="3" fill="${u('metalv')}"/><rect x="212" y="336" width="190" height="7" rx="3" fill="${u('metalv')}"/>
      ${[212, 246, 280, 314, 348, 396].map((x) => `<rect x="${x}" y="282" width="6" height="61" rx="2.5" fill="${u('metal')}"/>`).join('')}
      <rect x="388" y="276" width="24" height="12" rx="4" fill="#3a475e"/><rect x="392" y="279" width="16" height="3" rx="1.5" fill="#9fb4cc"/>
    </g>
    <rect x="200" y="342" width="462" height="50" rx="11" fill="${u('mat')}"/>
    <rect x="203" y="344" width="456" height="5" rx="2.5" fill="#fff" opacity=".5"/>
    <rect x="200" y="380" width="462" height="12" rx="6" fill="#000" opacity=".18"/>
    <path d="M214 384 H648" stroke="#fff" stroke-opacity=".25" stroke-width="1" stroke-dasharray="4 4"/>
    <path d="M204 346 H658 V367 C640 374 622 366 600 371 C578 376 560 368 536 373 C508 379 490 369 462 374 C432 380 414 370 386 374 C358 378 340 370 314 373 C288 376 270 368 250 372 C232 375 216 368 204 369z" fill="${u('linen')}"/>
    <path d="M204 368 C216 367 232 374 250 371 C270 367 288 375 314 372 C340 369 358 377 386 373 C414 369 432 379 462 373 C490 368 508 378 536 372 C560 367 578 375 600 370 C622 365 640 373 658 366" fill="none" stroke="#6f7f9a" stroke-opacity=".55" stroke-width="1.6"/>
    <path d="M240 354 C260 362 270 358 290 360 M420 356 C440 362 470 360 490 358 M560 356 C580 360 610 360 630 356" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <path d="M232 360 C244 366 256 366 270 362 M452 362 C470 368 486 366 500 362 M592 361 C606 366 620 366 632 361" fill="none" stroke="#7384a0" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;

  /* ---------- the patient ---------- */
  const faceMood = dawn ? 'rest' : 'pain';
  const patient = `
    <!-- pillow and head -->
    <path d="M192 346 C190 326 214 314 248 314 C284 314 308 326 306 346 C302 354 280 356 248 356 C216 356 196 354 192 346z" fill="#000" opacity=".28" filter="url(#${p}-b4)" transform="translate(0 4)"/>
    <path d="M194 342 C192 324 214 314 248 314 C284 314 306 324 304 342 C302 351 280 353 248 353 C216 353 196 351 194 342z" fill="${u('pillow')}"/>
    <path d="M206 322 C226 314 262 312 292 322 M200 336 C214 342 236 344 250 344" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
    <path d="M204 346 C220 350 246 350 270 347 M290 332 C298 336 300 340 298 346" fill="none" stroke="#8d9db8" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
    <path d="M262 318 L292 320 L296 346 L262 348z" fill="#6e4630"/>
    <g transform="translate(250 313) rotate(-6) scale(.92)">${head({ p, skin: 'patient', hair: 'short', mood: faceMood, gray: true, stubble: true, sweat: !dawn })}</g>
    <path d="M200 340 C214 330 234 338 252 341 C268 343 280 340 294 336 L304 348 C292 354 270 356 248 356 C224 356 206 354 196 348z" fill="${u('pillow')}" opacity=".92"/>
    <path d="M204 344 C224 348 250 348 276 344" fill="none" stroke="#8d9db8" stroke-opacity=".7" stroke-width="1.6"/>
    <!-- body under the gown, abdomen and sheet -->
    <g clip-path="url(#${p}-mound)">
      <path d="M276 349 C277 322 292 306 320 302 L382 300 C396 292 420 284 452 283 C486 283 510 294 530 306 L574 313 C604 313 630 312 646 322 L656 349 Z" fill="${u('linen')}"/>
      <rect x="276" y="286" width="124" height="66" fill="url(#${p}-print)"/>
      <path d="M276 286 H400 V352 H276z" fill="#1b2a44" opacity=".2"/>
      <path d="M284 318 C300 312 312 308 332 308 M300 340 C330 328 350 322 396 320 M318 304 C340 310 366 312 398 308" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
      <path d="M296 334 C322 322 350 318 398 318 M340 346 C360 336 380 330 400 332" fill="none" stroke="#4a6a92" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M394 284 C390 308 392 332 398 352 L412 352 C408 326 406 306 410 284z" fill="#8fb0d4"/><path d="M394 284 C390 308 392 332 398 352" fill="none" stroke="#3a5a86" stroke-width="2.4"/>
      <path d="M284 312 C292 308 300 308 306 312 M290 306 c4 -6 8 -6 14 -4" fill="none" stroke="#3a5a86" stroke-width="1.6"/>
      <!-- exposed abdomen, rounded and firm -->
      <path d="M404 352 C404 316 414 288 440 283 C470 281 490 296 500 314 L506 352 Z" fill="url(#${p}-sk-patient)"/>
      <path d="M404 352 C404 316 414 288 440 283 C470 281 490 296 500 314" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="5"/>
      <ellipse cx="450" cy="291" rx="34" ry="8" fill="#fff" opacity=".16"/>
      <path d="M404 352 H506 V334 C480 346 430 346 404 334z" fill="#000" opacity=".2"/>
      <circle cx="476" cy="318" r="1.8" fill="#4a2a1c" opacity=".7"/>
      <!-- dressing -->
      <rect x="416" y="292" width="62" height="30" rx="5" fill="#e9ddc5" transform="rotate(-3 446 307)"/>
      <rect x="421" y="296" width="52" height="21" rx="3" fill="#f8fafc" transform="rotate(-3 446 307)"/>
      <path d="M426 302 H466 M426 308 H460 M426 313 H464" stroke="#c4cfdd" stroke-width="1.4" transform="rotate(-3 446 307)"/>
      <rect x="416" y="292" width="62" height="30" rx="5" fill="none" stroke="#a89a7c" stroke-opacity=".6" transform="rotate(-3 446 307)"/>
      <rect x="424" y="311" width="14" height="11" rx="3" fill="#e9ddc5" stroke="#a89a7c" stroke-opacity=".6" stroke-width=".8"/>
      <!-- folded sheet cuff and blanket over the legs -->
      <path d="M498 272 L542 272 L548 352 L494 352z" fill="${u('linen')}"/>
      <path d="M498 274 C506 296 512 330 508 352 M520 276 C526 300 528 330 526 352" fill="none" stroke="#6f7f9a" stroke-opacity=".5" stroke-width="2"/>
      <path d="M496 278 C508 282 530 282 546 276" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="536" y="278" width="130" height="78" fill="${u('blanket')}"/>
      <path d="M536 288 C560 292 600 292 640 288 L666 292 V278 H536z" fill="#fff" opacity=".35"/>
      <path d="M538 292 C562 298 604 296 650 292" fill="none" stroke="#e9f2f9" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>
      <path d="M560 302 C566 324 562 342 568 352 M596 300 C604 324 598 340 606 352 M628 300 C634 322 630 340 636 352 M580 328 C600 322 616 326 640 322" fill="none" stroke="#18425c" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M564 310 C570 326 566 342 572 352 M600 308 C608 326 602 340 610 352" fill="none" stroke="#9fd0ea" stroke-opacity=".3" stroke-width="2"/>
      <path d="M536 296 H666 M536 300 H666" stroke="#fff" stroke-opacity=".12" stroke-width="1"/>
      <path d="M276 300 C330 294 380 298 420 284 C470 276 510 288 546 302 C600 304 640 304 666 314" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>
      <path d="M276 349 L656 349" stroke="#000" stroke-opacity=".28" stroke-width="6"/>
      <ellipse cx="500" cy="318" rx="10" ry="30" fill="#000" opacity=".35" filter="url(#${p}-b4)"/>
      <ellipse cx="338" cy="352" rx="40" ry="8" fill="#000" opacity=".4" filter="url(#${p}-b4)"/>
      <path d="M560 340 C580 332 610 334 640 340 M300 330 C320 326 340 326 360 330" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="5" stroke-linecap="round" filter="url(#${p}-b2)"/>
    </g>
    <path d="M276 349 C277 322 292 306 320 302 L382 300 C396 292 420 284 452 283 C486 283 510 294 530 306 L574 313 C604 313 630 312 646 322 L656 349" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1.2"/>
    <!-- arm: sleeve, forearm, wristband, hand, IV site, pulse oximeter -->
    <path d="M282 330 C298 322 316 332 324 346 L322 358 C306 361 290 356 282 348z" fill="url(#${p}-print)"/>
    <path d="M282 330 C298 322 316 332 324 346 L322 358 C306 361 290 356 282 348z" fill="#18284a" opacity=".22"/>
    <path d="M286 336 C298 332 310 336 318 348" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M320 345 C334 340 350 340 360 344 L362 355 C348 359 332 359 320 357z" fill="url(#${p}-sl-patient)"/>
    <path d="M324 346 C336 343 348 343 358 346" fill="none" stroke="#e1b08a" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <path d="M328 351 C336 349 344 350 352 352" fill="none" stroke="#6a8aa8" stroke-opacity=".5" stroke-width="1.2"/>
    <rect x="352" y="343" width="8" height="14" rx="2.5" fill="#f4f7fb" stroke="#9aa9bd" stroke-width=".8"/><path d="M354 346 h4 M354 349 h4" stroke="#6a85a6" stroke-width="1"/>
    <path d="M358 344 C366 340 378 342 384 348 C386 352 380 358 370 358 L360 357z" fill="url(#${p}-sk-patient)"/>
    <path d="M368 356 q8 3 14 -1 M372 352 q8 1 12 -2" fill="none" stroke="#6e4630" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M360 341 C364 337 372 337 376 340" fill="none" stroke="#e1b08a" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>
    <rect x="370" y="344" width="13" height="11" rx="3.5" fill="#cfd8e4" stroke="#5a6a82" stroke-width="1"/><circle cx="376" cy="349" r="1.8" fill="#ff5a4d"/>
    <path d="M382 348 C394 340 398 300 392 262 C388 232 372 204 358 190" fill="none" stroke="#10161f" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="327" y="341" width="17" height="15" rx="3" fill="#e8f1f8" fill-opacity=".7" stroke="#9fb4cc" stroke-width="1"/>
    <rect x="326" y="346" width="19" height="4" rx="1" fill="#fff" opacity=".9" transform="rotate(-10 335 348)"/><rect x="327" y="352" width="17" height="3.6" rx="1" fill="#fff" opacity=".9" transform="rotate(8 335 354)"/>
    <rect x="339" y="343" width="9" height="6" rx="2" fill="#3d9bd6" stroke="#1f5f8f" stroke-width=".8" transform="rotate(-14 343 346)"/>
    <path d="M340 345 C340 338 338 330 336 322 C334 306 338 280 322 250 C310 230 270 238 214 262" fill="none" stroke="#bfe6f6" stroke-opacity="0" stroke-width="2"/>`;

  /* ---------- tubing, drain bulb, PCA handset, urine bag ---------- */
  const ivLine = 'M162 266 C204 238 292 232 312 292 C322 320 334 332 340 344';
  const drain = `
    <path d="M474 326 C470 342 462 350 432 342 C420 338 414 330 412 322" fill="none" stroke="#000" stroke-opacity="0" stroke-width="3"/>
    <path d="M424 322 C420 330 416 336 412 342 C408 346 408 346 410 350" fill="none" stroke="#e8c4c6" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M424 322 C420 330 416 336 412 342" fill="none" stroke="#a52a31" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
    <circle cx="424" cy="322" r="4.6" fill="#f2e8d8" stroke="#a89a7c" stroke-width="1"/>
    <ellipse cx="412" cy="372" rx="13" ry="4" fill="#000" opacity=".3" filter="url(#${p}-b2)"/>
    <rect x="404" y="337" width="14" height="9" rx="3" fill="#dfe8f3" stroke="#6a7c94" stroke-width="1"/>
    <path d="M410 340 C396 340 394 366 398 372 C402 380 422 380 426 372 C430 366 428 340 414 340z" fill="${u('plastic')}" stroke="#9fb4cc" stroke-width="1.6"/>
    <path d="M398 358 C404 363 420 363 426 358 C428 368 426 376 420 378 C412 380 404 380 399 374 C396 370 396 364 398 358z" fill="${dawn ? u('straw') : u('blood')}"/>
    <path d="M399 354 q13 6 27 0 M399 346 q13 6 27 0" fill="none" stroke="#6a7c94" stroke-width="1" opacity=".55"/>
    <path d="M400 346 C398 356 400 368 404 374" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M404 340 L396 336 L400 346z" fill="#e7a43a" stroke="#8a5a14" stroke-width=".8"/>`;
  const pca = `
    <path d="M160 366 C220 416 332 410 366 370" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="3.4" stroke-linecap="round" transform="translate(1 3)" filter="url(#${p}-b2)"/>
    <path d="M160 366 C220 416 332 410 366 370" fill="none" stroke="#10161f" stroke-width="3" stroke-linecap="round"/>
    <path d="M160 366 C220 414 332 408 366 368" fill="none" stroke="#5a6a82" stroke-width=".7" stroke-linecap="round" opacity=".7"/>
    <rect x="360" y="362" width="26" height="13" rx="6" fill="#2b3749" stroke="#10161f" stroke-width="1"/>
    <rect x="362" y="363" width="22" height="4" rx="2" fill="#fff" opacity=".18"/>
    <circle cx="376" cy="369" r="4" fill="#ffc857" stroke="#7a5a00" stroke-width="1"/><circle cx="374.8" cy="367.8" r="1.3" fill="#fff6c9"/>`;
  const urine = `
    <path d="M572 412 C566 394 540 388 522 380 C508 374 504 362 508 348" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="3.6" stroke-linecap="round" transform="translate(1 3)" filter="url(#${p}-b2)"/>
    <path d="M572 412 C566 394 540 388 522 380 C508 374 504 362 508 348" fill="none" stroke="#e8dc92" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M572 412 C566 394 540 388 522 380 C508 374 504 362 508 348" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".9" stroke-linecap="round"/>
    <ellipse cx="588" cy="458" rx="38" ry="5" fill="#000" opacity=".4" filter="url(#${p}-b2)"/>
    <path d="M578 410 V396 Q578 390 584 390 H594 Q600 390 600 396 V410" fill="none" stroke="#c9d4e3" stroke-width="4"/>
    <path d="M566 410 h44 q8 0 8 8 v20 q0 12 -12 12 h-36 q-12 0 -12 -12 v-20 q0 -8 8 -8z" fill="#dff0f8" fill-opacity=".35" stroke="#9fb4cc" stroke-width="1.8"/>
    <rect x="556" y="440" width="64" height="20" fill="${u('urine')}" clip-path="url(#${p}-ubag)"/>
    <path d="M556 440 Q588 436 620 440" fill="none" stroke="#fff6b0" stroke-opacity=".6" stroke-width="1.4" clip-path="url(#${p}-ubag)"/>
    <path d="M566 424 h10 M566 432 h7 M566 440 h10 M566 448 h7" stroke="#2a3342" stroke-width="1.4" opacity=".65"/>
    <rect x="566" y="410" width="44" height="46" rx="8" fill="${u('plastic')}"/>
    <path d="M568 416 C566 430 566 444 570 452" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="584" y="454" width="8" height="7" rx="1.5" fill="#3d9bd6" stroke="#1f5f8f" stroke-width=".8"/>`;

  /* ---------- foot-end near rail ---------- */
  const nearRail = `
    <rect x="546" y="326" width="106" height="7" rx="3" fill="${u('metalv')}"/><rect x="546" y="368" width="106" height="7" rx="3" fill="${u('metalv')}"/>
    ${[546, 580, 614, 646].map((x) => `<rect x="${x}" y="326" width="6" height="49" rx="2.5" fill="${u('metal')}"/>`).join('')}
    <rect x="556" y="337" width="30" height="16" rx="3" fill="#2b3749" stroke="#10161f" stroke-width="1"/>
    <path d="M565 345 l4 -4 l4 4 M575 341 l4 4 l4 -4" fill="none" stroke="#9fc2ea" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="583" cy="349" r="1.4" fill="#7ee2a0"/>
    <rect x="576" y="326" width="16" height="22" rx="6" fill="#eef2f8" stroke="#8a99ae" stroke-width="1" opacity="0"/>`;

  /* ---------- over-bed table, chart on a clipboard, water cup ---------- */
  const table = `
    <ellipse cx="730" cy="446" rx="62" ry="7" fill="#000" opacity=".5" filter="url(#${p}-b4)"/>
    <rect x="757" y="357" width="9" height="76" fill="${u('metal')}"/>
    <rect x="722" y="430" width="78" height="9" rx="4" fill="${u('metalv')}"/>
    <use href="#${p}-wheel" x="732" y="446"/><use href="#${p}-wheel" x="790" y="446"/>
    <rect x="640" y="349" width="154" height="9" rx="3" fill="#000" opacity=".4" filter="url(#${p}-b2)" transform="translate(2 5)"/>
    <rect x="640" y="346" width="154" height="12" rx="4" fill="url(#${p}-woodv)"/>
    <rect x="642" y="347" width="150" height="2.4" rx="1.2" fill="#fff" opacity=".4"/>
    <rect x="640" y="355" width="154" height="3.4" rx="1.7" fill="#000" opacity=".3"/>
    <g transform="rotate(-5 730 346)">
      <rect x="699" y="287" width="62" height="62" rx="5" fill="#5a4030"/><rect x="699" y="287" width="62" height="3" rx="1.5" fill="#fff" opacity=".2"/>
      <rect x="704" y="295" width="52" height="50" rx="2" fill="#f6f8fb"/>
      <rect x="704" y="295" width="52" height="50" rx="2" fill="url(#${p}-glare)" opacity=".5"/>
      <polyline points="708,311 716,311 719,303 723,317 727,307 731,311 750,311" fill="none" stroke="#e08a2a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M708 322 H750 M708 328 H744 M708 334 H748 M708 340 H740" stroke="#9aa9bd" stroke-width="1.5"/>
      <rect x="720" y="282" width="22" height="11" rx="2.5" fill="${u('metal')}" stroke="#56667e" stroke-width=".8"/>
      <path d="M752 346 L756 300" stroke="#2a4a8a" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <path d="M676 346 L679 322 H692 L695 346z" fill="#dff0f8" fill-opacity=".38" stroke="#bcd0e2" stroke-width="1.4"/>
    <path d="M677.5 336 H693.5 L694.6 346 H676.4z" fill="#a8d6ee" fill-opacity=".6"/>
    <ellipse cx="685.5" cy="322" rx="6.5" ry="1.8" fill="#eef7fc" stroke="#bcd0e2" stroke-width="1"/>
    <path d="M688 322 L694 306" stroke="#ffc857" stroke-width="2" stroke-linecap="round"/><path d="M679 324 V344" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>`;

  /* ---------- IV pole, bag, drip chamber, infusion pump, PCA pump ---------- */
  const ivBagFluidTop = 138;
  const ivPole = `
    <ellipse cx="128" cy="452" rx="52" ry="7" fill="#000" opacity=".5" filter="url(#${p}-b4)"/>
    <rect x="125" y="92" width="6" height="346" rx="2.5" fill="${u('metal')}"/>
    <rect x="98" y="88" width="60" height="7" rx="3.5" fill="${u('metalv')}"/>
    <circle cx="98" cy="91.5" r="4" fill="${u('metal')}"/><circle cx="158" cy="91.5" r="4" fill="${u('metal')}"/>
    <path d="M100 95 q0 7 -6 7 M156 95 q0 7 6 7" fill="none" stroke="#c9d4e3" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M128 436 L94 450 M128 436 L162 450 M128 436 V452" stroke="#10161f" stroke-width="6" stroke-linecap="round"/>
    <path d="M128 436 L94 450 M128 436 L162 450 M128 436 V452" stroke="#aebdd2" stroke-width="3.4" stroke-linecap="round"/>
    <circle cx="94" cy="454" r="5" fill="#10161f"/><circle cx="162" cy="454" r="5" fill="#10161f"/><circle cx="128" cy="456" r="5" fill="#10161f"/>
    <circle cx="94" cy="454" r="1.8" fill="#9aabc2"/><circle cx="162" cy="454" r="1.8" fill="#9aabc2"/><circle cx="128" cy="456" r="1.8" fill="#9aabc2"/>
    <path d="M110 104 h36 q6 0 6 6 v44 q0 20 -24 20 q-24 0 -24 -20 v-44 q0 -6 6 -6z" fill="#dff0f8" fill-opacity=".25"/>
    <rect x="100" y="${ivBagFluidTop}" width="56" height="60" fill="${u('fluid')}" clip-path="url(#${p}-ivbag)"/>
    <path d="M102 ${ivBagFluidTop} Q128 ${ivBagFluidTop - 3} 154 ${ivBagFluidTop}" fill="none" stroke="#f3fbff" stroke-width="1.6" clip-path="url(#${p}-ivbag)"/>
    <rect x="114" y="112" width="28" height="15" rx="1.5" fill="#fff" opacity=".88"/><path d="M118 116 h20 M118 120 h14 M118 124 h18" stroke="#6a85a6" stroke-width="1"/><rect x="114" y="112" width="6" height="15" fill="#3d9bd6" opacity=".8"/>
    <path d="M104 150 h10 M104 160 h7 M104 170 h10" stroke="#6a85a6" stroke-width="1" opacity=".7" clip-path="url(#${p}-ivbag)"/>
    <path d="M110 104 h36 q6 0 6 6 v44 q0 20 -24 20 q-24 0 -24 -20 v-44 q0 -6 6 -6z" fill="${u('plastic')}" stroke="#bcd0e2" stroke-width="1.6"/>
    <path d="M112 110 C108 130 108 150 112 168" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="128" cy="109" r="3.4" fill="#10161f"/><path d="M128 109 V96" stroke="#e8eef6" stroke-width="1.6"/>
    <rect x="124" y="174" width="8" height="9" rx="1.5" fill="#dfe8f3" stroke="#6a7c94" stroke-width=".8"/>
    <path d="M128 183 V186" stroke="#bfe6f6" stroke-width="2"/>
    <rect x="120" y="186" width="16" height="4" rx="1.5" fill="#dfe8f3" stroke="#6a7c94" stroke-width=".8"/>
    <path d="M122 190 h12 v14 q0 4 -4 4 h-4 q-4 0 -4 -4z" fill="#dff0f8" fill-opacity=".3" stroke="#bcd0e2" stroke-width="1.3"/>
    <path d="M123 200 h10 v4 q0 3 -3 3 h-4 q-3 0 -3 -3z" fill="#8fd0ee" opacity=".8"/><circle cx="128" cy="194" r="1.6" fill="#bfe6f6"/>
    <rect x="120" y="207" width="16" height="4" rx="1.5" fill="#dfe8f3" stroke="#6a7c94" stroke-width=".8"/>
    <path d="M128 211 V240" stroke="#bfe6f6" stroke-width="2.2"/><path d="M128 211 V240" stroke="#fff" stroke-opacity=".5" stroke-width=".7"/>
    <rect x="122" y="222" width="12" height="9" rx="2" fill="#3d9bd6" stroke="#1f5f8f" stroke-width=".8"/>
    <rect x="94" y="243" width="68" height="55" rx="8" fill="#000" opacity=".4" filter="url(#${p}-b2)" transform="translate(2 4)"/>
    <rect x="94" y="240" width="68" height="55" rx="8" fill="${u('pump')}" stroke="#7d90ab" stroke-width="1.4"/>
    <rect x="94" y="241" width="68" height="4" rx="2" fill="#fff" opacity=".7"/>
    <rect x="101" y="248" width="54" height="24" rx="3.5" fill="#06101b" stroke="#2b3a52" stroke-width="1.2"/>
    <rect x="101" y="248" width="54" height="24" rx="3.5" fill="url(#${p}-glare)" opacity=".8"/>
    <text x="108" y="264" font-size="12" font-weight="700" fill="#7ee2a0">RUN</text>
    <path d="M141 253 q-4 6 -4 9 a4 4 0 0 0 8 0 q0 -3 -4 -9z" fill="#8fd0ee"/>
    <rect x="101" y="276" width="14" height="9" rx="2.5" fill="#9fb0c8" stroke="#6b7d98" stroke-width=".8"/><rect x="119" y="276" width="14" height="9" rx="2.5" fill="#9fb0c8" stroke="#6b7d98" stroke-width=".8"/><rect x="137" y="276" width="14" height="9" rx="2.5" fill="#9fb0c8" stroke="#6b7d98" stroke-width=".8"/>
    <circle cx="154" cy="288" r="2.2" fill="#2fd07a"/>
    <path d="M162 266 L166 266" stroke="#bfe6f6" stroke-width="2.2"/>
    <path d="${ivLine}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3.4" stroke-linecap="round" transform="translate(1 3)" filter="url(#${p}-b2)"/>
    <path d="${ivLine}" fill="none" stroke="#bfe6f6" stroke-width="2.6" stroke-linecap="round"/>
    <path d="${ivLine}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".8" stroke-linecap="round" transform="translate(0 -.8)"/>
    <rect x="94" y="334" width="68" height="54" rx="8" fill="#000" opacity=".4" filter="url(#${p}-b2)" transform="translate(2 4)"/>
    <rect x="94" y="331" width="68" height="54" rx="8" fill="url(#${p}-pca)" stroke="#1b2636" stroke-width="1.4"/>
    <rect x="94" y="332" width="68" height="4" rx="2" fill="#fff" opacity=".22"/>
    <rect x="101" y="339" width="54" height="18" rx="3" fill="#06101b" stroke="#1b2636" stroke-width="1"/>
    <rect x="101" y="339" width="54" height="18" rx="3" fill="url(#${p}-glare)" opacity=".8"/>
    <text x="106" y="352" font-size="10" font-weight="700" fill="#7ee2a0">PCA</text><rect x="136" y="344" width="9" height="7" rx="1.5" fill="none" stroke="#7ee2a0" stroke-width="1.3"/><path d="M138 344 v-2.5 a2.5 2.5 0 0 1 5 0 v2.5" fill="none" stroke="#7ee2a0" stroke-width="1.2"/>
    <rect x="101" y="360" width="54" height="11" rx="3" fill="#d6e2ee" fill-opacity=".85" stroke="#8aa0ba" stroke-width="1"/><rect x="104" y="363" width="36" height="5" rx="2" fill="#f7fbfe"/><rect x="140" y="362" width="9" height="7" rx="1.5" fill="#6a7c94"/>
    <path d="M110 364 h22 M110 367 h18" stroke="#9fb4cc" stroke-width=".8"/>
    <rect x="101" y="374" width="12" height="7" rx="2" fill="#7d90ab"/><rect x="117" y="374" width="12" height="7" rx="2" fill="#7d90ab"/>
    <circle cx="148" cy="378" r="2.4" fill="#2fd07a"/>
    <rect x="160" y="362" width="5" height="9" rx="1.5" fill="#10161f"/>`;

  /* ---------- light: lamp cone, monitor glow, sunrise beams, vignette ---------- */
  const night = dawn ? '' : `
    <path d="M232 222 L276 222 L392 400 L130 400z" fill="${u('lampcone')}" opacity=".7" filter="url(#${p}-b4)"/>
    <circle cx="254" cy="232" r="250" fill="${u('lamp')}"/>
    <circle cx="330" cy="124" r="190" fill="${u('mon')}"/>
    <ellipse cx="330" cy="330" rx="130" ry="60" fill="#78b4ff" opacity=".07" filter="url(#${p}-b9)"/>`;
  const sunrise = !dawn ? '' : `
    <circle cx="676" cy="116" r="260" fill="${u('sun')}" opacity=".7"/>
    <g filter="url(#${p}-b4)"><path d="M600 86 L750 86 L520 330 L330 330z" fill="${u('beam')}"/>
    <path d="M600 112 L750 112 L610 330 L470 330z" fill="${u('beam')}" opacity=".7"/>
    <path d="M590 140 L740 140 L760 330 L640 330z" fill="${u('beam')}" opacity=".5"/></g>
    <path d="M330 372 L470 372 L560 500 L380 500z" fill="#ffd9a0" opacity=".14" filter="url(#${p}-b4)"/>
    <path d="M520 360 L640 372 L700 400 L560 396z" fill="#ffd9a0" opacity=".22" filter="url(#${p}-b4)"/>`;

  /* ---------- hotspot leader lines (only on the assess step) ---------- */
  const leaders = hotspots.filter((h) => h.tx != null).map((h) => {
    const [x1, y1, x2, y2] = [h.x * 8, h.y * 5, h.tx * 8, h.ty * 5];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#08101f" stroke-opacity=".75" stroke-width="4" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffc857" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${x2}" cy="${y2}" r="6" fill="#ffc857" stroke="#08101f" stroke-width="2.5"/>`;
  }).join('');

  return `
  <svg viewBox="0 0 800 500" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    ${defs}
    ${shell}
    ${windowSvg}
    ${headwall}
    ${lamp}
    ${monitor}
    ${bedBack}
    ${patient}
    ${drain}
    ${pca}
    ${urine}
    ${nearRail}
    ${table}
    ${curtain}
    ${ivPole}
    ${night}${sunrise}
    <rect width="800" height="500" fill="${u('vig')}"/>
    <g class="leaders">${leaders}</g>
  </svg>`;
}
