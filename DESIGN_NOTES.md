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

## Why 2D first, then 3D as an option
A 2D page is accessible, light, works in an iframe and needs no GPU, so it came first and is still the base: the SVG scene and the 3D view show the same objects, the same hotspots and the same findings. The 3D bedside exam (`scene3d.js`) is an optional layer on top, described below. The 2D view stays one button away and is the automatic fallback.

## Why these illustrations, and how they stay accessible
The first version was all text, so each step now has a hand-built inline SVG scene (`illustrations.js`, with `room.js` for the bedside room and `people.js` for the characters; no image files, libraries or canvas). The look is a semi-realistic night room: the warm reading lamp and the cool monitor glow are radial gradients, shadows are blurred shapes, metal and plastic have highlight gradients, and the characters are shaded faces with hair, scrubs, a coat, stethoscope and handset. SVG keeps this light (about 60 KB for the bedside scene, well under the 120 KB budget, with shared gradients, filters and repeated shapes in one `<defs>` per SVG), sharp at any zoom, and themeable, and the important numbers stay real text. The scenes are night scenes in light and dark mode so the vitals stay high contrast. The welcome page reuses the bedside room without hotspots, and the mastery page shows the same room at sunrise with the patient resting.

- Decorative vs informative: the intro room, the nurse's station, the provider call scene and the sunrise only repeat what the page text says, so they are `aria-hidden="true"` and `focusable="false"`. The bedside monitor on the chart step carries information, so it has `role="img"` and an `aria-label` built from the vitals data ("heart rate up from 84 to 112, blood pressure down from 128/78 to 92/54 since 6:00 p.m."). The full vitals table stays below it as the complete text equivalent, and the PLACEHOLDER tag sits right under the monitor.
- Monitor numbers are real `<text>`, not paths, so they scale, can be restyled, and are found by browser text search and zoom. All values and the sparklines come from `scenario.js`, never hard-coded. The sparklines differ by line style and marker shape (solid circles for heart rate, dashed squares for systolic BP) and carry direct labels, so color is not the only cue.
- The provider's mood is also in words. The face (calm, unsure, confused) follows how many criteria were met, and a visible line says it ("The provider sounds confused."), so meaning never depends on a face alone. The wrapper carries `data-provider-mood` for tests. Characters are varied in skin tone, hair and age, with no logos or brands.
- Motion: only a monitor dot blinking three times and the call signal pulsing three times (each under 4 seconds). `prefers-reduced-motion` turns all animation off.
- Layout: SVGs are `width: 100%; height: auto`, stay compact at 320px, and add no horizontal scroll. Monitor text is sized so it stays readable at that width.

## Why the learner examines the scene
A chart handed over in full tells the learner what matters. Real nurses decide where to look, so the learner opens the objects they think are worth checking, and the findings state what is observed, not what it means. Some findings are normal or irrelevant (IV site, dressing, PCA pump). Opening everything is not required and nothing blocks continuing; a gentle note appears if nothing was opened. Opened findings collect in "Your assessment notes", shown again on the Build step. All findings are data in `scenario.js` (`assessment`), so a new case or a later 3D scene reuses them. Clinical values are placeholders.

## How the hotspots stay accessible
- Hotspots are real `<button>`s in a list, in DOM (Tab) order left to right, positioned by percentage over a fixed 8:5 scene. The SVG is `aria-hidden`; all information is in HTML.
- Each shows a visible text label and uses it as its name (2.5.3). Targets are at least 44 px; the focus ring is a white ring over a dark one so it is visible on the scene and the page.
- Activating one keeps focus on the button, fills a panel (`aria-live="off"`, referenced by `aria-controls`), marks the button `aria-current="true"` and announces "<object>: <first sentence> Added to your notes." through the shared live region. Opened and active states use an icon and underline, not color alone.
- "Show all findings as a list" is the complete text alternative, including the vitals table.
- Below 640 px of container width the overlay and leader lines are hidden and the same buttons become a plain list above the panel. No horizontal page scroll at 320 px.

