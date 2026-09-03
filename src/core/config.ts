import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { AppConfig } from '../types/index.js';

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value.toLowerCase() === 'true';
}

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asTags(value: string | undefined): string[] {
  return (value ?? '').split(',').map((part) => part.trim()).filter(Boolean);
}

function splitPhone(value: string | undefined): string[] {
  const digits = (value ?? '').replace(/[^0-9]/g, '');
  if (digits.length === 11) return [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 11)];
  if (digits.length === 10) return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
  return ['', '', ''];
}

function splitEmail(value: string | undefined): { local: string; domain: string } {
  const [local = '', domain = ''] = (value ?? '').split('@');
  return { local, domain };
}

function readBody(
  body: string | undefined,
  bodyFile: string | undefined,
): { body: string; bodyFile?: string } {
  const resolvedBodyFile = bodyFile ? path.resolve(bodyFile) : undefined;
  if (resolvedBodyFile) {
    return {
      body: readFileSync(resolvedBodyFile, 'utf8').trimEnd(),
      bodyFile: resolvedBodyFile,
    };
  }
  return {
    body: required('KAR_BODY', body),
    bodyFile: undefined,
  };
}

export function loadConfig(): AppConfig {
  const logDir = path.resolve(process.env.KAR_LOG_DIR ?? './logs');
  const storageStatePath = path.resolve(
    process.env.KAR_STORAGE_STATE_PATH ?? './state/kar-session.json',
  );
  mkdirSync(logDir, { recursive: true });
  mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const bodyInput = readBody(process.env.KAR_BODY, process.env.KAR_BODY_FILE);

  return {
    baseUrl: required('KAR_BASE_URL', process.env.KAR_BASE_URL),
    loginPath: process.env.KAR_LOGIN_PATH ?? '/login',
    repostPath: process.env.KAR_REPOST_PATH ?? '/repost',
    username: required('KAR_USERNAME', process.env.KAR_USERNAME),
    password: required('KAR_PASSWORD', process.env.KAR_PASSWORD),
    headless: asBoolean(process.env.KAR_HEADLESS, true),
    dryRun: asBoolean(process.env.KAR_DRY_RUN, true),
    useStoredSession: asBoolean(process.env.KAR_USE_STORED_SESSION, true),
    storageStatePath,
    navigationTimeoutMs: asNumber(process.env.KAR_NAVIGATION_TIMEOUT_MS, 30000),
    actionTimeoutMs: asNumber(process.env.KAR_ACTION_TIMEOUT_MS, 10000),
    logDir,
    selectors: {
      username: process.env.KAR_USERNAME_SELECTOR || undefined,
      password: process.env.KAR_PASSWORD_SELECTOR || undefined,
      submit: process.env.KAR_SUBMIT_SELECTOR || undefined,
      postLoginReady: process.env.KAR_POST_LOGIN_READY_SELECTOR || undefined,
      repostForm: process.env.KAR_REPOST_FORM_SELECTOR || undefined,
      sourceUrl: process.env.KAR_SOURCE_URL_SELECTOR || undefined,
      title: process.env.KAR_TITLE_SELECTOR || undefined,
      body: process.env.KAR_BODY_SELECTOR || undefined,
      tags: process.env.KAR_TAGS_SELECTOR || undefined,
      submitRepost: process.env.KAR_SUBMIT_REPOST_SELECTOR || undefined,
    },
    repostDraft: {
      sourceUrl: required('KAR_SOURCE_URL', process.env.KAR_SOURCE_URL),
      title: process.env.KAR_TITLE ?? '소속공인중개사 모집',
      body: bodyInput.body,
      bodyFile: bodyInput.bodyFile,
      tags: asTags(process.env.KAR_TAGS),
      payNegotiable: asBoolean(process.env.KAR_PAY_NEGOTIABLE, true),
      endday: process.env.KAR_ENDDAY ?? '채용까지',
      areacode: process.env.KAR_AREACODE ?? '11',
      areaetc: process.env.KAR_AREAETC ?? '강남구 삼성동',
      object: process.env.KAR_OBJECT ?? '2',
      getnum: process.env.KAR_GETNUM ?? '1',
      sex: process.env.KAR_SEX ?? '0',
      school: process.env.KAR_SCHOOL ?? '1',
      tel: splitPhone(process.env.KAR_TEL ?? '010-2521-6821'),
      email: splitEmail(process.env.KAR_EMAIL ?? 'happinich01@naver.com'),
      exhibit: process.env.KAR_EXHIBIT ?? '이력서',
    },
  };
}

export function hasStoredSession(storageStatePath: string): boolean {
  return existsSync(storageStatePath);
}
