import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scenario } from '../scenario.js';

// Software WebGL (SwiftShader) is slow, so every test gets plenty of time.
test.setTimeout(120000);

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const HS = scenario.assessment;
const view = (page) => page.locator('#view');

async function load(page) {
  await page.goto('/scene1.html');
  await expect(page.locator('body')).toHaveAttribute('data-world', 'ready', { timeout: 90000 });
  await expect(page.locator('#start-btn')).not.toHaveAttribute('aria-disabled', 'true');
}
async function begin(page) {
  await load(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#scene-heading')).toBeFocused();
  await openObjects(page);
}
// "Objects nearby" starts collapsed (the room fills the screen); most tests want the list open.
async function openObjects(page) {
  if ((await page.locator('#objects-btn').getAttribute('aria-expanded')) !== 'true') await page.locator('#objects-btn').click();
  await expect(page.locator('#objects-body')).toBeVisible();
}
const settle = (page) => page.waitForFunction(() => document.querySelector('#view').dataset.moving === 'false', null, { timeout: 30000 });
const pose = (page) => view(page).evaluate((el) => ({ x: +el.dataset.x, z: +el.dataset.z, yaw: +el.dataset.yaw, pitch: +el.dataset.pitch, spot: el.dataset.spot }));
async function axe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
}
// Press Tab until the element matching `sel` has focus (proves it is reachable by keyboard alone).
async function tabTo(page, sel, max = 80) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement && document.activeElement.matches(s), sel)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not Tab to ${sel}`);
}

for (const scheme of ['light', 'dark']) {
  test(`axe: start screen, scene with findings card, notes panel and end card, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page);
    await axe(page); // start screen
    await page.locator('#start-btn').click();
    await expect(page.locator('#scene-heading')).toBeFocused();
    await openObjects(page);
    await page.locator('.obtn[data-id="drain"]').click();
    await expect(page.locator('#card')).toBeVisible();
    await expect(page.locator('#card-title')).toHaveText('Surgical drain');
    await settle(page);
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
    await axe(page); // findings card open
    await page.locator('#notes-btn').click();
    await expect(page.locator('#notes-body')).toBeVisible();
    await page.locator('#all-btn').click();
    await axe(page); // notes panel open, with all findings
    await page.locator('#ready').click();
    await expect(page.locator('#end')).toBeVisible();
    await axe(page); // end card
  });
}

test('the intro of the standard version links to the immersive beta', async ({ page }) => {
  await page.goto('/index.html');
  const link = page.getByRole('link', { name: 'Try the immersive version (beta)' });
  await expect(link).toHaveAttribute('href', 'scene1.html');
});

test('start screen: labels, choices, focus moves to the scene heading after Start', async ({ page }) => {
  await load(page);
  const dlg = page.getByRole('dialog', { name: /scene 1/i });
  await expect(dlg).toContainText('Personal portfolio demo. Fictional patient. Clinical content requires review by a nursing subject matter expert.');
  await expect(dlg.getByLabel('Jump between spots (default)')).toBeChecked();
  await expect(dlg.getByLabel('Smooth walking (optional)')).not.toBeChecked();
  await expect(page.locator('#start-title')).toBeFocused();
  expect(await page.title()).toContain('Start');
  await page.locator('#start-btn').click();
  await expect(page.locator('#scene-heading')).toBeFocused();
  await expect(page.locator('#caption')).toHaveText('Look around the room. Select objects to examine them.');
  expect(await page.title()).toContain('Scene 1');
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
});

test('the canvas is hidden from assistive tech; the view is a labelled, focusable group; nothing document-level scrolls', async ({ page }) => {
  await begin(page);
  await expect(page.locator('#view canvas')).toHaveAttribute('aria-hidden', 'true');
  await expect(view(page)).toHaveAttribute('role', 'group');
  await expect(view(page)).toHaveAttribute('aria-label', '3D room view. Use arrow keys or W A S D to move, Q and E to turn, or use the Go to buttons.');
  await expect(view(page)).toHaveAttribute('aria-describedby', 'controls-help');
  await expect(page.locator('#controls-help')).toContainText('Press Tab to leave the 3D view');
  expect(await view(page).evaluate((el) => el.tabIndex)).toBe(0);
  // The markers over the 3D are hidden duplicates (tabindex -1); every object is a real button in Objects nearby.
  expect(await page.locator('#hotspots .hs').evaluateAll((els) => els.every((e) => e.getAttribute('aria-hidden') === 'true' && e.tabIndex === -1))).toBe(true);
  await expect(page.locator('#objects-list .obtn')).toHaveCount(HS.length);
  const sizes = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight, view: document.querySelector('#view').getBoundingClientRect().toJSON() }));
  expect(sizes.sw).toBeLessThanOrEqual(sizes.cw); expect(sizes.sh).toBeLessThanOrEqual(sizes.ch);
  const vp = page.viewportSize();
  expect(Math.round(sizes.view.width)).toBe(vp.width); expect(Math.round(sizes.view.height)).toBe(vp.height);
});

