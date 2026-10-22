import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { scenario } from '../scenario.js';

// Software WebGL (SwiftShader) is slow, so every test gets plenty of time.
test.setTimeout(120000);

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const ids = (key, only) => scenario.sections.find((s) => s.key === key).statements.filter(only).map((s) => s.id);
const REQUIRED = 'SBAR'.split('').flatMap((k) => ids(k, (s) => s.kind === 'required'));
const FAILING = ['s1', 's4', 'b1', 'a1', 'r4']; // opens correctly, but misses items, adds noise and has no request

async function load(page) {
  await page.goto('/scene1.html');
  await expect(page.locator('body')).toHaveAttribute('data-world', 'ready', { timeout: 90000 });
  await expect(page.locator('#start-btn')).not.toHaveAttribute('aria-disabled', 'true');
}
const settle = (page) => page.waitForFunction(() => document.querySelector('#view').dataset.moving === 'false', null, { timeout: 30000 });
async function axe(page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
}
async function tabTo(page, sel, max = 120) {
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((s) => document.activeElement && document.activeElement.matches(s), sel)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not Tab to ${sel}`);
}
const phase = (page, p, timeout = 60000) => expect(page.locator('body')).toHaveAttribute('data-phase', p, { timeout });

// Scene 1 start to the nurses' station (the walk is a cut under reduced motion).
async function toStation(page) {
  await load(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#scene-heading')).toBeFocused();
  await page.locator('#ready').click();
  await expect(page.locator('#end')).toBeVisible();
  await page.locator('#end-walk').click();
  await phase(page, 'station');
}
async function toPhone(page) {
  await toStation(page);
  await page.locator('#pickup').click();
  await expect(page.locator('#phone-title')).toBeFocused();
}
const choose = async (page, list) => { for (const id of list) await page.locator(`#cb-${id}`).check(); };
async function makeCall(page, list) {
  await choose(page, list);
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('#call-title')).toBeFocused();
}
const mockSpeech = () => {
  window.__spoken = [];
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function (text) { this.text = text; } });
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
    speak(u) { window.__spoken.push(u.text); setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => u.onend && u.onend({}), 20); }, 0); },
    cancel() {}, getVoices() { return []; },
  } });
};
async function showAllAndFeedback(page) {
  await page.locator('#cap-all').click();
  await expect(page.locator('#cap-see')).toBeVisible();
  await page.locator('#cap-see').click();
  await expect(page.locator('#fb-title')).toBeFocused();
}

for (const scheme of ['light', 'dark']) {
  test(`axe: station, phone notepad, captions, failing feedback and mastery, ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await toStation(page);
    await expect(page.locator('#scene-heading')).toHaveText('Scene 2: the call');
    await axe(page); // the nurses' station
    await page.locator('#pickup').click();
    await expect(page.locator('#phone-title')).toBeFocused();
    await axe(page); // phone notepad (notes and chart in the side section)
    await page.locator('#ref-chart-body').locator('xpath=ancestor::details').locator('summary').click();
    await choose(page, FAILING);
    await page.getByRole('button', { name: 'Make the call' }).click();
    await expect(page.locator('#call-title')).toBeFocused();
    await expect(page.locator('#tx-list .line')).toHaveCount(1);
    await axe(page); // captions playing
    await showAllAndFeedback(page);
    await expect(page.locator('#fb-list .badge.notyet').first()).toBeVisible();
    await axe(page); // feedback, failing
    await page.locator('#fb-retry').click();
    await expect(page.locator('#phone-title')).toBeFocused();
    for (const id of FAILING) await page.locator(`#cb-${id}`).uncheck();
    await choose(page, REQUIRED);
    await page.getByRole('button', { name: 'Make the call' }).click();
    await showAllAndFeedback(page);
    await page.locator('#fb-continue').click();
    await expect(page.locator('#ms-title')).toBeFocused({ timeout: 90000 });
    await axe(page); // evidence of mastery
  });
}

