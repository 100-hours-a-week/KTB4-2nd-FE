import { expect, test } from '@playwright/test';

test('비로그인 사용자는 홈에서 로그인 화면으로 이동한다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1, name: /흩어진 여행 사진을/ })).toBeVisible();
});

test('로그인 사용자는 홈 화면을 볼 수 있다', async ({ page, context }) => {
  await context.addCookies([
    { name: 'accessToken', value: 'valid', domain: 'localhost', path: '/' },
  ]);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: '여담' })).toBeVisible();
});