## Read aloud
For people who prefer listening (UDL, multiple means of representation). This is separate from screen readers and does not replace them. Buttons appear on the findings panel, the notes list and each SBAR fieldset only when `speechSynthesis` exists. It never auto-plays, starting one reader stops another, the label toggles to "Stop reading", and it stops on step change. One utterance per sentence (onstart marks it, onend advances) is more reliable than word-boundary events. The sentence being read gets a background plus a thick underline (not color alone) with at least 3:1 contrast in light and dark.

## Focus and live regions
Every step has an h2 with `tabindex="-1"`. When the step changes, code moves focus to it and updates the page title, so keyboard and screen-reader users know the view changed. One `role="status"` live region is reused for announcements (checkbox changes, moves, the provider reply). It is cleared before each message so repeats are still read.

## Why the scenario is one data file
`scenario.js` holds all case content. Another instructor can copy it, change the data and get a new case without touching code. See README, "Write a new scenario".

## Embedding in Open edX
Use an iframe with a `title` attribute (see README). All paths are relative, so it works at a subpath such as /sbar-call-demo/. State is in memory only, so a reload starts over.

## What's next
Nursing SME review; learner testing; xAPI statements for attempts and mastery.

## TODO
- [ ] Nursing SME review of every clinical value, note, statement and provider reply (all are placeholders).
- [ ] Verify the BSNU program guide wording ("Demonstrate effective communication in oral, written, interpersonal, and electronic modalities") before quoting it; only the verified line is used now.
- [ ] Learner testing, including with screen reader users.
- [ ] Manual screen reader pass (NVDA/JAWS/VoiceOver); automated axe is not enough.
- [ ] Decide whether to add xAPI.