test('keyboard only: scene 1 start, call fails, retry, mastery', async ({ page }) => {
  await load(page);
  await tabTo(page, '#start-btn');
  await page.keyboard.press('Enter');
  await expect(page.locator('#scene-heading')).toBeFocused();
  await tabTo(page, '#ready'); await page.keyboard.press('Enter');
  await expect(page.locator('#end-title')).toBeFocused();
  await tabTo(page, '#end-walk'); await page.keyboard.press('Enter');
  await expect(page.locator('#scene-heading')).toBeFocused();
  await expect(page.locator('#caption')).toHaveText("Walking to the nurses' station");
  await phase(page, 'station');
  await expect(page.locator('#caption')).toContainText("You are at the nurses' station");
  await tabTo(page, '[data-spot="phone"]'); await page.keyboard.press('Enter');
  await settle(page);
  await tabTo(page, '#pickup'); await page.keyboard.press('Enter');
  await expect(page.locator('#phone-title')).toBeFocused();
  // a failing first attempt: tick with the keyboard
  for (const id of FAILING) { await tabTo(page, `#cb-${id}`); await page.keyboard.press('Space'); }
  await tabTo(page, 'button[data-act="down"]'); // Move down reorders without losing focus
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement.dataset.act)).toBe('down');
  await tabTo(page, '#call-form button[type="submit"]'); await page.keyboard.press('Enter');
  await expect(page.locator('#call-title')).toBeFocused();
  await tabTo(page, '#cap-all'); await page.keyboard.press('Enter');
  await tabTo(page, '#cap-see'); await page.keyboard.press('Enter');
  await expect(page.locator('#fb-title')).toBeFocused();
  await expect(page.locator('#fb-attempt')).toContainText('Attempt 1');
  await tabTo(page, '#fb-retry'); await page.keyboard.press('Enter');
  await expect(page.locator('#phone-title')).toBeFocused();
  await expect(page.locator('#cb-s1')).toBeChecked(); // "Hang up and try again" keeps the selections
  for (const id of FAILING) { await tabTo(page, `#cb-${id}`); await page.keyboard.press('Space'); }
  for (const id of REQUIRED) { await tabTo(page, `#cb-${id}`); await page.keyboard.press('Space'); }
  await tabTo(page, '#call-form button[type="submit"]'); await page.keyboard.press('Enter');
  await tabTo(page, '#cap-all'); await page.keyboard.press('Enter');
  await tabTo(page, '#cap-see'); await page.keyboard.press('Enter');
  await expect(page.locator('#fb-continue')).toBeVisible();
  await tabTo(page, '#fb-continue'); await page.keyboard.press('Enter');
  await expect(page.locator('#ms-title')).toBeFocused({ timeout: 90000 });
  await expect(page.locator('#ms-history')).toContainText('1 of 4');
  await expect(page.locator('#ms-history')).toContainText('4 of 4');
  await tabTo(page, '#reflection');
  await expect(page.locator('#ms-standard')).toHaveAttribute('href', 'index.html');
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
});

test('captions advance by themselves; Pause and Next work; the whole transcript stays', async ({ page }) => {
  await toPhone(page);
  await makeCall(page, ['s1', 's2', 'b1', 'a1', 'r1', 'r3']);
  const lines = page.locator('#tx-list .line');
  await expect(lines).toHaveCount(1);
  await expect(page.locator('#tx-status')).toContainText('Caption 1 of 7');
  // The first caption is a long sentence: it is not replaced before about 250 ms per word have passed.
  const words = (await lines.first().innerText()).split(/\s+/).length;
  const t0 = Date.now();
  await expect(lines).toHaveCount(2, { timeout: 20000 });
  expect(Date.now() - t0).toBeGreaterThan(Math.min(words * 250, 2500) - 900);
  // Pause: nothing more appears.
  await page.locator('#cap-pause').click();
  await expect(page.locator('#cap-pause')).toHaveText('Resume captions');
  await page.waitForTimeout(3500);
  await expect(lines).toHaveCount(2);
  // Next shows the next caption even while paused.
  await page.locator('#cap-next').click();
  await expect(lines).toHaveCount(3);
  for (let i = 3; i < 7; i++) await page.locator('#cap-next').click(); // still paused
  await page.waitForTimeout(300);
  await expect(lines).toHaveCount(7);
  // The provider replies in captions, with the mood on the portrait and in words.
  await expect(lines.last()).toContainText('Provider:');
  await expect(page.locator('#call-mood')).toContainText(/The provider sounds (unsure|confused|calm)/);
  await expect(page.locator('#callcard')).toHaveAttribute('data-provider-mood', /.+/);
  await expect(page.locator('#callcard')).toContainText('On-call provider');
  await expect(page.locator('#call-timer')).toHaveAttribute('aria-hidden', 'true');
  // The last caption is shown; Next has nothing further, so the call ends and "See feedback" appears.
  await page.locator('#cap-pause').click();
  await page.locator('#cap-next').click();
  await expect(page.locator('#cap-see')).toBeVisible();
  // Next had focus and is now hidden, so focus moves to See feedback instead of falling to the page.
  await expect(page.locator('#cap-see')).toBeFocused();
  await expect(lines).toHaveCount(7);
  await expect(page.locator('#tx-list')).toContainText('Please come to the bedside to evaluate him.');
  await expect(page.locator('#tx-status')).toContainText('The whole transcript is above.');
});

