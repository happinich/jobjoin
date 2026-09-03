import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { AppConfig, RunLogEntry } from '../types/index.js';

export class RunLogger {
  private readonly filePath: string;

  constructor(config: Pick<AppConfig, 'logDir'>) {
    mkdirSync(config.logDir, { recursive: true });
    const stamp = new Date().toISOString().replaceAll(':', '-');
    this.filePath = path.join(config.logDir, `run-${stamp}.jsonl`);
  }

  log(level: RunLogEntry['level'], event: string, details?: Record<string, unknown>): void {
    const entry: RunLogEntry = { timestamp: new Date().toISOString(), level, event, details };
    const line = JSON.stringify(entry);
    console.log(line);
    appendFileSync(this.filePath, `${line}\n`, 'utf8');
  }

  info(event: string, details?: Record<string, unknown>): void { this.log('info', event, details); }
  warn(event: string, details?: Record<string, unknown>): void { this.log('warn', event, details); }
  error(event: string, details?: Record<string, unknown>): void { this.log('error', event, details); }
  getLogPath(): string { return this.filePath; }
}
