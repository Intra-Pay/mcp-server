type LogLevel = 'info' | 'warn' | 'error';

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const payload = { level, message, ...(meta || {}) };
  if (level === 'info') console.log(JSON.stringify(payload));
  else if (level === 'warn') console.warn(JSON.stringify(payload));
  else console.error(JSON.stringify(payload));
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};