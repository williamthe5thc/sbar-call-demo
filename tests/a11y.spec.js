import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scenario } from '../scenario.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const scan = async (page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
};
const ids = (key, only) =>
  scenario.sections.find((s) => s.key === key).statements.filter(only).map((s) => s.id);
const pick = async (page, list) => { for (const id of list) await page.locator(`#cb-${id}`).check(); };
const required = (key) => ids(key, (s) => s.kind === 'required');
const passing = async (page) => { for (const k of 'SBAR') await pick(page, required(k)); };
const toBuild = async (page) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Continue to build the call' }).click();
};
const HS = scenario.assessment;
const mockSpeech = () => {
  window.__spoken = []; window.__cancels = 0;
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function (text) { this.text = text; } });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    speak(u) { window.__spoken.push(u); setTimeout(() => u.onstart && u.onstart({}), 0); },
    cancel() { window.__cancels += 1; },
    getVoices() { return []; },
  } });
};

for (const scheme of ['light', 'dark']) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test('every step', async ({ page }) => {
      await page.goto('/index.html');
      await scan(page); // intro
      await page.getByRole('button', { name: 'Start' }).click();
      await scan(page); // assess, no panel
      await page.getByRole('button', { name: 'Surgical drain' }).click();
      await scan(page); // assess, panel open
      await page.getByRole('button', { name: 'Monitor' }).click();
      await scan(page); // monitor panel
      await page.getByRole('button', { name: 'Chart' }).click();
      await scan(page); // chart panel
      await page.getByText('Show all findings as a list').click();
      await scan(page); // all findings open
      await page.getByRole('button', { name: 'Continue to build the call' }).click();
      await page.getByText('View chart').click();
      await pick(page, ['s4', 's1', 'r4']); // some picks so the ordered list renders
      await scan(page); // build
      await page.getByRole('button', { name: 'Make the call' }).click();
      await expect(page.getByRole('heading', { name: 'Feedback' })).toBeFocused();
      await scan(page); // feedback after failing attempt
      await page.getByRole('button', { name: 'Try again' }).click();
      await page.locator('#cb-s4').uncheck();
      await page.locator('#cb-r4').uncheck();
      for (const k of 'SBAR') for (const id of required(k)) if (!(await page.locator(`#cb-${id}`).isChecked())) await page.locator(`#cb-${id}`).check();
      await page.getByRole('button', { name: 'Make the call' }).click();
      await page.getByRole('button', { name: 'See your evidence of mastery' }).click();
      await expect(page.getByRole('heading', { name: 'Evidence of mastery' })).toBeFocused();
      await scan(page); // mastery
    });
  });
}

test('selections survive Try again, reply branches', async ({ page }) => {
  await toBuild(page);
  await pick(page, ['s4']);
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('.transcript')).toContainText("I'm not sure what you need from me");
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('#cb-s4')).toBeChecked();
  await expect(page).toHaveTitle(/Build the call/);
});

test('move buttons keep focus and announce position', async ({ page }) => {
  await toBuild(page);
  await pick(page, ['s1', 's2']);
  const down = page.getByRole('button', { name: /^Move down: This is the night nurse/ });
  await down.focus();
  await page.keyboard.press('Enter');
  await expect(down).toBeFocused();
  await expect(page.locator('#live')).toContainText('position 2 of 2 in Situation');
});