test('keyboard only: Start, Go to buttons, bedside, examine three objects, open notes, finish', async ({ page }) => {
  await load(page);
  await tabTo(page, '#start-btn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#scene-heading')).toBeFocused();
  await tabTo(page, '[data-spot="bedleft"]');
  await page.keyboard.press('Enter');
  await expect(view(page)).toHaveAttribute('data-spot', 'bedleft');
  await settle(page);
  await expect(page.locator('#goto-list [data-spot="bedleft"]')).toHaveAttribute('aria-current', 'location');
  await tabTo(page, '#objects-btn'); // collapsed by default: a real button opens the list
  await page.keyboard.press('Enter');
  for (const id of ['skin', 'abdomen', 'ivsite']) {
    await tabTo(page, `.obtn[data-id="${id}"]`);
    await page.keyboard.press('Enter');
    await expect(page.locator('#card-title')).toHaveText(HS.find((h) => h.id === id).label);
    await expect(page.locator(`.obtn[data-id="${id}"]`)).toBeFocused(); // focus stays where it was
    await settle(page);
  }
  await expect(page.locator('#notes-count')).toHaveText('(3)');
  await tabTo(page, '#notes-btn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#notes-list')).toContainText('His skin feels cool to the touch.');
  await tabTo(page, '#ready');
  await page.keyboard.press('Enter');
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#end-title')).toBeFocused();
  await expect(page.locator('#end')).toContainText("Scene 1 complete");
  await expect(page.locator('#end')).toContainText("Next: walk to the nurses' station and make the call to the on-call provider.");
  expect(await page.title()).toContain('Scene 1 complete');
});

test('movement keys only act while the 3D view has focus, and can be turned off', async ({ page }) => {
  await begin(page);
  const p0 = await pose(page);
  await page.keyboard.press('w'); // focus is on the heading, not the view
  await page.keyboard.press('ArrowUp');
  expect(await pose(page)).toEqual(p0);
  await view(page).focus();
  await expect(page.locator('#keyhint')).toBeVisible();
  await page.keyboard.press('ArrowUp');
  await settle(page);
  const p1 = await pose(page);
  expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeGreaterThan(0.3);
  await page.keyboard.press('e');
  await settle(page);
  expect((await pose(page)).yaw).not.toBe(p1.yaw);
  await page.keyboard.press('Shift+ArrowUp');
  await settle(page);
  expect((await pose(page)).pitch).toBeGreaterThan(p1.pitch);
  // Turn the keys off in Help: nothing moves any more.
  await page.locator('#help-open').click();
  await page.locator('#keys-help').uncheck();
  await page.locator('#help-close').click();
  await view(page).focus();
  const p2 = await pose(page);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('w'); await page.keyboard.press('q');
  expect(await pose(page)).toEqual(p2);
  await page.locator('#help-open').click();
  await expect(page.locator('#keys-help')).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help')).toBeHidden();
  await expect(page.locator('#help-open')).toBeFocused();
});

test('smooth walking keeps going while a key is held and stops out of the furniture', async ({ page }) => {
  await load(page);
  await page.locator('input[name="style"][value="smooth"]').check();
  await page.locator('#start-btn').click();
  await view(page).focus();
  const p0 = await pose(page);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowUp');
  const p1 = await pose(page);
  expect(Math.hypot(p1.x - p0.x, p1.z - p0.z)).toBeGreaterThan(0.2);
  // Walk into the bed: the camera stays out of it (the bed is x -1.15..1.15, z -1.05..-0.05).
  await page.locator('#goto-list [data-spot="bedleft"]').click();
  await settle(page);
  await view(page).focus();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(2500);
  await page.keyboard.up('ArrowUp');
  const p2 = await pose(page);
  expect(p2.z).toBeGreaterThan(0.2);
  expect(p2.z).toBeGreaterThan(-1.2);
});

test('Tab leaves the 3D view in both directions (no keyboard trap)', async ({ page }) => {
  await begin(page);
  await view(page).focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe('view');
  await view(page).focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe('view');
  // From the view, Tab reaches the rest of the page.
  await view(page).focus();
  await tabTo(page, '#ready');
});

