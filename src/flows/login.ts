import { Page } from 'playwright';
import { AppConfig } from '../types/index.js';
import { resolveLoginSelectors } from '../core/selectors.js';
import { RunLogger } from '../utils/logger.js';

export async function ensureLoggedIn(
  page: Page,
  config: AppConfig,
  logger: RunLogger,
): Promise<void> {
  const loginUrl = new URL(config.loginPath, config.baseUrl).toString();
  logger.info('login.start', { loginUrl, useStoredSession: config.useStoredSession });
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

  if (config.useStoredSession && !page.url().includes(config.loginPath)) {
    logger.info('login.session.reused', { currentUrl: page.url() });
    return;
  }

  const selectors = await resolveLoginSelectors(page, config.selectors, logger);
  const { username, password, submit, postLoginReady } = selectors;
  if (!username || !password || !submit) {
    throw new Error('Login selectors resolved incompletely.');
  }

  await page.fill(username, config.username);
  await page.fill(password, config.password);

  if (config.dryRun) {
    logger.warn('login.dryRun', { message: 'Dry run enabled, skipping login submit.' });
    return;
  }

  await Promise.all([
    page.waitForLoadState('networkidle').catch(() => undefined),
    page.click(submit),
  ]);
  await page.waitForSelector(postLoginReady, { timeout: config.navigationTimeoutMs });
  await page.context().storageState({ path: config.storageStatePath });
  logger.info('login.complete', { storageStatePath: config.storageStatePath });
}
