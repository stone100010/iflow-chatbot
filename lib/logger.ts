/**
 * 结构化日志系统
 *
 * 提供统一的日志接口,支持不同日志级别、格式化输出和日志过滤
 */

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

/**
 * 日志级别颜色（用于终端输出）
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "\x1b[36m", // Cyan
  [LogLevel.INFO]: "\x1b[32m", // Green
  [LogLevel.WARN]: "\x1b[33m", // Yellow
  [LogLevel.ERROR]: "\x1b[31m", // Red
  [LogLevel.FATAL]: "\x1b[35m", // Magenta
};

const RESET_COLOR = "\x1b[0m";

/**
 * 日志配置
 */
interface LoggerConfig {
  /**
   * 最低日志级别，低于此级别的日志不会输出
   */
  minLevel: LogLevel;

  /**
   * 是否在生产环境禁用调试日志
   */
  disableDebugInProduction: boolean;

  /**
   * 是否使用颜色输出
   */
  useColors: boolean;

  /**
   * 是否包含时间戳
   */
  includeTimestamp: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  disableDebugInProduction: true,
  useColors: process.env.NODE_ENV !== "production",
  includeTimestamp: true,
};

/**
 * Logger 类
 */
export class Logger {
  private context: string;
  private config: LoggerConfig;

  constructor(context: string, config: Partial<LoggerConfig> = {}) {
    this.context = context;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 格式化日志消息
   */
  private format(level: LogLevel, message: string, data?: any): string {
    const parts: string[] = [];

    // 时间戳
    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    // 日志级别
    const levelName = LOG_LEVEL_NAMES[level];
    if (this.config.useColors) {
      const color = LOG_LEVEL_COLORS[level];
      parts.push(`${color}${levelName}${RESET_COLOR}`);
    } else {
      parts.push(levelName);
    }

    // 上下文
    parts.push(`[${this.context}]`);

    // 消息
    parts.push(message);

    let output = parts.join(" ");

    // 附加数据
    if (data !== undefined) {
      output += "\n" + JSON.stringify(data, null, 2);
    }

    return output;
  }

  /**
   * 通用日志方法
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 检查日志级别
    if (level < this.config.minLevel) {
      return;
    }

    // 生产环境禁用 DEBUG
    if (
      this.config.disableDebugInProduction &&
      process.env.NODE_ENV === "production" &&
      level === LogLevel.DEBUG
    ) {
      return;
    }

    const formatted = this.format(level, message, data);

    // 根据级别输出到不同流
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      this.log(LogLevel.ERROR, message, error);
    }
  }

  /**
   * FATAL 级别日志（严重错误）
   */
  fatal(message: string, error?: Error | any): void {
    if (error instanceof Error) {
      this.log(LogLevel.FATAL, message, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    } else {
      this.log(LogLevel.FATAL, message, error);
    }
  }

  /**
   * 创建子 Logger（继承父级配置，添加上下文前缀）
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.config);
  }
}

/**
 * 创建 Logger 实例的便捷函数
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(context, config);
}

/**
 * 全局默认 Logger
 */
export const logger = new Logger("App");
