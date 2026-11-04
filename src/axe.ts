import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { KNOWN_ISSUES } from './known-issues';

// WCAG 2.2 level A and AA rules. Chat widgets are third-party, not part of the shop.
export function axeFor(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('[data-test="chat-toggle"]')
    .exclude('[data-test="live-activity-toggle"]');
}

// Scans the page and returns only serious/critical problems that are not in the known list.
// The full axe result is attached to the report either way.
export async function newSeriousViolations(
  page: Page,
  pageName: string,
  testInfo: TestInfo,
): Promise<string[]> {
  const { violations } = await axeFor(page).analyze();
  await testInfo.attach(`axe-${pageName}.json`, {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });

  const known = KNOWN_ISSUES[pageName] ?? [];
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  for (const v of serious.filter((v) => known.includes(v.id))) {
    testInfo.annotations.push({ type: 'known a11y issue', description: `${v.id}: ${v.help}` });
  }
  return serious
    .filter((v) => !known.includes(v.id))
    .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target).join(', ')})`);
}
