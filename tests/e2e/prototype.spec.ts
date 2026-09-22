import { test, expect } from '@playwright/test';

test('protótipo renderiza conteúdo e controles sem exceções JavaScript', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/FlowTest/i);
  await expect(page.getByRole('button').first()).toBeVisible();
  expect(errors).toEqual([]);
});
