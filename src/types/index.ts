export interface AppConfig {
  baseUrl: string;
  loginPath: string;
  repostPath: string;
  username: string;
  password: string;
  headless: boolean;
  dryRun: boolean;
  useStoredSession: boolean;
  storageStatePath: string;
  navigationTimeoutMs: number;
  actionTimeoutMs: number;
  logDir: string;
  selectors: SelectorOverrides;
  repostDraft: RepostDraft;
}

export interface SelectorOverrides {
  username?: string;
  password?: string;
  submit?: string;
  postLoginReady?: string;
  repostForm?: string;
  sourceUrl?: string;
  title?: string;
  body?: string;
  tags?: string;
  submitRepost?: string;
}

export interface RepostDraft {
  sourceUrl: string;
  title: string;
  body: string;
  bodyFile?: string;
  tags: string[];
  payNegotiable: boolean;
  endday: string;
  areacode: string;
  areaetc: string;
  object: string;
  getnum: string;
  sex: string;
  school: string;
  tel: string[];
  email: { local: string; domain: string };
  exhibit: string;
}

export interface RunLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  details?: Record<string, unknown>;
}
