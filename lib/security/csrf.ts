/**
 * CSRF (Cross-Site Request Forgery) 保护
 *
 * 为状态变更操作提供 CSRF token 验证
 */

import { createHash, randomBytes } from "crypto";
import { createLogger } from "@/lib/logger";

const logger = createLogger("CSRF");

/**
 * CSRF Token 配置
 */
const CSRF_TOKEN_LENGTH = 32; // Token 长度（字节）
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // Token 过期时间：1小时

/**
 * Token 存储结构
 */
interface CsrfTokenData {
  token: string;
  userId: string;
  createdAt: number;
}

/**
 * 内存中存储活跃的 CSRF tokens
 * Key: token, Value: TokenData
 *
 * 注意：在生产环境中，应该使用 Redis 等分布式存储
 * 这里使用 Map 仅用于演示和开发环境
 */
const tokenStore = new Map<string, CsrfTokenData>();

/**
 * 定期清理过期 token
 */
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (now - data.createdAt > CSRF_TOKEN_EXPIRY) {
      tokenStore.delete(token);
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    logger.info(`Cleaned up ${expiredCount} expired tokens`);
  }
}, 5 * 60 * 1000); // 每 5 分钟清理一次

/**
 * 生成 CSRF Token
 *
 * @param userId - 用户 ID
 * @returns CSRF token
 */
export function generateCsrfToken(userId: string): string {
  // 生成随机 token
  const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");

  // 添加用户 ID 和时间戳的签名
  const signature = createHash("sha256")
    .update(`${randomToken}:${userId}:${Date.now()}`)
    .digest("hex");

  const token = `${randomToken}.${signature}`;

  // 存储 token
  tokenStore.set(token, {
    token,
    userId,
    createdAt: Date.now(),
  });

  logger.info(`Generated token for user ${userId} (total: ${tokenStore.size})`);

  return token;
}

/**
 * 验证 CSRF Token
 *
 * @param token - 要验证的 token
 * @param userId - 用户 ID
 * @returns 是否有效
 */
export function validateCsrfToken(
  token: string | null | undefined,
  userId: string
): boolean {
  if (!token) {
    logger.warn("No token provided");
    return false;
  }

  // 从存储中获取 token 数据
  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    logger.warn("Token not found in store");
    return false;
  }

  // 检查 token 是否过期
  const now = Date.now();
  if (now - tokenData.createdAt > CSRF_TOKEN_EXPIRY) {
    logger.warn("Token expired");
    tokenStore.delete(token);
    return false;
  }

  // 检查 userId 是否匹配
  if (tokenData.userId !== userId) {
    logger.warn("User ID mismatch");
    return false;
  }

  logger.info(`Token validated for user ${userId}`);
  return true;
}

/**
 * 使用后删除 token（一次性使用）
 * 可选：如果需要 token 可重复使用，可以不调用此方法
 *
 * @param token - 要删除的 token
 */
export function consumeCsrfToken(token: string): void {
  tokenStore.delete(token);
  logger.info(`Token consumed and removed (remaining: ${tokenStore.size})`);
}

/**
 * 获取 token 统计信息（用于监控）
 */
export function getCsrfStats(): {
  activeTokens: number;
  oldestTokenAge: number;
} {
  const now = Date.now();
  let oldestAge = 0;

  for (const data of tokenStore.values()) {
    const age = now - data.createdAt;
    if (age > oldestAge) {
      oldestAge = age;
    }
  }

  return {
    activeTokens: tokenStore.size,
    oldestTokenAge: Math.round(oldestAge / 1000), // 转换为秒
  };
}

/**
 * 清理用户的所有 tokens（用户登出时调用）
 *
 * @param userId - 用户 ID
 */
export function clearUserTokens(userId: string): void {
  let count = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (data.userId === userId) {
      tokenStore.delete(token);
      count++;
    }
  }

  if (count > 0) {
    logger.info(`Cleared ${count} tokens for user ${userId}`);
  }
}