## Why feedback gives hints, not answers
When a required item is missing, the Completeness tip names what kind of
information is missing ("Situation is missing how his heart rate and blood
pressure have changed") instead of quoting the statement. Quoting it would let a
learner copy the answer key without reading the chart, and the skill being
practiced is choosing what matters. Tips about statements the learner already
chose can quote them, because those are the learner's own words.

## The 3D view: why the canvas carries no information
The bedside exam can be shown in 3D (Three.js, built only from primitives and procedural textures, so there are no model or texture licenses). The `<canvas>` is `aria-hidden="true"`, holds nothing focusable and says nothing that the page does not also say in HTML. A screen reader user, a keyboard user and a learner who turns 3D off get exactly the same findings, notes, "Show all findings as a list" and read aloud as before. The pump screens show only a word and a bar, never a number; the monitor texture is drawn from the same vitals data as the 2D monitor and the HTML table, so the two cannot disagree. If the canvas disappeared, nothing would be lost, which is the test for decorative content.

- View toggle: a real button, always labelled "3D view", with `aria-pressed` for the state (the label does not change, so assistive tech reads one consistent control). 2D view is the existing SVG. The choice is kept in `localStorage` (inside try/catch; the page works without it).
- Default is 3D only when WebGL works. If WebGL is missing, the module fails to load or the context is lost, the page switches to 2D and shows a short visible note in a `role="status"` line. The fallback is not saved as the learner's choice.
- The 3D code is loaded with a dynamic `import()` only when needed, so 2D users and the fallback never download it.
- Camera: a fixed bedside view. Activating a hotspot moves the camera (about 0.8 s, eased) to a close view; "Back to bedside view" returns, and "Look left / Look right" turn the view in two small steps. There is deliberately no drag-to-look, so nothing needs a dragging gesture (2.5.7). The scene never listens for keyboard events, only our own buttons do (2.1.2: no keyboard trap).
- Performance: render on demand (only when the camera moves, the animation runs or the window resizes), at most 30 fps for the idle animation, paused when the tab is hidden or the canvas is off screen, pixel ratio capped at 1.5, shadows drawn once.

## How hotspots follow 3D objects
The hotspots are the same `<button>`s as in 2D, in the same DOM (Tab) order, with the same labels, `aria-controls`, `aria-current` and announcements. Each item in `scenario.js` has `pos3d: [x, y, z]` (metres) next to its 2D `x`/`y`. After each rendered frame `scene3d.js` projects every anchor to the screen and writes the result into the button's wrapper (`--x`, `--y`), so the button sits just above its object.

- Off screen or behind the camera during a move: the button is clamped to the nearest edge, so it stays reachable. Labels that would overlap are moved apart so none covers another, and a focused hotspot gets the highest z-index, so nothing hides it (2.4.11). The view controls sit below the scene, not over it.
- Focus never moves the camera: Tab only moves focus. Enter, Space or a click opens the findings and moves the camera, and focus stays on the button.
- Below about 640 px of container width the buttons keep the plain list layout and the canvas shrinks to a small view above it, so there is no horizontal scroll at 320 px.
- Tab order follows the data order, which is roughly left to right in the 3D room too. If a 3D label sits a little away from its object after de-overlapping, the label text still names it.

## Accessible animation
- 2.2.2 (Pause, Stop, Hide): the idle animation (breathing, the ECG trace, the curtain sway) runs longer than 5 seconds, so there is a visible "Pause animation" / "Play animation" button (the label changes with the state). With the animation paused, nothing is drawn until something changes.
- 2.3.1 (Three Flashes): nothing flashes. The ECG trace scrolls smoothly and no light changes quickly. The older monitor dot and call signal blink at most three times.
- 2.3.3 (Animation from Interactions, AAA, followed as good practice): the "Reduce motion" button in the header (a real button with `aria-pressed`, saved in `localStorage`) turns off step transitions, entrance animations and idle animation, and makes camera moves instant cuts. It starts on when the system asks for reduced motion (`prefers-reduced-motion`) and the learner can still change it. The Play button remains, so someone who wants the idle animation can opt in.
- Step transitions use the View Transitions API where it exists (cross-fade plus a small slide, about 250 ms) and fall back to an instant swap. The step changes first and focus moves to the new heading as part of the swap, so there is no gap where focus sits on content that is going away.
- Entrances (the feedback criteria fade in one after another, the provider's speech bubble pops in) are under one second in total. The content is real HTML from the first frame; the animation only changes how it appears.
- No information by motion alone: every state that is animated is also text (the provider's mood has a words line, a camera move is also the findings panel changing, and "Met / Not yet" are words). Animations never delay interaction: the next step's heading is focused straight away and nothing waits for an animation to end.

## Immersive scenes 1 and 2: how a first-person 3D scene meets WCAG 2.2
`scene1.html` (with `scene1.js`, `world1.js`, `room1.js`, `scene1.css`) is a full-window, first-person version of the bedside assessment, only scene 1. The 3D room fills the window and the interface sits on top of it as overlays (title bar, caption strip, findings card, Notes, Objects nearby, Go to bar, Turn and Look buttons). It reuses the data in `scenario.js`, the furniture from `scene3d.js` (`buildRoom` with `noShell`) and Three.js r169 from `vendor/three/`. Floor, walls, wainscot, ceiling tiles, wood grain and fabric are CanvasTextures drawn in code, so there are no models, textures or downloads. The standard version is untouched and one link away ("Exit to the standard version"); `index.html` links to the immersive page from its intro.

The rule is the same as the 3D bedside exam: the canvas is `aria-hidden` and carries nothing the page does not also say in HTML. If the canvas vanished, no finding, label or control would be lost.

- **2.1.1 Keyboard.** Everything works without a pointer. Go to buttons, Turn and Look buttons, every object in "Objects nearby", Notes, Show all findings, Help and finishing are real buttons. The 3D view is a focusable `role="group"` (not `role="application"`, which would switch off screen reader navigation) labelled "3D room view. Use arrow keys or W A S D to move, Q and E to turn, or use the Go to buttons." and described by the controls text. While it has focus: arrows or W A S D move (A and D, and left and right, strafe), Q and E or Shift with the arrows turn and look. Jump style (default) moves one step per press; smooth style walks while the key is held.
- **2.1.2 No keyboard trap.** The key handler is on the view element itself and handles only the keys above. Tab and Shift+Tab are never handled, so focus leaves the view in both directions (tested). Dialogs make the page behind `inert`, and Escape closes Help and the end card.
- **2.1.4 Character key shortcuts.** W A S D, Q and E are single-character shortcuts. They act only while the 3D view has focus, and "Movement keys" can be turned off at the start screen or in Help (saved in `localStorage`, inside try/catch).
- **2.2.2 Pause, Stop, Hide.** The idle animation (breathing, monitor trace, curtain) can run longer than 5 seconds, so "Pause animation / Play animation" is in the top bar. It starts paused when Reduce motion is on. Paused means no frames are drawn until something changes.
- **2.3.1 Three flashes.** Nothing flashes. The only luminance change is a one-time 300 ms dip to at most 50% black on a jump move, and it is skipped under Reduce motion and in smooth style.
- **2.3.3 Animation from interactions (AAA, good practice).** "Reduce motion" (shared with the standard version through `motion.js`) and `prefers-reduced-motion` make every camera move an instant cut and remove the fade. Smooth walking becomes short steps while it is on. Hotspot markers are hidden while the camera moves, so nothing slides under the pointer.
- **2.4.3 Focus order.** DOM order is: title bar, caption and findings, Notes and Objects nearby, Go to, Turn and Look, finish. After Start, focus goes to the scene heading. After finishing, it goes to the end card heading, and "Back to the room" returns to the finish button. On a phone, choosing an object closes the list, so focus moves to the findings card heading instead of being lost. The page title changes with the state (Start, Scene 1, Scene 1 complete).
- **2.4.7 Focus visible.** One rule gives every control a 3 px ring with a contrasting halo, in light and dark. The 3D view gets a thick inset ring.
- **2.4.11 Focus not obscured (minimum).** The overlays live in one CSS grid (top, left, right, bottom-left, bottom-right) so no panel can sit on another. A test checks pairwise overlap at desktop, phone and short sizes. The findings card is in the left column, away from the Objects list and Notes. The markers drawn over the 3D are `tabindex="-1"` and `aria-hidden` duplicates for pointer users; each is hidden when it would sit under any overlay or outside the view, and every object is always reachable in the Objects nearby list. A test tabs through every control and checks that nothing covers it.
- **2.5.7 Dragging movements.** Dragging looks around, but is never required: Turn left, Turn right, Look up, Look down and the keys do the same. There is no pointer lock. Clicking or tapping an object (a ray cast) examines it.
- **2.5.8 Target size (minimum).** Buttons are 44 px high (40 px for compact top bar buttons, 36 px at most on phones, all above 24 px). Markers are 44 px. A test checks the focused control sizes.
- **1.4.3 Contrast (minimum) and 1.4.11 Non-text contrast.** Overlay panels are 90 to 94% opaque, so text sits on a near-solid dark (or, in light mode, near-white) surface whatever is behind it. Text is at least 4.5:1, borders and focus rings at least 3:1 (axe, light and dark). State is never color alone: "examined" is a check mark plus the word, the current spot has a dot and underline, "in view" is words.
- **1.4.10 Reflow.** No horizontal scroll at 320 px (tested, also at 640 x 360, which is 200% zoom of a 1280 x 720 window). Below 720 px the overlays stack into a bottom sheet, Go to becomes a menu button, and only one of findings, Notes, Objects and Go to is open at once so the room stays visible.
- **Other.** `lang="en"`, a page title per state, a single live region (moving, examined, in-view objects after a move), start screen with the portfolio label and clinical-review label, Read aloud on findings and notes (`readaloud.js`, never auto-plays), and the findings card carries the chart tables, so reading the chart needs no 3D. A missing WebGL context shows a clear message and a link to the standard version.

Performance: the 3D module loads only when WebGL works; the start screen paints before the room is built; pixel ratio is capped at 1.5; shadows are drawn once; rendering is on demand (30 fps while the idle animation runs, nothing when paused or when the tab is hidden); hotspot occlusion rays run only when the camera has stopped.

### Not yet verified
- Real screen readers (NVDA, JAWS, VoiceOver, TalkBack). Only axe and Playwright have run. The role, label and live-region choices are untested with people.
- Real GPUs, especially low-end laptops and phones. All runs used SwiftShader (software WebGL); frame rate, shadow quality and start-up time on real hardware are unknown.
- Users with vestibular disorders. Reduce motion and the cuts help, but first-person movement can still cause discomfort and nobody with that condition has tried it.
- Switch, voice control and eye tracking; touch-only use on real devices; Windows High Contrast mode.
- The hallway door and the nurses' station are scenery for scene 2 and cannot be entered yet. Scene 2, the call itself, is not built.
- All clinical values are placeholders and still need nursing SME review.

## Immersive scene 2: the call, and what changed in scene 1

**Scene 1 changes.** The room is now clearly 2 a.m.: the overhead lights are off, the ambient light is almost gone, and what is left is a warm lamp pool at the bedside, the cool glow of the monitor, a little moonlight through the window, and light spilling from the lit hallway through the open door (a shadow-casting spot, so the door frame shapes it). A CSS vignette darkens the corners. Overlays stay 90 to 94% opaque, so text contrast is unchanged (4.5:1 or better); markers are solid chips with a 2 px light ring, so they keep at least 3:1 against the darker scene. "Objects nearby (10)" and "Notes" are compact toggle buttons, collapsed by default, so the room fills the screen. They are real buttons with `aria-expanded`; every object stays reachable by keyboard once the list is open.

**One page, a small state machine.** `data-scene` (1 or 2) and `data-phase` (play, end, walk, station, phone, call, feedback, return, mastery) describe where the learner is. Each scene sets the page title, the visible scene label (top bar and the heading in the caption strip), its own Go to buttons and its own markers. Focus moves to the scene heading when a scene starts and to the heading of each overlay when it opens (2.4.3). The live region announces scene changes, the call starting, the provider's reply and the results.

**The walk (2.2.2, 2.3.3).** After "I'm ready to call the provider" and "Walk to the nurses' station", the camera walks the real path through the door and along the hallway, with the caption "Walking to the nurses' station". It lasts a few seconds, "Skip walk" cuts it, and under Reduce motion (or `prefers-reduced-motion`) it is a cut. The Go to bar and other controls are inert while it runs. The same applies to the walk back to Room 12 and the provider's arrival.

**Captions and optional voice (1.2.x spirit, 1.4.2).** There is no audio track: the call is text. The learner's statements play as captions in a transcript, section by section, then the provider replies. The mood is shown on the portrait and as a sentence ("The provider sounds unsure and asks a question."), never by the picture alone. Voice is a button, "Voice: off" by default, that uses `speechSynthesis`; nothing is spoken until it is turned on (tested with a mocked `speechSynthesis`), captions are always shown, and a stuck utterance never holds the captions back. Under Reduce motion, turning voice on reads the finished transcript from the top. Nothing plays by itself, so 1.4.2 (Audio Control) is met by there being no automatic audio.

**Timing and pause (2.2.1, 2.2.2).** Captions advance by themselves at about 330 ms per word plus 900 ms (never under 250 ms per word, and at least 1.6 s). The learner controls the timing: Pause captions and Resume, Next caption (stays paused if paused) and Show all. The whole transcript stays on screen afterwards. The call timer on the provider card is decorative (`aria-hidden`), runs only while captions play, stops when they are paused and does not run under Reduce motion. Under Reduce motion every caption appears at once.

**Focus and Escape (2.4.3, 2.1.2).** Overlays are dialogs that make the page behind `inert`. Escape closes the topmost non-essential overlay and returns focus to what opened it: Help (to Help), the findings card, Objects nearby, Notes and the Go to menu (to their buttons), and the phone notepad (to "Pick up the phone"; your selections are kept). The start screen, the call, the feedback and the evidence of mastery are essential steps and ignore Escape. No overlay traps focus: each has real buttons that leave it.

**Shared scoring.** `score()` moved from `app.js` to `scoring.js`, which both versions import, along with the statement look-up. The feedback overlay uses the same criteria names, descriptions, hints and provider replies as the standard version. A test runs several selections through both versions and compares every criterion, hint, reply and mood.

**The 3D station is decorative.** The hallway, counter, desk, chair, phone and the computer showing a simple EHR screen (a CanvasTexture drawn from `scenario.chart`) are in the canvas, which stays `aria-hidden`. The same chart is text in the phone notepad's Chart section, so nothing is lost without the canvas. The phone can be picked up by a button, by its marker, or by clicking it. The provider arriving at the door is a simple figure; the arrival is also said in the caption, the live region and the mastery text.

**Not yet verified (scene 2).** Real screen readers; real speech voices (only a mocked `speechSynthesis`); real GPUs and phones; users with vestibular disorders. The walk is short and skippable, but first-person motion can still be uncomfortable. The clinical content remains placeholder and needs nursing SME review.

