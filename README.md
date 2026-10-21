# The 2 a.m. Call

An accessible, competency-based SBAR handoff simulation. A learner examines a fictional post-operative patient at the bedside, builds a call to the on-call provider, gets feedback on four criteria, and retries until all four are met.

> Personal portfolio demo. Fictional patient. Clinical content requires review by a nursing subject matter expert.

All clinical values are placeholders. Plain HTML, CSS and vanilla JS (ES modules). No build step, no CDNs, no audio. The one runtime library is a vendored copy of Three.js, used only by the optional 3D view.

## Flow

Intro, Assess the patient, Build the call, Feedback, Mastery. On the assess step the learner selects objects in a bedside scene (monitor, drain, urine bag, pumps, dressing, chart and more), in 3D or 2D. Each finding they open is added to "Your assessment notes", which come back on the build step.

## 3D and 2D views, and motion

The assess step opens in a 3D bedside room when the browser supports WebGL, and in 2D otherwise. Under the scene:

- **3D view** (toggle button): switches between the 3D room and the 2D illustration. The choice is remembered in this browser.
- **Pause animation / Play animation**: stops or starts the idle animation (breathing, monitor trace, curtain).
- **Back to bedside view**, **Look left**, **Look right**: move the camera. Selecting an object also moves the camera to it.
- **Reduce motion** (top of the page): turns off transitions and animations and makes camera moves instant. It starts on if your system asks for reduced motion.

The 3D canvas is decorative; every finding is still text on the page. See `DESIGN_NOTES.md`.

## Immersive version (beta), scene 1

`scene1.html` is a full-window, first-person 3D version of the bedside assessment (scene 1 only). Open it from the link on the intro of the standard version ("Try the immersive version (beta)"), or go to `http://localhost:4318/scene1.html` after `npm start`. Choose a movement style on the start screen (jump between spots, or smooth walking), then look around by dragging or with the Turn and Look buttons, move with the Go to buttons or the arrow keys or W A S D while the 3D view has focus (Q and E turn), and select objects in the room or in "Objects nearby" to examine them. "I'm ready to call the provider" ends the scene and offers "Continue in the standard version", which opens the Build step with your notes (passed through `sessionStorage`). Files: `scene1.js` (page and input), `world1.js` (3D world, camera, collision), `room1.js` (room, hallway and procedural textures), `scene1.css`. See `DESIGN_NOTES.md`, "Immersive scene 1".

## Three.js (vendored)

`vendor/three/` holds Three.js **r169** (`three@0.169.0`): `three.module.min.js` (687 KB, unmodified), `RoomEnvironment.js` (an official addon, with its import changed to the relative path) and the MIT `LICENSE`. Nothing is loaded from a CDN. To update: `npm install three@<version> --save-dev`, then copy `node_modules/three/build/three.module.min.js`, `node_modules/three/LICENSE` and `node_modules/three/examples/jsm/environments/RoomEnvironment.js` into `vendor/three/` and change the `'three'` import in `RoomEnvironment.js` to `'./three.module.min.js'`. The room is built from primitives and generated textures, so there are no model or texture licenses to track.

## Run locally

ES modules do not load from `file://`, so serve the folder:

```
npm install
npm start        # http://localhost:4318
```

## Tests

```
npm install
npx playwright install chromium   # first time only
npm test
```

Playwright + axe-core (WCAG 2.0/2.1/2.2 A and AA tags) scan every step in light and dark, plus checks that decorative SVGs are hidden, the monitor is named from the data and the provider's expression follows the outcome, hotspot, notes and read-aloud checks (with a mocked speechSynthesis), a keyboard-only run through every hotspot to mastery, a 320px reflow check and an iframe check. `tests/scene1.spec.js` covers the immersive scene (axe in light and dark on every state, keyboard-only walk-through, movement keys only with focus and switchable off, no keyboard trap, overlays never overlapping, drag alternatives, reduced motion, no-WebGL message, 320px, hand-off of notes). `tests/view3d.spec.js` covers the 3D view: axe in light and dark with a panel open, a hidden canvas, hotspots as buttons inside the scene, 2D/3D toggling, Pause animation, reduced motion, the WebGL-unavailable and context-lost fallbacks and 320px. The Playwright config starts Chromium with SwiftShader so headless runs have WebGL.

## Embed (for example in Open edX)

```html
<iframe title="The 2 a.m. Call: SBAR handoff simulation"
        src="https://williamthe5thc.github.io/sbar-call-demo/"
        width="100%" height="900" style="border:0"></iframe>
```

Always give the iframe a `title`. All paths are relative, so it also works under a subpath.

## Write a new scenario

Everything is in `scenario.js`. Copy it and change: `assessment`, `chart` (vitals table, notes, meds, labs), `sections[].statements`, `criteria` feedback text and `replies`.

- `kind: 'required'`: must be chosen. Add `lead: true` to a statement that must come first in its section (the scenario uses this only for the call's opening line).
- `kind: 'distractor'`: should not be chosen. Add `belongsIn: 'B'` (a section key) if it is real content shown in the wrong section; add `why` if it is irrelevant or vague.
- `request: true` / `timeFrame: true` mark Recommendation statements for the Clear request rule.

Assessment format (one entry per object, listed left to right, which is also the Tab order):

```js
{ id: 'drain', label: 'Surgical drain',   // visible and accessible name
  x: 51.3, y: 90.4,                       // label position, percent of the 8:5 scene
  tx: 51.3, ty: 74.4,                     // optional: the object, percent (leader line)
  pos3d: [0.3, 0.36, 0.02],               // 3D view: where the object is in the room, metres [x, y, z]
  panel: 'monitor' | 'chart',             // optional: extra content in the panel
  findings: ['Observed sentence.', '...'] } // what is seen, never what it means
```

`app.js` needs no changes, but a new scene needs new artwork: `assessSvg()` in `illustrations.js` and the room in `scene3d.js` are hand-built for this patient, and `x`/`y` and `pos3d` must match them. Read aloud is in `readaloud.js`. Scene artwork is in `illustrations.js` (hand-built SVG functions; the monitor reads the vitals from the scenario).

## Credits and sources

- Wittenberg, Goldsmith, Prince-Paul & Beltran (2021), J Nurs Educ 60(11), 618-624, https://doi.org/10.3928/01484834-20210913-03
- Yun, Lee, Kang & Park (2023), BMC Med Educ 23:507, https://doi.org/10.1186/s12909-023-04495-8 (most included studies were low quality)
- IHI SBAR tool: https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation

## License

MIT. See `LICENSE`.
