// Mega run phase 5d (D-194): the launch list end to end, against a mocked
// endpoint. No request ever leaves the page: Playwright intercepts the
// Supabase function URL and answers 204 for the success path and 500 for
// the failure path. The page must show its success sentence on 204 and
// its honest failure sentence on 500 (the launch-list function returns 500
// when its table cannot record the row, and the page must say nothing was
// saved rather than imply success).
//
//   BASE_URL=http://localhost:5173 npx playwright test tests/launch-list.spec.js
//
// Run against the Vite dev server (playwright.config.js starts it) or set
// BASE_URL to a static server rooted at public/.
import { test, expect } from '@playwright/test';

const ENDPOINT = 'https://czrehjybsqzmudtgneqy.supabase.co/functions/v1/launch-list';
const RECEIVED = 'Your launch-list request was received.';
const FAILED = 'The launch list could not record your address. Nothing was saved. Try again later.';
const TEST_ADDRESS = 'launch-test+playwright@algorithmlens.com';

// The landing is public/index.html: the Vite dev server serves it at
// /index.html (nothing at the bare root), and the live site answers
// /index.html with a redirect to /, which Playwright follows.
const LANDING = '/index.html';

async function fillAndSubmit(page) {
  await page.goto(LANDING);
  await page.locator('#email').fill(TEST_ADDRESS);
  await page.locator('#consent').check();
  await page.locator('#launchForm button[type="submit"]').click();
}

test.describe('the launch list form against a mocked endpoint', () => {
  test('a 204 from the endpoint shows the success sentence and resets the form', async ({ page }) => {
    const bodies = [];
    await page.route(ENDPOINT, async (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    });
    await fillAndSubmit(page);
    await expect(page.locator('#formStatus')).toHaveText(RECEIVED);
    expect(bodies).toHaveLength(1);
    expect(bodies[0].email).toBe(TEST_ADDRESS);
    expect(bodies[0].consent).toBe(true);
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#consent')).not.toBeChecked();
  });

  test('a 500 from the endpoint shows the honest failure sentence and keeps the address', async ({ page }) => {
    await page.route(ENDPOINT, (route) =>
      route.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: 'error' }),
    );
    await fillAndSubmit(page);
    await expect(page.locator('#formStatus')).toHaveText(FAILED);
    await expect(page.locator('#email')).toHaveValue(TEST_ADDRESS);
  });

  test('without consent nothing is sent', async ({ page }) => {
    let requests = 0;
    await page.route(ENDPOINT, (route) => {
      requests += 1;
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    });
    await page.goto(LANDING);
    await page.locator('#email').fill(TEST_ADDRESS);
    await page.locator('#launchForm button[type="submit"]').click();
    await page.waitForTimeout(300);
    expect(requests).toBe(0);
  });
});
