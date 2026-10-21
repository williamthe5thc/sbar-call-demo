# The 2 a.m. Call

An accessible, competency-based SBAR handoff simulation. A learner reviews a chart for a fictional post-operative patient, builds a call to the on-call provider, gets feedback on four criteria, and retries until all four are met.

> Personal portfolio demo. Not affiliated with WGU. Fictional patient. Clinical content requires review by a nursing subject matter expert.

All clinical values are placeholders. Plain HTML, CSS and vanilla JS (ES modules). No build step, no runtime dependencies, no CDNs, no audio.

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

Playwright + axe-core (WCAG 2.0/2.1/2.2 A and AA tags) scan every step in light and dark, plus a keyboard-only run to mastery, a 320px reflow check and an iframe check.

## Embed (for example in Open edX)

```html
<iframe title="The 2 a.m. Call: SBAR handoff simulation"
        src="https://williamthe5thc.github.io/sbar-call-demo/"
        width="100%" height="900" style="border:0"></iframe>
```

Always give the iframe a `title`. All paths are relative, so it also works under a subpath.

## Write a new scenario

Everything is in `scenario.js`. Copy it and change: `chart` (vitals table, notes, meds, labs), `sections[].statements`, `criteria` feedback text and `replies`.

- `kind: 'required'` with `order`: must be chosen, in that order within its section.
- `kind: 'distractor'`: should not be chosen. Add `belongsIn: 'B'` (a section key) if it is real content shown in the wrong section; add `why` if it is irrelevant or vague.
- `request: true` / `timeFrame: true` mark Recommendation statements for the Clear request rule.

`app.js` needs no changes.

## Credits and sources

- Competency wording: WGU RN-to-BSN program page, "Professional Communication/Collaboration", https://www.wgu.edu/online-nursing-health-degrees/rn-to-bsn-nursing-bachelors-program.html
- Wittenberg, Goldsmith, Prince-Paul & Beltran (2021), J Nurs Educ 60(11), 618-624, https://doi.org/10.3928/01484834-20210913-03
- Yun, Lee, Kang & Park (2023), BMC Med Educ 23:507, https://doi.org/10.1186/s12909-023-04495-8 (most included studies were low quality)
- IHI SBAR tool: https://www.ihi.org/resources/tools/sbar-tool-situation-background-assessment-recommendation

## License

MIT. See `LICENSE`.
