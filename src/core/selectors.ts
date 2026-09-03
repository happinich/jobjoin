import { Page } from 'playwright';
import { fieldHints } from './fieldHints.js';
import { SelectorOverrides } from '../types/index.js';
import { RunLogger } from '../utils/logger.js';

async function findFirstVisible(page: Page, selectors: string[]): Promise<string | undefined> {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if ((await locator.count()) && (await locator.isVisible())) return selector;
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function resolveLoginSelectors(
  page: Page,
  overrides: SelectorOverrides,
  logger: RunLogger,
) {
  const resolved = {
    username: overrides.username,
    password: overrides.password,
    submit: overrides.submit,
    postLoginReady: overrides.postLoginReady ?? 'body',
  };

  resolved.username ??= await findFirstVisible(page, fieldHints.login.username);
  resolved.password ??= await findFirstVisible(page, fieldHints.login.password);
  resolved.submit ??= await findFirstVisible(page, fieldHints.login.submit);

  logger.info('selectors.login.resolved', resolved);
  if (!resolved.username || !resolved.password || !resolved.submit) {
    throw new Error(
      'Could not resolve login selectors. Set KAR_*_SELECTOR overrides after inspecting the site.',
    );
  }
  return resolved;
}

export async function resolveRepostSelectors(
  page: Page,
  overrides: SelectorOverrides,
  logger: RunLogger,
) {
  const resolved = {
    repostForm: overrides.repostForm,
    sourceUrl: overrides.sourceUrl,
    title: overrides.title,
    body: overrides.body,
    tags: overrides.tags,
    submitRepost: overrides.submitRepost,
  };

  resolved.repostForm ??= await findFirstVisible(page, fieldHints.repost.form);
  resolved.sourceUrl ??= await findFirstVisible(page, fieldHints.repost.sourceUrl);
  resolved.title ??= await findFirstVisible(page, fieldHints.repost.title);
  resolved.body ??= await findFirstVisible(page, fieldHints.repost.body);
  resolved.tags ??= await findFirstVisible(page, fieldHints.repost.tags);
  resolved.submitRepost ??= await findFirstVisible(page, fieldHints.repost.submit);

  logger.info('selectors.repost.resolved', resolved);
  return resolved;
}
