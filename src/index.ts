import { Browser, BrowserContext } from 'playwright';
import { createBrowser, createContext } from './core/browser.js';
import { loadConfig } from './core/config.js';
import { ensureLoggedIn } from './flows/login.js';
import { prepareRepost } from './flows/repost.js';
import { RunLogger } from './utils/logger.js';
import { escapeHtml, sendTelegram } from './utils/telegram.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = new RunLogger(config);
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  logger.info('run.start', {
    dryRun: config.dryRun,
    baseUrl: config.baseUrl,
    loginPath: config.loginPath,
    repostPath: config.repostPath,
  });

  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    // 브라우저 실행도 try 안에서 - 실패 시 텔레그램 알림 발송됨
    browser = await createBrowser(config);
    context = await createContext(browser, config);
    const page = await context.newPage();

    page.setDefaultNavigationTimeout(config.navigationTimeoutMs);
    page.setDefaultTimeout(config.actionTimeoutMs);

    await ensureLoggedIn(page, config, logger);
    await prepareRepost(page, config, logger);
    logger.info('run.complete', { dryRun: config.dryRun, logFile: logger.getLogPath() });

    if (!config.dryRun) {
      await sendTelegram(
        `✅ <b>KAR 구인글 등록 완료</b>\n\n` +
        `🕐 ${now}\n` +
        `📋 모집내용: ${config.repostDraft.title}\n` +
        `📍 근무지: 서울특별시 ${config.repostDraft.areaetc}\n` +
        `📞 연락처: ${config.repostDraft.tel.join('-')}`
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('run.failed', { message, logFile: logger.getLogPath() });
    await sendTelegram(
      `❌ <b>KAR 구인글 등록 실패</b>\n\n` +
      `🕐 ${now}\n` +
      `⚠️ 오류: ${escapeHtml(message.slice(0, 500))}`
    );
    throw error;
  } finally {
    await context?.close();
    await browser?.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