test('the unsure provider shows the mood in words', async ({ page }) => {
  await toPhone(page);
  await makeCall(page, REQUIRED.filter((id) => id !== 'r3')); // 3 of 4 met: "unsure"
  await page.locator('#cap-all').click();
  await expect(page.locator('#call-mood')).toHaveText(/The provider sounds unsure/);
  await expect(page.locator('#callcard')).toHaveAttribute('data-provider-mood', 'unsure');
});

test('voice is off by default and nothing is spoken unless the learner turns it on', async ({ page }) => {
  await page.addInitScript(mockSpeech);
  await toPhone(page);
  await makeCall(page, ['s1', 'b1', 'a1', 'r1']);
  await expect(page.locator('#cap-voice')).toHaveText('Voice: off');
  await page.locator('#cap-next').click();
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0);
  await page.locator('#cap-all').click();
  await expect(page.locator('#cap-see')).toBeVisible();
  expect(await page.evaluate(() => window.__spoken.length)).toBe(0); // captions are always shown, never spoken by themselves
  // Second call with the voice on.
  await page.locator('#cap-see').click();
  await page.locator('#fb-retry').click();
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('#call-title')).toBeFocused();
  await page.locator('#cap-voice').click();
  await expect(page.locator('#cap-voice')).toHaveText('Voice: on');
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__spoken[0])).toContain('Nurse.');
  await page.locator('#cap-voice').click();
  await expect(page.locator('#cap-voice')).toHaveText('Voice: off');
});

test('reduced motion: the walk is a cut and all captions appear at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page);
  await page.locator('#start-btn').click();
  await page.locator('#ready').click();
  await page.locator('#end-walk').click();
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'station', { timeout: 3000 }); // no walk to wait for
  await expect(page.locator('#view')).toHaveAttribute('data-moving', 'false');
  await expect(page.locator('#view')).toHaveAttribute('data-spot', 'station');
  await page.locator('#pickup').click();
  await makeCall(page, ['s1', 's2', 'b1', 'a1', 'r1', 'r3']);
  await expect(page.locator('#tx-list .line')).toHaveCount(7); // everything at once
  await expect(page.locator('#cap-pause')).toBeHidden();
  await expect(page.locator('#cap-see')).toBeVisible();
  await page.locator('#cap-see').click();
  await page.locator('#fb-retry').click();
  await choose(page, REQUIRED.filter((id) => !['s1', 's2', 'b1', 'a1', 'r1', 'r3'].includes(id)));
  await page.getByRole('button', { name: 'Make the call' }).click();
  await page.locator('#cap-see').click();
  await page.locator('#fb-continue').click();
  await expect(page.locator('#ms-title')).toBeFocused({ timeout: 10000 }); // the camera cut back and the provider is at the door
});

test('the walk to the station takes time with motion on, and Skip walk cuts it', async ({ page }) => {
  await load(page);
  await page.locator('#start-btn').click();
  await page.locator('#ready').click();
  await page.locator('#end-walk').click();
  await expect(page.locator('#caption')).toHaveText("Walking to the nurses' station");
  await expect(page.locator('#view')).toHaveAttribute('data-moving', 'true');
  await page.locator('#skip-walk').click();
  await phase(page, 'station', 5000);
  expect((await page.locator('#view').getAttribute('data-spot'))).toBe('station');
});

test('Go to buttons in scene 2, markers and the phone: three ways to pick it up', async ({ page }) => {
  await toStation(page);
  await expect(page.locator('#goto-list [data-spot]')).toHaveText(['Room 12 doorway', 'Hallway', "Nurses' station", 'Phone']);
  for (const id of ['room12', 'hall', 'phone']) { await page.locator(`#goto-list [data-spot="${id}"]`).click(); await settle(page); await expect(page.locator('#view')).toHaveAttribute('data-spot', id); }
  await expect.poll(() => page.locator('.hs[data-id="phone"]').getAttribute('data-show'), { timeout: 15000 }).toBe('true');
  await page.locator('.hs[data-id="phone"]').click(); // the marker
  await expect(page.locator('#phone-title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pickup')).toBeFocused();
});

