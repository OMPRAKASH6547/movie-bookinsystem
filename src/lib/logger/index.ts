type LogLevel = "error" | "warn" | "info" | "debug";

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel =
  LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? LOG_LEVELS.info;

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "cinepass",
    ...meta,
  });
}

export const logger = {
  error(message: string, meta?: Record<string, unknown>) {
    if (currentLevel >= LOG_LEVELS.error) console.error(formatMessage("error", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (currentLevel >= LOG_LEVELS.warn) console.warn(formatMessage("warn", message, meta));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (currentLevel >= LOG_LEVELS.info) console.info(formatMessage("info", message, meta));
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (currentLevel >= LOG_LEVELS.debug) console.debug(formatMessage("debug", message, meta));
  },
};
