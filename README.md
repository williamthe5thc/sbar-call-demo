# The 2 a.m. Call

An accessible, competency-based SBAR handoff simulation. A learner examines a fictional post-operative patient at the bedside, builds a call to the on-call provider, gets feedback on four criteria, and retries until all four are met.

> Personal portfolio demo. Fictional patient. Clinical content requires review by a nursing subject matter expert.

All clinical values are placeholders. Plain HTML, CSS and vanilla JS (ES modules). No build step, no runtime dependencies, no CDNs, no audio.

## Flow

Intro, Assess the patient, Build the call, Feedback, Mastery. On the assess step the learner selects objects in a bedside scene (monitor, drain, urine bag, pumps, dressing, chart and more). Each finding they open is added to "Your assessment notes", which come back on the build step.

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

Playwright + axe-core (WCAG 2.0/2.1/2.2 A and AA tags) scan every step in light and dark, plus checks that decorative SVGs are hidden, the monitor is named from the data and the provider's expression follows the outcome, hotspot, notes and read-aloud checks (with a mocked speechSynthesis), a keyboard-only run through every hotspot to mastery, a 320px reflow check and an iframe check.

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
  panel: 'monitor' | 'chart',             // optional: extra content in the panel
  findings: ['Observed sentence.', '...'] } // what is seen, never what it means
```

`app.js` needs no changes, but a new scene needs new artwork: `assessSvg()` in `illustrations.js` is hand-drawn for this patient, and `x`/`y` must match it. Read aloud is in `readaloud.js`. Scene artwork is in `illustrations.js` (hand-built SVG functions; the monitor reads the vitals from the scenario).

## Credits and sources

- Wittenberg, Goldsmith, Prince-Paul & Beltran (2021), J Nurs Educ 60(11), 618-624, https://doi.org/10.3928/01484834-20210913-03
- Yun, Lee, Kang & Park (2023), BMC Med Educ 23:507, https://doi.org/10.1186/s12909-023-04495-8 (most included studies were low quality)
- IHI SBAR tool: https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation

## License

MIT. See `LICENSE`.
