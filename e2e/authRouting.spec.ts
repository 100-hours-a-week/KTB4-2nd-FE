import { expect, test, type BrowserContext } from '@playwright/test';

async function setCookie(context: BrowserContext, name: string, value: string, path = '/') {
  await context.addCookies([{ name, value, domain: 'localhost', path }]);
}

test('로그인 사용자는 로그인·가입 화면에서 홈으로 이동한다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'valid');

  await page.goto('/login');
  await expect(page).toHaveURL('http://localhost:3100/');

  await page.goto('/signup');
  await expect(page).toHaveURL('http://localhost:3100/');
});

test('비로그인 사용자는 가입 화면과 약관을 볼 수 있다', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /닉네임을/ })).toBeVisible();

  await page.goto('/terms/service');
  await expect(page).toHaveURL(/\/terms\/service$/);

  await page.goto('/terms/privacy');
  await expect(page).toHaveURL(/\/terms\/privacy$/);
});

test('로그인 사용자도 약관을 볼 수 있다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'valid');
  await page.goto('/terms/service');

  await expect(page).toHaveURL(/\/terms\/service$/);
});

test('만료된 액세스 토큰을 갱신하고 홈으로 돌아온다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'expired');
  await setCookie(context, 'refreshToken', 'valid-refresh', '/auth');

  await page.goto('/');

  await expect(page).toHaveURL(/\/\?renewed=1$/);
  await expect(page.getByRole('heading', { level: 1, name: '여담' })).toBeVisible();
  expect((await context.cookies()).find(({ name }) => name === 'accessToken')?.value).toBe('valid');
});

test('액세스 쿠키가 없어도 갱신 쿠키가 있으면 세션을 복구한다', async ({ page, context }) => {
  await setCookie(context, 'refreshToken', 'valid-refresh', '/auth');

  await page.goto('/');

  await expect(page).toHaveURL(/\/\?renewed=1$/);
  await expect(page.getByRole('heading', { level: 1, name: '여담' })).toBeVisible();
});

test('무효한 갱신 토큰은 로그인 화면으로 이동한다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'expired');
  await setCookie(context, 'refreshToken', 'invalid', '/auth');

  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
});

test('갱신 후에도 인증이 실패하면 반복 갱신 없이 로그인 화면으로 이동한다', async ({
  page,
  context,
}) => {
  await setCookie(context, 'accessToken', 'expired');
  await setCookie(context, 'refreshToken', 'stubborn', '/auth');

  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
});

test('인증 저장소 오류는 로그인 화면 대신 재시도 화면을 표시한다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'store-down');

  await page.goto('/');

  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  await expect(page).toHaveURL('http://localhost:3100/');
});

test('인증된 회원 정보가 없으면 로그인 화면으로 이동한다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'missing-user');

  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
});

test('갱신 서버 오류에도 쿠키를 보존하고 재시도를 표시한다', async ({ page, context }) => {
  await setCookie(context, 'accessToken', 'expired');
  await setCookie(context, 'refreshToken', 'store-down', '/auth');

  await page.goto('/');

  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
  expect((await context.cookies()).find(({ name }) => name === 'refreshToken')?.value).toBe(
    'store-down',
  );
});