test('Escape closes the topmost non-essential overlay and returns focus to its opener', async ({ page }) => {
  await toStation(page);
  await page.locator('#help-open').click();
  await expect(page.locator('#help-title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-open')).toBeFocused();
  await page.locator('#pickup').click();
  await expect(page.locator('#phone')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#phone')).toBeHidden();
  await expect(page.locator('#pickup')).toBeFocused();
  // The call itself is an essential step: Escape does not close it.
  await page.locator('#pickup').click();
  await makeCall(page, FAILING);
  await page.keyboard.press('Escape');
  await expect(page.locator('#call')).toBeVisible();
});

test('Escape closes Objects nearby and Notes in scene 1 and returns focus to their buttons', async ({ page }) => {
  await load(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#objects-btn')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#notes-btn')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#objects-btn').click();
  await page.locator('#notes-btn').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#notes-btn')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#notes-btn')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#objects-btn')).toBeFocused();
});

test('Objects nearby is a compact toggle, collapsed by default, with the count', async ({ page }) => {
  await load(page);
  await page.locator('#start-btn').click();
  await expect(page.locator('#objects-btn')).toHaveText(`Objects nearby (${scenario.assessment.length})`);
  await expect(page.locator('#objects-btn')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#objects-body')).toBeHidden();
  const w = await page.locator('#objects-btn').evaluate((b) => b.getBoundingClientRect().width);
  expect(w).toBeLessThan(220);
});

test('scoring parity: the standard and immersive versions give identical results', async ({ page }) => {
  const sets = [FAILING, REQUIRED, REQUIRED.filter((id) => id !== 'r3'), ['s4', 'b4', 'a4', 'r5'], []];
  const readStd = async (list) => {
    await page.goto('/index.html');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Continue to build the call' }).click();
    for (const id of list) await page.locator(`#cb-${id}`).check();
    await page.getByRole('button', { name: 'Make the call' }).click();
    await expect(page.getByRole('heading', { name: 'Feedback' })).toBeFocused();
    return page.evaluate(() => ({
      attempt: document.querySelector('.step-note').textContent.trim(),
      mood: document.querySelector('.provider-card .mood').textContent.trim(),
      reply: document.querySelector('.provider-card .bubble').textContent.trim(),
      criteria: [...document.querySelectorAll('.criteria li')].map((li) => ({
        name: li.querySelector('h4').firstChild.textContent.trim(),
        badge: li.querySelector('.badge').textContent.replace(/[✓✗]/g, '').trim(),
        paras: [...li.querySelectorAll('p')].map((p) => p.textContent.trim()),
      })),
    }));
  };
  const standard = [];
  for (const list of sets) standard.push(await readStd(list));
  await toPhone(page);
  for (let n = 0; n < sets.length; n++) {
    if (n) { await page.locator('#fb-retry').click(); for (const id of Object.values(scenario.sections).flatMap((s) => s.statements.map((x) => x.id))) await page.locator(`#cb-${id}`).uncheck(); }
    await choose(page, sets[n]);
    await page.getByRole('button', { name: 'Make the call' }).click();
    await page.locator('#cap-all').click();
    await page.locator('#cap-see').click();
    await expect(page.locator('#fb-title')).toBeFocused();
    const imm = await page.evaluate(() => ({
      attempt: document.querySelector('#fb-attempt').textContent.trim(),
      mood: document.querySelector('#fb-reply strong').textContent.trim(),
      reply: document.querySelector('#fb-reply .bubble').textContent.trim(),
      criteria: [...document.querySelectorAll('#fb-list li')].map((li) => ({
        name: li.querySelector('h4').firstChild.textContent.trim(),
        badge: li.querySelector('.badge').textContent.replace(/[✓✗]/g, '').trim(),
        paras: [...li.querySelectorAll('p')].map((p) => p.textContent.trim()),
      })),
    }));
    expect(imm.criteria).toEqual(standard[n].criteria);
    expect(imm.reply).toBe(standard[n].reply);
    expect(imm.mood).toBe(standard[n].mood);
    expect(imm.attempt).toContain(standard[n].attempt.replace(/^Attempt \d+: /, ''));
    if (sets[n] === REQUIRED) break;
  }
});

test('320 px: no horizontal scroll at the station, the notepad, the call and the feedback', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= document.body.clientWidth
    && [...document.querySelectorAll('.sheet')].every((s) => s.scrollWidth <= s.clientWidth + 1 || s.closest('[hidden]')));
  await toStation(page);
  expect(await noScroll()).toBe(true);
  await page.locator('#pickup').click();
  expect(await noScroll()).toBe(true);
  await makeCall(page, FAILING);
  expect(await noScroll()).toBe(true);
  await page.locator('#cap-all').click(); await page.locator('#cap-see').click();
  expect(await noScroll()).toBe(true);
  await axe(page);
});

test('phone notepad screenshot size check at 390 x 844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await toPhone(page);
  const r = await page.locator('#phone .sheet').evaluate((s) => ({ sw: s.scrollWidth, cw: s.clientWidth }));
  expect(r.sw).toBeLessThanOrEqual(r.cw + 1);
});
