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
A 2D page is accessible, light, works in an iframe and needs no GPU. A 3D night-station scene could be added later as an optional, decorative layer that does not carry any required information.

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
