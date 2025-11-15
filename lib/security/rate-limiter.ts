/**
 * Rate Limiting 速率限制
 *
 * 防止 API 滥用和 DDoS 攻击
 * 使用滑动窗口算法限制请求频率
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger("RateLimiter");

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  /**
   * 时间窗口（毫秒）
   */
  windowMs: number;

  /**
   * 时间窗口内允许的最大请求数
   */
  maxRequests: number;
}

/**
 * 请求记录
 */
interface RequestRecord {
  count: number; // 请求计数
  resetTime: number; // 重置时间（毫秒时间戳）
}

/**
 * 速率限制器类
 * 使用滑动窗口算法追踪用户请求
 */
export class RateLimiter {
  private records = new Map<string, RequestRecord>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // 定期清理过期记录（每5分钟）
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 检查请求是否被允许
   *
   * @param identifier - 唯一标识符（通常是用户 ID 或 IP 地址）
   * @returns 是否允许请求，以及限制信息
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const record = this.records.get(identifier);

    // 首次请求或窗口已过期
    if (!record || now >= record.resetTime) {
      this.records.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // 窗口内的后续请求
    if (record.count < this.config.maxRequests) {
      record.count++;
      this.records.set(identifier, record);

      return {
        allowed: true,
        remaining: this.config.maxRequests - record.count,
        resetTime: record.resetTime,
      };
    }

    // 超过限制
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  /**
   * 重置用户的速率限制（用于管理员操作）
   *
   * @param identifier - 唯一标识符
   */
  reset(identifier: string): void {
    this.records.delete(identifier);
    logger.info(`Reset rate limit for ${identifier}`);
  }

  /**
   * 清理过期的记录
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [identifier, record] of this.records.entries()) {
      if (now >= record.resetTime) {
        this.records.delete(identifier);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(
        `Cleaned up ${cleanedCount} expired records (remaining: ${this.records.size})`
      );
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    activeUsers: number;
    totalRecords: number;
  } {
    return {
      activeUsers: this.records.size,
      totalRecords: this.records.size,
    };
  }
}

/**
 * 预定义的速率限制器实例
 */

/**
 * 聊天 API 速率限制器
 * - 普通用户：每分钟 20 次请求
 */
export const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 20,
});

/**
 * 认证 API 速率限制器
 * - 防止暴力破解：每 15 分钟 5 次登录尝试
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 分钟
  maxRequests: 5,
});

/**
 * 通用 API 速率限制器
 * - 每分钟 100 次请求
 */
export const generalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 分钟
  maxRequests: 100,
});

/**
 * 速率限制中间件辅助函数
 * 返回标准的 429 响应
 */
export function createRateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000); // 转换为秒

  return {
    status: 429,
    headers: {
      "Retry-After": retryAfter.toString(),
      "X-RateLimit-Reset": new Date(resetTime).toISOString(),
    },
    body: {
      error: "Too many requests",
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    },
  };
}
