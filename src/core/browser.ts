import { execSync } from 'node:child_process';
import { Browser, BrowserContext, chromium } from 'playwright';
import { AppConfig } from '../types/index.js';
import { hasStoredSession } from './config.js';

export async function createBrowser(config: AppConfig): Promise<Browser> {
  try {
    return await chromium.launch({ headless: config.headless });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Playwright 업데이트로 브라우저 실행 파일이 사라진 경우 자동 재설치 후 재시도
    if (message.includes("Executable doesn't exist")) {
      console.error('[browser] 크로미움 실행 파일 없음 - 자동 재설치 시도');
      execSync('npx playwright install chromium', { stdio: 'inherit', timeout: 300000 });
      return chromium.launch({ headless: config.headless });
    }
    throw error;
  }
}

export async function createContext(browser: Browser, config: AppConfig): Promise<BrowserContext> {
  const storageState =
    config.useStoredSession && hasStoredSession(config.storageStatePath)
      ? config.storageStatePath
      : undefined;

  return browser.newContext({ storageState });
}