test('keyboard only: complete to mastery', async ({ page }) => {
  await page.goto('/index.html');
  const tabTo = async (locator) => {
    for (let i = 0; i < 80; i++) {
      if (await locator.evaluate((el) => el === document.activeElement).catch(() => false)) return;
      await page.keyboard.press('Tab');
    }
    throw new Error('could not reach target by Tab');
  };
  await tabTo(page.getByRole('button', { name: 'Start' }));
  await page.keyboard.press('Enter');
  // Tab order is the data order; Enter opens each hotspot and the notes grow.
  await page.keyboard.press('Tab');
  for (let i = 0; i < HS.length; i++) {
    await expect(page.getByRole('button', { name: HS[i].label, exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: HS[i].label, exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: HS[i].label, exact: true })).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#notes-list li')).toHaveCount(i + 1);
    await expect(page.locator('#live')).toContainText('Added to your notes');
    if (i < HS.length - 1) await page.keyboard.press('Tab');
  }
  await tabTo(page.getByRole('button', { name: 'Continue to build the call' }));
  await page.keyboard.press('Enter');
  await expect(page.locator('#notes-list-build li')).toHaveCount(HS.length);
  for (const k of 'SBAR') {
    for (const id of required(k)) {
      await tabTo(page.locator(`#cb-${id}`));
      await page.keyboard.press('Space');
    }
  }
  await tabTo(page.getByRole('button', { name: 'Make the call' }));
  await page.keyboard.press('Enter');
  await tabTo(page.getByRole('button', { name: 'See your evidence of mastery' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Evidence of mastery' })).toBeFocused();
  await expect(page.getByText('4 of 4')).toBeVisible();
  await tabTo(page.getByRole('button', { name: 'Start over' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeFocused();
});

test('reflows at 320px on every step', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const fits = async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/index.html'); await fits();
  await page.getByRole('button', { name: 'Start' }).click(); await fits();
  expect(await page.locator('.hotspots').evaluate((e) => getComputedStyle(e).position)).toBe('static'); // list layout
  for (const h of HS) {
    const box = await page.getByRole('button', { name: h.label, exact: true }).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(24); expect(box.height).toBeGreaterThanOrEqual(24);
  }
  await page.getByRole('button', { name: 'Chart' }).click(); await fits();
  await page.getByText('Show all findings as a list').click(); await fits();
  await page.getByRole('button', { name: 'Continue to build the call' }).click(); await fits();
  for (const k of 'SBAR') await pick(page, required(k));
  await fits();
  await page.getByRole('button', { name: 'Make the call' }).click(); await fits();
  await page.getByRole('button', { name: 'See your evidence of mastery' }).click(); await fits();
});

test('runs inside an iframe', async ({ page }) => {
  await page.goto('/tests/iframe.html');
  const f = page.frameLocator('iframe');
  await f.getByRole('button', { name: 'Start' }).click();
  await f.getByRole('button', { name: 'Continue to build the call' }).click();
  await passing(f);
  await expect(f.getByRole('heading', { name: 'Build the call' })).toBeVisible();
});

test('illustrations: decorative SVGs are hidden, monitor is named, provider mood follows outcome', async ({ page }) => {
  const decorativeOk = async () => {
    const bad = await page.locator('#app svg:not([role="img"])').evaluateAll((els) =>
      els.filter((e) => e.getAttribute('aria-hidden') !== 'true' || e.getAttribute('focusable') !== 'false').length);
    expect(bad).toBe(0);
  };
  await page.goto('/index.html');
  await expect(page.locator('#app svg[aria-hidden="true"]')).toHaveCount(1); // intro
  await decorativeOk();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('#app svg[aria-hidden="true"]')).toHaveCount(1); // bedside scene
  await decorativeOk();
  await page.getByRole('button', { name: 'Monitor' }).click();
  const monitor = page.locator('#app svg[role="img"]');
  await expect(monitor).toHaveAttribute('aria-label', /112/);
  await expect(monitor).toHaveAttribute('aria-label', /92\/54/);
  await expect(monitor.locator('text', { hasText: '112' }).first()).toBeVisible(); // real text
  await expect(page.locator('#app .scene.monitor')).toContainText('PLACEHOLDER');
  await page.getByRole('button', { name: 'Chart' }).click();
  await expect(page.getByRole('table')).toBeVisible(); // full table kept in the chart panel
  await page.getByRole('button', { name: 'Continue to build the call' }).click();
  await decorativeOk();
  await expect(page.locator('#app svg[aria-hidden="true"]')).toHaveCount(1); // station
  // 0 met -> confused
  await pick(page, ['s4']);
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('[data-provider-mood]').first()).toHaveAttribute('data-provider-mood', 'confused');
  await expect(page.locator('.mood')).toContainText('sounds confused');
  await decorativeOk();
  // all met -> calm
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.locator('#cb-s4').uncheck();
  await passing(page);
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('[data-provider-mood]').first()).toHaveAttribute('data-provider-mood', 'calm');
  await expect(page.locator('.mood')).toContainText('sounds calm');
  await page.getByRole('button', { name: 'See your evidence of mastery' }).click();
  await decorativeOk();
  await expect(page.locator('#app svg[aria-hidden="true"]')).toHaveCount(1);
});

test('provider is unsure when two or three criteria are met', async ({ page }) => {
  await toBuild(page);
  await passing(page);
  // add a distractor so Prioritization fails: 3 of 4 met
  const distractor = ids('S', (s) => s.kind === 'distractor' && !s.belongsIn)[0];
  await pick(page, [distractor]);
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('[data-provider-mood]').first()).toHaveAttribute('data-provider-mood', 'unsure');
  await expect(page.locator('.mood')).toContainText('unsure');
});

test('hotspots: names match labels, panel wiring, notes, all-findings list', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('#none-note')).toBeVisible();
  const drain = page.getByRole('button', { name: 'Surgical drain', exact: true });
  await expect(drain).toHaveAttribute('aria-controls', 'finding-panel');
  await expect(page.locator('#finding-panel')).toHaveAttribute('aria-live', 'off');
  for (const h of HS) {
    const b = page.getByRole('button', { name: h.label, exact: true });
    const box = await b.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    expect(await b.innerText()).toBe(h.label); // visible label = accessible name
  }
  await drain.click();
  await expect(drain).toBeFocused();
  await expect(page.locator('#finding-panel h3')).toHaveText('Surgical drain');
  await expect(page.locator('#live')).toContainText('Surgical drain: ' + HS.find((h) => h.id === 'drain').findings[0]);
  await expect(page.locator('#none-note')).toBeHidden();
  await page.getByRole('button', { name: 'Dressing', exact: true }).click();
  await expect(drain).not.toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#notes-list li')).toHaveCount(2);
  await page.getByText('Show all findings as a list').click();
  for (const h of HS) await expect(page.locator('.all-findings')).toContainText(h.findings[0]);
});

