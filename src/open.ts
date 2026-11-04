import { expect, type Page } from '@playwright/test';

// Goes to a page and waits until its key element is visible. The public demo can take
// over 10s to render on a cold start, so pages get 20s here.
export async function open(page: Page, path: string, readyTestId: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByTestId(readyTestId).first()).toBeVisible({ timeout: 20_000 });
}
