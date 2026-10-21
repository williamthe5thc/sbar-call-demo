# Design notes

## Why SBAR
SBAR (Situation, Background, Assessment, Recommendation) is a common structure for calls to providers; the IHI publishes a tool describing it. It gives learners a concrete, checkable skill to practice. The IHI page describes the tool and makes no effectiveness claim, and neither does this demo.

## Why practice at all
Communication in BSN programs is still taught mostly as knowledge rather than as a practiced skill (Wittenberg et al., 2021). SBAR-based simulation has improved communication clarity in some studies, though the evidence is mostly low quality (Yun et al., 2023: six of 12 studies favored it, most were weak). This demo gives repeated, low-stakes practice building the call. It does not claim to improve outcomes.

## Why competency-based mastery, not grades
The skill is written as one competency: "Communicate a patient's changing condition to a provider clearly and concisely, using SBAR." Competencies are met or not yet met, so the demo shows Met / Not yet per criterion, allows unlimited retries with no time limit, and shows no scores or percentages. Mastery means all four are met; the attempt history is the evidence.

## Why these four criteria
- Organization: every SBAR section has content, statements are in the right section, and the call opens with who is calling and about whom. I only enforce order where it clearly matters (the opening line); forcing one "correct" order for the rest would mark down good calls.
- Completeness: required items are present.
- Prioritization: no distracting details.
- Clear request: a specific ask plus a time frame.
They separate four different ways a call goes wrong, so feedback can name exactly what to fix. All rules are deterministic (see `score()` in `app.js`).

## Why branching provider replies
The reply shows the consequence of the call the way a real provider would. All four met: orders and thanks. Two or three met: a clarifying question tied to the first unmet criterion. Zero or one: "I'm not sure what you need from me."

## Why checkboxes and move buttons, not drag-and-drop
Drag-and-drop is hard for keyboard, switch and screen-reader users, and WCAG 2.2 requires a non-dragging alternative anyway. Native checkboxes plus "Move up / Move down" buttons work with every input method. Buttons have names like "Move up: <statement>", keep focus on the moved item, and announce the new position.

## Why 2D first, 3D later
A 2D page is accessible, light, works in an iframe and needs no GPU. The flat 2D illustrations stand in for it for now; a 3D night-station scene could be added later as an optional, decorative layer that does not carry any required information.

## Why these illustrations, and how they stay accessible
The first version was all text, so each step now has a flat, hand-built inline SVG scene (`illustrations.js`; no image files, libraries or canvas). One palette, set as `--il-*` custom properties in `styles.css`; the scenes keep a night-blue room in light and dark mode so the vitals stay high contrast.

- Decorative vs informative: the intro room, the nurse's station, the provider call scene and the sunrise only repeat what the page text says, so they are `aria-hidden="true"` and `focusable="false"`. The bedside monitor on the chart step carries information, so it has `role="img"` and an `aria-label` built from the vitals data ("heart rate up from 84 to 112, blood pressure down from 128/78 to 92/54 since 6:00 p.m."). The full vitals table stays below it as the complete text equivalent, and the PLACEHOLDER tag sits right under the monitor.
- Monitor numbers are real `<text>`, not paths, so they scale, can be restyled, and are found by browser text search and zoom. All values and the sparklines come from `scenario.js`, never hard-coded. The sparklines differ by line style and marker shape (solid circles for heart rate, dashed squares for systolic BP) and carry direct labels, so color is not the only cue.
- The provider's mood is also in words. The face (calm, unsure, confused) follows how many criteria were met, and a visible line says it ("The provider sounds confused."), so meaning never depends on a face alone. The wrapper carries `data-provider-mood` for tests. Characters are simple and varied in skin tone, with no logos or brands.
- Motion: only a monitor dot blinking three times and the call signal pulsing three times (each under 4 seconds). `prefers-reduced-motion` turns all animation off.
- Layout: SVGs are `width: 100%; height: auto`, stay compact at 320px, and add no horizontal scroll. Monitor text is sized so it stays readable at that width.

## Focus and live regions
Every step has an h2 with `tabindex="-1"`. When the step changes, code moves focus to it and updates the page title, so keyboard and screen-reader users know the view changed. One `role="status"` live region is reused for announcements (checkbox changes, moves, the provider reply). It is cleared before each message so repeats are still read.

## Why the scenario is one data file
`scenario.js` holds all case content. Another instructor can copy it, change the data and get a new case without touching code. See README, "Write a new scenario".

## Embedding in Open edX
Use an iframe with a `title` attribute (see README). All paths are relative, so it works at a subpath such as /sbar-call-demo/. State is in memory only, so a reload starts over.

## What's next
Nursing SME review; learner testing; optional 3D ambient layer; xAPI statements for attempts and mastery.

## TODO
- [ ] Nursing SME review of every clinical value, note, statement and provider reply (all are placeholders).
- [ ] Verify the BSNU program guide wording ("Demonstrate effective communication in oral, written, interpersonal, and electronic modalities") before quoting it; only the verified line is used now.
- [ ] Learner testing, including with screen reader users.
- [ ] Manual screen reader pass (NVDA/JAWS/VoiceOver); automated axe is not enough.
- [ ] Decide whether to add xAPI.