test('read aloud: highlights each sentence, toggles label, stops on step change', async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Surgical drain', exact: true }).click();
  const drain = HS.find((h) => h.id === 'drain');
  const read = page.locator('#finding-panel').getByRole('button', { name: 'Read aloud' });
  await read.click();
  await expect(page.locator('#finding-panel .reading')).toHaveText(drain.findings[0]);
  await expect(page.locator('#finding-panel').getByRole('button', { name: 'Stop reading' })).toBeVisible();
  await page.evaluate(() => window.__spoken[0].onend());
  await expect(page.locator('#finding-panel .reading')).toHaveText(drain.findings[1]);
  // starting another reader stops this one
  await page.getByRole('button', { name: 'Read aloud' }).first().click();
  await expect(page.locator('#finding-panel').getByRole('button', { name: 'Read aloud' })).toBeVisible();
  await expect(page.locator('#notes-list .reading')).toHaveCount(1);
  await page.getByRole('button', { name: 'Stop reading' }).click();
  await expect(page.locator('.reading')).toHaveCount(0);
  await read.click();
  await page.getByRole('button', { name: 'Continue to build the call' }).click();
  await expect(page.locator('.reading')).toHaveCount(0);
  expect(await page.evaluate(() => window.__cancels)).toBeGreaterThan(0);
  // SBAR fieldset reader
  await page.locator('#fs-S').getByRole('button', { name: 'Read aloud' }).click();
  await expect(page.locator('#fs-S .reading')).toHaveCount(1);
});

test('read aloud buttons are hidden when speech is unsupported', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true }); });
  await page.goto('/index.html');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Chart', exact: true }).click();
  await expect(page.getByRole('button', { name: /Read aloud/ })).toHaveCount(0);
});
