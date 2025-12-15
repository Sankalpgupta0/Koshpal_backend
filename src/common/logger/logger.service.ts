import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    const ctx = context || this.context || 'Application';
    console.log(`[${new Date().toISOString()}] [${ctx}] INFO: ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    const ctx = context || this.context || 'Application';
    console.error(`[${new Date().toISOString()}] [${ctx}] ERROR: ${message}`);
    if (trace) {
      console.error(`[${new Date().toISOString()}] [${ctx}] TRACE: ${trace}`);
    }
  }

  warn(message: string, context?: string) {
    const ctx = context || this.context || 'Application';
    console.warn(`[${new Date().toISOString()}] [${ctx}] WARN: ${message}`);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const ctx = context || this.context || 'Application';
      console.debug(`[${new Date().toISOString()}] [${ctx}] DEBUG: ${message}`);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const ctx = context || this.context || 'Application';
      console.log(`[${new Date().toISOString()}] [${ctx}] VERBOSE: ${message}`);
    }
  }
}
