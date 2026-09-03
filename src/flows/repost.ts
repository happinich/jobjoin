import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { Page } from 'playwright';
import { AppConfig } from '../types/index.js';
import { resolveRepostSelectors } from '../core/selectors.js';
import { RunLogger } from '../utils/logger.js';

async function dumpRepostPage(page: Page, config: AppConfig, logger: RunLogger): Promise<void> {
  const htmlPath = path.join(config.logDir, 'repost-page.html');
  const screenshotPath = path.join(config.logDir, 'repost-page.png');
  writeFileSync(htmlPath, await page.content(), 'utf8');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  logger.info('repost.dumpedPage', { htmlPath, screenshotPath, currentUrl: page.url() });
}

async function logRepostFieldInventory(page: Page, logger: RunLogger): Promise<void> {
  const inventory = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('form input, form textarea, form select, form button'),
    ).map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
      value: el.getAttribute('value'),
      placeholder: el.getAttribute('placeholder'),
      text: el.textContent?.trim() || null,
    }));
  });
  logger.info('repost.fieldInventory', { inventory });
}

export async function prepareRepost(
  page: Page,
  config: AppConfig,
  logger: RunLogger,
): Promise<void> {
  // alert 내용 캡처
  page.on('dialog', async (dialog) => {
    logger.warn('repost.dialog', { type: dialog.type(), message: dialog.message() });
    await dialog.dismiss();
  });
  const repostUrl = new URL(config.repostPath, config.baseUrl).toString();
  logger.info('repost.start', {
    repostUrl,
    draft: { ...config.repostDraft, body: `${config.repostDraft.body.slice(0, 80)}...` },
  });
  await page.goto(repostUrl, { waitUntil: 'domcontentloaded' });

  // 로그인 페이지로 리다이렉트됐으면 조기 종료
  const currentUrl = page.url();
  if (currentUrl.includes(config.loginPath)) {
    if (config.dryRun) {
      logger.warn('repost.skipped', {
        reason: 'dry-run 모드에서 로그인이 생략되어 구인글 페이지에 접근할 수 없습니다. 실제 실행 시(KAR_DRY_RUN=false)에는 정상 동작합니다.',
        currentUrl,
      });
      return;
    }
    await dumpRepostPage(page, config, logger);
    throw new Error(`구인글 페이지 접근 실패: 로그인 페이지로 리다이렉트됨 (${currentUrl})`);
  }

  const selectors = await resolveRepostSelectors(page, config.selectors, logger);
  if (!selectors.body || !selectors.submitRepost) {
    await dumpRepostPage(page, config, logger);
    await logRepostFieldInventory(page, logger);
    throw new Error(
      'Could not resolve enough repost selectors. Check dumped page artifacts and set KAR_*_SELECTOR values.',
    );
  }

  const repostFormLocator = selectors.repostForm
    ? page.locator(selectors.repostForm).first()
    : undefined;
  if (repostFormLocator) {
    await repostFormLocator
      .waitFor({ state: 'visible', timeout: Math.max(config.navigationTimeoutMs, 15000) })
      .catch(() => undefined);
  }

  // 구인글 폼 필드 입력
  if (selectors.title) {
    const titleLocator = page.locator(selectors.title).first();
    await titleLocator
      .waitFor({ state: 'visible', timeout: Math.max(config.navigationTimeoutMs, 15000) })
      .catch(() => undefined);
    const titleExists = (await titleLocator.count()) > 0;
    if (titleExists) {
      const titleTagName = await titleLocator.evaluate((el) => el.tagName.toLowerCase());
      if (titleTagName === 'select') {
        await titleLocator
          .selectOption({ label: config.repostDraft.title })
          .catch(async () =>
            titleLocator.selectOption({ value: config.repostDraft.title }).catch(() => undefined),
          );
      } else {
        await titleLocator.fill(config.repostDraft.title);
      }
    }
  }

  if (config.repostDraft.payNegotiable) {
    await page.locator('input[name="paychk"]').check().catch(() => undefined);
  }

  await page
    .locator('select[name="endday"]')
    .selectOption({ label: config.repostDraft.endday })
    .catch(async () =>
      page
        .locator('select[name="endday"]')
        .selectOption(config.repostDraft.endday)
        .catch(() => undefined),
    );

  await page
    .locator('select[name="areacode"]')
    .selectOption(config.repostDraft.areacode)
    .catch(() => undefined);

  await page
    .locator('input[name="areaetc"]')
    .fill(config.repostDraft.areaetc)
    .catch(() => undefined);

  await page
    .locator(`input[name="object"][value="${config.repostDraft.object}"]`)
    .check()
    .catch(() => undefined);

  await page
    .locator('input[name="getnum"]')
    .fill(config.repostDraft.getnum)
    .catch(() => undefined);

  await page
    .locator(`input[name="sex"][value="${config.repostDraft.sex}"]`)
    .check()
    .catch(() => undefined);

  await page
    .locator('select[name="school"]')
    .selectOption(config.repostDraft.school)
    .catch(() => undefined);

  await page
    .locator('input[name="tel1"]')
    .fill(config.repostDraft.tel[0])
    .catch(() => undefined);
  await page
    .locator('input[name="tel2"]')
    .fill(config.repostDraft.tel[1])
    .catch(() => undefined);
  await page
    .locator('input[name="tel3"]')
    .fill(config.repostDraft.tel[2])
    .catch(() => undefined);

  await page
    .locator('input[name="email1"]')
    .fill(config.repostDraft.email.local)
    .catch(() => undefined);
  await page
    .locator('select[name="email_kind"]')
    .selectOption(config.repostDraft.email.domain)
    .catch(() => undefined);

  await page
    .locator('textarea[name="exhibit"]')
    .fill(config.repostDraft.exhibit)
    .catch(() => undefined);

  // 본문 입력
  const bodyLocator = page.locator(selectors.body).first();
  const bodyExists = (await bodyLocator.count()) > 0;
  if (bodyExists) {
    const tagName = await bodyLocator.evaluate((el) => el.tagName.toLowerCase());
    if (tagName === 'textarea' || tagName === 'input') {
      await bodyLocator.fill(config.repostDraft.body);
    } else {
      await bodyLocator.click();
      await page.keyboard.insertText(config.repostDraft.body);
    }
  }

  // 태그 입력 (있을 경우)
  if (selectors.tags && config.repostDraft.tags.length > 0) {
    await page.locator(selectors.tags).first().fill(config.repostDraft.tags.join(', '));
  }

  // 저장 직전 폼 실제값 확인
  const formSnapshot = await page.evaluate(() => {
    const f = document.querySelector('form[name="frmJob"]') as HTMLFormElement | null;
    if (!f) return null;
    const data: Record<string, string> = {};
    for (const el of Array.from(f.elements) as HTMLInputElement[]) {
      if (el.name) {
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.checked) data[el.name] = el.value;
        } else {
          data[el.name] = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
        }
      }
    }
    return data;
  });
  logger.info('repost.formSnapshot', { formSnapshot });

  if (config.dryRun) {
    logger.warn('repost.dryRun', { message: 'Dry run enabled, skipping final submit.' });
    await dumpRepostPage(page, config, logger);
    return;
  }

  await Promise.all([
    page.waitForLoadState('networkidle').catch(() => undefined),
    page.click(selectors.submitRepost),
  ]);
  await dumpRepostPage(page, config, logger);
  logger.info('repost.complete', { currentUrl: page.url() });
}