test('no focused control is hidden under another overlay (2.4.11) and every one shows a focus indicator', async ({ page }) => {
  await begin(page);
  await page.locator('.obtn[data-id="monitor"]').click();
  await settle(page);
  await page.locator('#notes-btn').click();
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el.id === 'view' || el === document.body) return { skip: true, id: el && el.id };
      const b = el.getBoundingClientRect();
      const pts = [[b.left + 3, b.top + 3], [b.right - 3, b.bottom - 3], [b.left + b.width / 2, b.top + b.height / 2]];
      const top = pts.map(([x, y]) => { const t = document.elementFromPoint(x, y); return !!t && (el.contains(t) || t.contains(el)); });
      const cs = getComputedStyle(el);
      return { id: el.id || el.textContent.trim().slice(0, 20), covered: top.some((x) => !x), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, w: b.width, h: b.height };
    });
    if (r.skip) { if (seen.size > 5) break; continue; }
    seen.add(r.id);
    expect(r.covered, `covered: ${r.id}`).toBe(false);
    expect(r.outline, `outline: ${r.id}`).toBe(true);
    expect(r.h, `target height: ${r.id}`).toBeGreaterThanOrEqual(24);
  }
  expect(seen.size).toBeGreaterThan(15);
});

test('the overlays never cover each other, at desktop and phone sizes', async ({ page }) => {
  const check = async () => {
    const rects = await page.evaluate(() => [...document.querySelectorAll('.title, .top-btns, .strip, .card:not([hidden]), .panel, .goto, .looks, #ready')]
      .filter((e) => e.offsetParent !== null).map((e) => ({ id: e.className || e.id, ...e.getBoundingClientRect().toJSON() })));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const overlap = a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
      expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false);
    }
    const vp = page.viewportSize();
    for (const r of rects) { expect(r.left).toBeGreaterThanOrEqual(-1); expect(r.right).toBeLessThanOrEqual(vp.width + 1); expect(r.bottom).toBeLessThanOrEqual(vp.height + 1); }
  };
  await begin(page);
  await page.locator('.obtn[data-id="chart"]').click();
  await settle(page);
  await page.locator('#notes-btn').click();
  await check();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await check();
  await page.locator('#goto-toggle').click();
  await page.waitForTimeout(300); // let the stacked layout settle
  await check();
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.locator('#goto-toggle').evaluate((b) => b.getAttribute('aria-expanded')); // wide again: the bar is always shown
  await page.waitForTimeout(300);
  await check();
});

test('Turn and Look buttons and dragging all change the view (2.5.7)', async ({ page }) => {
  await begin(page);
  const p0 = await pose(page);
  await page.getByRole('button', { name: 'Turn left' }).click(); await settle(page);
  const p1 = await pose(page);
  expect(p1.yaw).toBeGreaterThan(p0.yaw);
  await page.getByRole('button', { name: 'Turn right' }).click(); await page.getByRole('button', { name: 'Turn right' }).click(); await settle(page);
  expect((await pose(page)).yaw).toBeLessThan(p1.yaw);
  const p2 = await pose(page);
  await page.getByRole('button', { name: 'Look up' }).click(); await settle(page);
  const p3 = await pose(page);
  expect(p3.pitch).toBeGreaterThan(p2.pitch);
  await page.getByRole('button', { name: 'Look down' }).click(); await page.getByRole('button', { name: 'Look down' }).click(); await settle(page);
  expect((await pose(page)).pitch).toBeLessThan(p3.pitch);
  // Dragging works too, but is never required.
  const before = await pose(page);
  await page.mouse.move(600, 450); await page.mouse.down(); await page.mouse.move(700, 450, { steps: 6 }); await page.mouse.up();
  expect((await pose(page)).yaw).not.toBe(before.yaw);
});

test('clicking an object in the 3D room examines it', async ({ page }) => {
  await begin(page);
  await page.locator('#goto-list [data-spot="monitor"]').click();
  await settle(page);
  await expect.poll(async () => (await page.locator('.hs[data-id="monitor"]').getAttribute('data-show')), { timeout: 15000 }).toBe('true');
  const box = await page.locator('.hs[data-id="monitor"]').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.locator('.hs[data-id="monitor"]').click();
  await expect(page.locator('#card-title')).toHaveText('Monitor');
  await expect(page.locator('#card-body')).toContainText('heart rate of 112');
  await expect(page.locator('#notes-count')).toHaveText('(1)');
  // Raycast: click the monitor screen itself, in the middle of the view.
  await page.locator('.obtn[data-id="drain"]').click(); await settle(page);
  await page.locator('#goto-list [data-spot="monitor"]').click(); await settle(page);
  await page.mouse.click(720, 440);
  await expect(page.locator('#card-title')).toHaveText('Monitor');
});

