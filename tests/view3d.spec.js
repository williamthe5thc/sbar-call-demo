import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scenario } from '../scenario.js';

const HS = scenario.assessment;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const frame = (page) => page.locator('.scene-assess');
const gl = (page) => page.locator('.gl');
const frames = async (page) => Number(await gl(page).getAttribute('data-frames'));
const settle = (page) => page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
const open3d = async (page) => {
  await page.goto('/standard.html');
  await page.getByRole('button', { name: 'Start' }).click();
  // Software WebGL (SwiftShader) blocks the page for a few seconds while the room builds, so wait for it first.
  await expect(frame(page)).toHaveAttribute('data-view', '3d', { timeout: 40000 });
  await expect(page.getByRole('heading', { name: 'Assess the patient' })).toBeFocused();
  await expect(gl(page)).toHaveAttribute('data-cam', 'home');
};
const hs = (page, id) => page.locator(`button[data-id="${id}"]`);

for (const scheme of ['light', 'dark']) {
  test(`axe on the 3D assess step with a panel open, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open3d(page);
    await hs(page, 'drain').click();
    await expect(page.locator('#finding-panel h3')).toHaveText('Surgical drain');
    await expect(gl(page)).toHaveAttribute('data-cam', 'drain');
    await expect(gl(page)).toHaveAttribute('data-moving', 'false', { timeout: 20000 });
    await settle(page);
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
}

test('the canvas is hidden from assistive tech, carries no text and cannot take focus', async ({ page }) => {
  await open3d(page);
  const canvas = page.locator('.gl canvas');
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.gl')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('.gl').evaluate((el) => el.querySelectorAll('button, a, input, [tabindex]').length)).toBe(0);
  expect(await canvas.evaluate((c) => c.getAttribute('tabindex'))).toBeNull();
  // Every finding is still plain HTML outside the canvas.
  await page.getByText('Show all findings as a list').click();
  for (const h of HS) await expect(page.locator('.all-findings')).toContainText(h.findings[0]);
});

test('hotspots are the same buttons, placed inside the scene, and Tab does not move the camera', async ({ page }) => {
  await open3d(page);
  const box = await frame(page).boundingBox();
  const centers = new Set();
  for (const h of HS) {
    const b = hs(page, h.id);
    await expect(b).toHaveAttribute('aria-controls', 'finding-panel');
    expect(await b.evaluate((el) => el.tagName)).toBe('BUTTON');
    expect(await b.evaluate((el) => !!el.closest('.scene-assess'))).toBe(true);
    const r = await b.boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(box.x - 1); expect(r.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(r.x + r.width).toBeLessThanOrEqual(box.x + box.width + 1); expect(r.y + r.height).toBeLessThanOrEqual(box.y + box.height + 1);
    expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
    centers.add(`${Math.round(r.x)},${Math.round(r.y)}`);
  }
  expect(centers.size).toBe(HS.length); // each label has its own place over its object
  // Focus alone never moves the camera; activation does.
  await hs(page, HS[0].id).focus();
  await page.keyboard.press('Tab');
  await expect(hs(page, HS[1].id)).toBeFocused();
  await expect(gl(page)).toHaveAttribute('data-cam', 'home');
  await page.keyboard.press('Enter');
  await expect(gl(page)).toHaveAttribute('data-cam', HS[1].id);
  await expect(hs(page, HS[1].id)).toBeFocused();
});

test('during a close-up every hotspot stays reachable, on screen and not covered', async ({ page }) => {
  await open3d(page);
  await hs(page, 'urine').click();
  await expect(gl(page)).toHaveAttribute('data-cam', 'urine');
  await page.waitForTimeout(1200); // the camera move
  const box = await frame(page).boundingBox();
  for (const h of HS) {
    await hs(page, h.id).focus();
    const ok = await hs(page, h.id).evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el.contains(top) || top === el;
    });
    expect(ok, `${h.label} is covered`).toBe(true);
    const r = await hs(page, h.id).boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(box.x - 1);
    expect(r.x + r.width).toBeLessThanOrEqual(box.x + box.width + 1);
  }
  await expect(gl(page)).toHaveAttribute('data-cam', 'urine'); // focusing did not move the camera
  await page.getByRole('button', { name: 'Back to bedside view' }).click();
  await expect(gl(page)).toHaveAttribute('data-cam', 'home');
  await expect(page.getByRole('button', { name: 'Back to bedside view' })).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Look left' }).click();
  await expect(gl(page)).toHaveAttribute('data-yaw', '-1');
});

test('toggling 2D and 3D keeps the notes and remembers the choice', async ({ page }) => {
  await open3d(page);
  const toggle = page.getByRole('button', { name: '3D view', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await hs(page, 'drain').click();
  await hs(page, 'monitor').click();
  await expect(page.locator('#notes-list li')).toHaveCount(2);
  await toggle.click();
  await expect(frame(page)).toHaveAttribute('data-view', '2d');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#notes-list li')).toHaveCount(2);
  await expect(page.locator('#finding-panel h3')).toHaveText('Monitor');
  await expect(page.locator('.scene-assess > svg')).toBeVisible();
  await expect(page.locator('.gl')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Pause animation' })).toBeHidden();
  await toggle.click();
  await expect(frame(page)).toHaveAttribute('data-view', '3d');
  await expect(page.locator('#notes-list li')).toHaveCount(2);
  // The choice survives a reload.
  await toggle.click();
  await page.reload();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Assess the patient' })).toBeFocused();
  await expect(frame(page)).toHaveAttribute('data-view', '2d');
  await expect(page.getByRole('button', { name: '3D view', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('Pause animation stops the idle animation and Play starts it again', async ({ page }) => {
  await open3d(page);
  const pause = page.getByRole('button', { name: 'Pause animation' });
  await expect(pause).toBeVisible();
  await expect(gl(page)).toHaveAttribute('data-animating', 'true');
  const a = await frames(page);
  await expect.poll(() => frames(page), { timeout: 10000 }).toBeGreaterThan(a); // software WebGL can be slow
  await pause.click();
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await expect(gl(page)).toHaveAttribute('data-animating', 'false');
  await page.waitForTimeout(300);
  const b = await frames(page);
  await page.waitForTimeout(700);
  expect(await frames(page)).toBe(b); // nothing is drawn while paused
  await page.getByRole('button', { name: 'Play animation' }).click();
  await expect.poll(() => frames(page), { timeout: 10000 }).toBeGreaterThan(b);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no idle animation, no view transition, no entrance animation, camera cuts', async ({ page }) => {
    await page.addInitScript(() => {
      window.__vt = 0;
      if (document.startViewTransition) { const f = document.startViewTransition.bind(document); document.startViewTransition = (cb) => { window.__vt += 1; return f(cb); }; }
    });
    await open3d(page);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
    await expect(page.getByRole('button', { name: 'Reduce motion' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
    await expect(gl(page)).toHaveAttribute('data-animating', 'false');
    await page.waitForTimeout(300);
    const a = await frames(page);
    await page.waitForTimeout(700);
    expect(await frames(page)).toBe(a);
    // Camera moves are cuts: one more frame, drawn at once.
    await hs(page, 'drain').click();
    await expect(gl(page)).toHaveAttribute('data-cam', 'drain');
    await expect(gl(page)).toHaveAttribute('data-moving', 'false'); // a cut, not a glide
    expect(await page.evaluate(() => window.__vt)).toBe(0);
    // Feedback entrance animations are off too.
    await page.getByRole('button', { name: 'Continue to build the call' }).click();
    await page.getByRole('button', { name: 'Make the call' }).click();
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeFocused();
    expect(await page.locator('.criteria li').first().evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
    expect(await page.evaluate(() => window.__vt)).toBe(0);
  });
});

test('Reduce motion button: pressed state, saved, turns off transitions and idle animation', async ({ page }) => {
  await page.addInitScript(() => {
    window.__vt = 0;
    if (document.startViewTransition) { const f = document.startViewTransition.bind(document); document.startViewTransition = (cb) => { window.__vt += 1; return f(cb); }; }
  });
  await open3d(page);
  const btn = page.getByRole('button', { name: 'Reduce motion' });
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  const supported = await page.evaluate(() => !!document.startViewTransition);
  if (supported) expect(await page.evaluate(() => window.__vt)).toBeGreaterThan(0); // Start used a view transition
  await expect(gl(page)).toHaveAttribute('data-animating', 'true');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await expect(gl(page)).toHaveAttribute('data-animating', 'false');
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  const before = await page.evaluate(() => window.__vt);
  await page.getByRole('button', { name: 'Continue to build the call' }).click();
  await expect(page.getByRole('heading', { name: 'Build the call' })).toBeFocused();
  expect(await page.evaluate(() => window.__vt)).toBe(before);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reduce motion' })).toHaveAttribute('aria-pressed', 'true');
});

test('feedback entrances are short and staggered', async ({ page }) => {
  await page.goto('/standard.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Continue to build the call' }).click();
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.getByRole('heading', { name: 'Feedback' })).toBeFocused();
  const total = await page.evaluate(() => {
    const ms = (s) => (s.endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000);
    return [...document.querySelectorAll('.criteria li, .bubble')].map((e) => {
      const c = getComputedStyle(e); return ms(c.animationDuration) + ms(c.animationDelay);
    });
  });
  expect(total.length).toBe(5);
  for (const t of total) { expect(t).toBeGreaterThan(0); expect(t).toBeLessThan(1000); }
  expect(new Set(total).size).toBeGreaterThan(1); // staggered
});

test('falls back to 2D with a visible note when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(type)) return null;
      return orig.call(this, type, ...rest);
    };
  });
  await page.goto('/standard.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: 'Assess the patient' })).toBeFocused();
  await expect(frame(page)).toHaveAttribute('data-view', '2d');
  await expect(page.locator('#view-note')).toBeVisible();
  await expect(page.locator('#view-note')).toContainText('2D scene is showing');
  await expect(page.getByRole('button', { name: '3D view', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.scene-assess > svg')).toBeVisible();
  await hs(page, 'drain').click();
  await expect(page.locator('#finding-panel h3')).toHaveText('Surgical drain');
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations).toEqual([]);
});

test('falls back to 2D when the WebGL context is lost', async ({ page }) => {
  await open3d(page);
  await page.locator('.gl canvas').evaluate((c) => c.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(frame(page)).toHaveAttribute('data-view', '2d');
  await expect(page.locator('#view-note')).toContainText('2D scene is showing');
  await hs(page, 'monitor').click();
  await expect(page.locator('#finding-panel h3')).toHaveText('Monitor');
});

test('320px: 3D view keeps the list layout, no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await open3d(page);
  const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await fits();
  expect(await page.locator('.hotspots').evaluate((e) => getComputedStyle(e).position)).toBe('static');
  const c = await page.locator('.gl canvas').boundingBox();
  expect(c.width).toBeGreaterThan(200); expect(c.height).toBeGreaterThan(100);
  for (const h of HS) {
    const r = await hs(page, h.id).boundingBox();
    expect(r.width).toBeGreaterThanOrEqual(24); expect(r.height).toBeGreaterThanOrEqual(24);
    expect(r.x + r.width).toBeLessThanOrEqual(320);
  }
  await hs(page, 'drain').click();
  await expect(gl(page)).toHaveAttribute('data-cam', 'drain');
  await fits();
  await page.getByRole('button', { name: 'Chart', exact: true }).click(); await fits();
  await page.getByText('Show all findings as a list').click(); await fits();
});

test('does not mention the camera or scene as information: findings stay in the panel and notes', async ({ page }) => {
  await open3d(page);
  await hs(page, 'drain').click();
  await expect(page.locator('#finding-panel')).toContainText(HS.find((h) => h.id === 'drain').findings[0]);
  await expect(page.locator('#notes-list')).toContainText('Surgical drain');
  await expect(page.locator('#live')).toContainText('Added to your notes');
});

test('with motion allowed the camera glides to the object, then rests', async ({ page }) => {
  await open3d(page);
  // Click inside the page so nothing can finish before we look.
  const moving = await page.evaluate(() => { document.querySelector('button[data-id="monitor"]').click(); return document.querySelector('.gl').dataset.moving; });
  expect(moving).toBe('true');
  await gl(page).scrollIntoViewIfNeeded(); // opening a panel can scroll the scene away, and off-screen scenes pause by design
  await expect(gl(page)).toHaveAttribute('data-moving', 'false', { timeout: 20000 });
  await expect(gl(page)).toHaveAttribute('data-cam', 'monitor');
});
