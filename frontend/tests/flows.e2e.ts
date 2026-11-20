import { test, expect, type Page } from '@playwright/test';
async function login(page: Page, identifier: string, password: string, next = '/my') {
  await page.goto('/login?next=' + encodeURIComponent(next));
  await page.getByLabel('Email or username').fill(identifier);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
test('desktop discovery, RSVP, saved gathering and cancellation', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '198.51.100.11' });
  const username = 'member_' + Date.now();
  await page.request.post('/api/auth/sign-up/email', {
    headers: { Origin: 'http://localhost:3001', 'X-Forwarded-For': '198.51.100.12' },
    data: {
      username,
      name: 'Jamie Member',
      email: `${username}@example.com`,
      password: 'MemberTest2026!',
    },
  });
  await page.request.post('/api/auth/sign-out', {
    headers: { Origin: 'http://localhost:3001' },
    data: {},
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your people. Your city. Your third place.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.goto('/discover');
  await page.getByLabel('Search gatherings').fill('Between the covers');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Between the covers', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('1 gatherings to make room for')).toBeVisible();
  await login(page, username, 'MemberTest2026!', '/events/coffee-club');
  await page.getByRole('button', { name: 'Count me in' }).click();
  await expect(page.getByText('You’re on the list!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save for later', exact: true }).click();
  await page.getByRole('link', { name: 'View my plans' }).click();
  await expect(page.getByRole('heading', { name: 'A little walk. A good coffee.' })).toBeVisible();
  await page.getByRole('button', { name: 'Saved gatherings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little walk. A good coffee.' })).toBeVisible();
  await page.getByRole('button', { name: 'Unsave A little walk. A good coffee.' }).click();
  await expect(page.getByText('A few possibilities for later.')).toBeVisible();
  await page.getByRole('button', { name: 'My plans', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel RSVP', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, confirm' }).click();
  await expect(page.getByText('Your calendar has a little room.')).toBeVisible();
  expect(errors).toEqual([]);
});
test('business signup → venue approval → draft → publication → check-in', async ({ browser }) => {
  const hostContext = await browser.newContext({
    extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.21' },
  });
  const host = await hostContext.newPage();
  const adminContext = await browser.newContext({
    extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.22' },
  });
  const admin = await adminContext.newPage();
  const memberContext = await browser.newContext({
    extraHTTPHeaders: { 'X-Forwarded-For': '198.51.100.23' },
  });
  const member = await memberContext.newPage();
  const suffix = Date.now().toString().slice(-8);
  const venueName = `Neighbourhood Studio ${suffix}`,
    eventName = `A creative hello ${suffix}`;
  await host.goto('/signup?next=/business/apply');
  await host.getByLabel('Your name').fill('Taylor Host');
  await host.getByLabel('Username', { exact: true }).fill('host_' + suffix);
  await host.getByLabel('Email address').fill(`host_${suffix}@example.com`);
  await host.getByLabel('Password', { exact: true }).fill('HostTest2026!');
  await host.getByRole('checkbox').check();
  await host.getByRole('button', { name: 'Let’s get started' }).click();
  await expect(host.getByRole('heading', { name: 'Tell us about your place.' })).toBeVisible();
  await host.getByLabel('Venue name').fill(venueName);
  await host.getByLabel('Street address').fill('14 Test Street, Gardens');
  await host
    .getByLabel('Tell us about your place')
    .fill('A welcoming creative space where neighbours can make things and meet each other.');
  await host.getByRole('checkbox').check();
  await host.getByRole('button', { name: 'Submit my place' }).click();
  await expect(host.getByText('Your venue application is being reviewed.')).toBeVisible();
  await login(admin, 'admin', '123', '/admin');
  let row = admin.locator('.review-card').filter({ hasText: venueName });
  await row.getByRole('button', { name: 'Review place' }).click();
  await admin.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(admin.getByRole('dialog')).not.toBeVisible();
  await host.reload();
  await host.getByRole('button', { name: 'Create a gathering', exact: true }).first().click();
  await host.getByLabel('Gathering title').fill(eventName);
  await host
    .getByRole('combobox', { name: 'Category', exact: true })
    .selectOption('Arts & culture');
  const date = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) + 'T14:00';
  await host.getByLabel('Date and start time').fill(date);
  await host
    .getByLabel('What’s the plan?')
    .fill(
      'Join us for a relaxed and welcoming creative afternoon. All materials are included and no experience is needed.',
    );
  await host.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(host.getByText('Draft', { exact: true })).toBeVisible();
  await host.getByRole('button', { name: 'Edit / submit' }).click();
  await host.getByRole('button', { name: 'Submit for review' }).click();
  await expect(host.getByText('Awaiting review', { exact: true })).toBeVisible();
  await admin.reload();
  row = admin.locator('.review-card').filter({ hasText: eventName });
  await row.getByRole('button', { name: 'Review gathering' }).click();
  await admin.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(admin.getByRole('dialog')).not.toBeVisible();
  await admin.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
  await login(member, 'member', 'MemberDemo2026!', '/discover?q=' + encodeURIComponent(eventName));
  await member.getByRole('link', { name: eventName, exact: true }).click();
  await member.getByRole('button', { name: 'Count me in' }).click();
  await expect(member.getByText('You’re on the list!', { exact: true })).toBeVisible();
  await host.reload();
  await host.getByRole('button', { name: 'Guest list' }).click();
  await expect(host.getByText('Alex Morgan', { exact: true })).toBeVisible();
  await host.getByRole('button', { name: 'Check in', exact: true }).click();
  await expect(host.getByRole('button', { name: 'Checked in · undo' })).toBeVisible();
  await host.screenshot({ path: 'test-results/business-desktop.png', fullPage: true });
  await Promise.all([hostContext.close(), adminContext.close(), memberContext.close()]);
});
test('mobile layout, menu, account validation and portal permission', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'X-Forwarded-For': '198.51.100.31' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Your people. Your city. Your third place.' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Find a gathering' })
    .click();
  await expect(page).toHaveURL(/discover/);
  await expect(page.getByRole('heading', { name: 'Find your kind of people.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await login(page, 'member', 'MemberDemo2026!', '/admin');
  await expect(
    page.getByRole('heading', { name: 'This portal is for administrators.' }),
  ).toBeVisible();
  await page.goto('/my?tab=profile');
  await page.getByLabel('Your name').fill('Alex Morgan');
  await page.getByRole('button', { name: 'Save my profile' }).click();
  await expect(page.getByRole('status')).toContainText('Your profile feels a little more you.');
});
test('auth throttles repeated attempts and ignores a forged internal IP header', async ({
  request,
}) => {
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const response = await request.post('/api/auth/sign-in/username', {
      headers: {
        Origin: 'http://localhost:3001',
        'X-Forwarded-For': '198.51.100.250',
        'x-tpc-client-ip': `203.0.113.${i + 1}`,
      },
      data: { username: 'admin', password: 'wrong-password' },
    });
    statuses.push(response.status());
  }
  expect(statuses).toContain(401);
  expect(statuses).toContain(429);
});