test('reduced motion makes every move instant; otherwise moves are tweened', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await begin(page);
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#anim-toggle')).toHaveText('Play animation');
  await page.locator('#goto-list [data-spot="bedleft"]').click();
  expect(await view(page).getAttribute('data-moving')).toBe('false');
  expect((await pose(page)).spot).toBe('bedleft');
  await page.locator('.obtn[data-id="monitor"]').click();
  expect(await view(page).getAttribute('data-moving')).toBe('false');
  await expect(page.locator('#fade')).not.toHaveClass(/go/);
  // Turn Reduce motion off in the page: moves are animated again.
  await page.locator('#motion-toggle').click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#goto-list [data-spot="foot"]').click();
  expect(await view(page).getAttribute('data-moving')).toBe('true');
  await settle(page);
  expect((await pose(page)).spot).toBe('foot');
});

test('Pause animation stops the idle animation (2.2.2) and the page can be paused and played', async ({ page }) => {
  await begin(page);
  await expect(view(page)).toHaveAttribute('data-animating', 'true');
  await page.locator('#anim-toggle').click();
  await expect(page.locator('#anim-toggle')).toHaveText('Play animation');
  await expect(view(page)).toHaveAttribute('data-animating', 'false');
  await page.waitForTimeout(600); // let any last frame finish
  const f = await view(page).getAttribute('data-frames');
  await page.waitForTimeout(800);
  expect(await view(page).getAttribute('data-frames')).toBe(f);
  await page.locator('#anim-toggle').click();
  await expect(view(page)).toHaveAttribute('data-animating', 'true');
});

test('without WebGL there is a clear message and a link to the standard version', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(type)) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto('/scene1.html');
  const dlg = page.getByRole('alertdialog');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText('3D room is not available');
  await expect(page.locator('#nogl-title')).toBeFocused();
  await expect(dlg.getByRole('link', { name: 'Open the standard version' })).toHaveAttribute('href', 'index.html');
  await axe(page);
});

test('320px: no horizontal scroll, and zoomed layouts still work', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await load(page);
  const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= document.body.clientWidth);
  expect(await noScroll()).toBe(true);
  await page.locator('#start-btn').click();
  expect(await noScroll()).toBe(true);
  await page.locator('#goto-toggle').click();
  expect(await noScroll()).toBe(true);
  await page.locator('#goto-list [data-spot="bedleft"]').click();
  await settle(page);
  await page.locator('#objects-btn').click();
  await page.locator('.obtn[data-id="drain"]').click();
  await expect(page.locator('#card-title')).toBeFocused();
  expect(await noScroll()).toBe(true);
  await page.locator('#notes-btn').click();
  expect(await noScroll()).toBe(true);
  await axe(page);
  // 200% zoom of a 1280 x 720 window is a 640 x 360 viewport.
  await page.setViewportSize({ width: 640, height: 360 });
  expect(await noScroll()).toBe(true);
});

test('notes travel to the standard version through sessionStorage', async ({ page }) => {
  await begin(page);
  await page.locator('.obtn[data-id="drain"]').click();
  await page.locator('.obtn[data-id="abdomen"]').click();
  await page.locator('#ready').click();
  await expect(page.locator('#end-notes')).toContainText('The drain bulb holds 120 mL since the last check.');
  expect(JSON.parse(await page.evaluate(() => sessionStorage.getItem('sbar-scene1-notes')))).toEqual(['drain', 'abdomen']);
  await page.locator('#end-continue').click();
  await page.waitForURL(/index\.html\?from=scene1/);
  await expect(page.getByRole('heading', { name: 'Build the call' })).toBeFocused();
  await expect(page.locator('#notes-list-build')).toContainText('The drain bulb holds 120 mL since the last check.');
  await expect(page.locator('#notes-list-build')).toContainText('He tenses when you press near the incision.');
});

test('finishing with nothing examined is allowed and says so gently', async ({ page }) => {
  await begin(page);
  await page.locator('#ready').click();
  await expect(page.locator('#end-none')).toBeVisible();
  await expect(page.locator('#end-none')).toContainText('You did not examine anything');
  await page.locator('#end-back').click();
  await expect(page.locator('#end')).toBeHidden();
  await expect(page.locator('#ready')).toBeFocused();
});

test('the standard version still opens on its intro without the handoff', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});
