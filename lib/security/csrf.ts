/**
 * CSRF (Cross-Site Request Forgery) 保护
 *
 * 为状态变更操作提供 CSRF token 验证
 * Token 存储在数据库中，避免热重载导致的 token 丢失
 */

import { createHash, randomBytes } from "crypto";
import { createLogger } from "@/lib/logger";
import postgres from "postgres";

const logger = createLogger("CSRF");

// 使用环境变量中的数据库连接
const getDbClient = () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
  }
  return postgres(process.env.POSTGRES_URL);
};

/**
 * CSRF Token 配置
 */
const CSRF_TOKEN_LENGTH = 32; // Token 长度（字节）
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // Token 过期时间：1小时

/**
 * 生成 CSRF Token
 *
 * @param userId - 用户 ID
 * @returns CSRF token
 */
export async function generateCsrfToken(userId: string): Promise<string> {
  const client = getDbClient();

  try {
    // 生成随机 token
    const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString("hex");

    // 添加用户 ID 和时间戳的签名
    const signature = createHash("sha256")
      .update(`${randomToken}:${userId}:${Date.now()}`)
      .digest("hex");

    const token = `${randomToken}.${signature}`;
    const expiresAt = new Date(Date.now() + CSRF_TOKEN_EXPIRY);

    // 存储到数据库
    await client`
      INSERT INTO "CsrfToken" (token, "userId", "expiresAt")
      VALUES (${token}, ${userId}, ${expiresAt})
    `;

    logger.info(`Generated token for user ${userId}`);

    return token;
  } finally {
    await client.end();
  }
}

/**
 * 验证 CSRF Token
 *
 * @param token - 要验证的 token
 * @param userId - 用户 ID
 * @returns 是否有效
 */
export async function validateCsrfToken(
  token: string | null | undefined,
  userId: string
): Promise<boolean> {
  if (!token) {
    logger.warn("No token provided");
    return false;
  }

  const client = getDbClient();

  try {
    // 从数据库中获取 token
    const result = await client`
      SELECT "userId", "createdAt", "expiresAt"
      FROM "CsrfToken"
      WHERE token = ${token}
      LIMIT 1
    `;

    if (result.length === 0) {
      logger.warn(`Token not found in database. Received token: ${token.substring(0, 20)}...`);
      return false;
    }

    const tokenData = result[0];

    // 检查 token 是否过期
    const now = new Date();
    if (now > tokenData.expiresAt) {
      logger.warn("Token expired");
      // 删除过期 token
      await client`DELETE FROM "CsrfToken" WHERE token = ${token}`;
      return false;
    }

    // 检查 userId 是否匹配
    if (tokenData.userId !== userId) {
      logger.warn("User ID mismatch");
      return false;
    }

    logger.info(`Token validated for user ${userId}`);
    return true;
  } finally {
    await client.end();
  }
}

/**
 * 使用后删除 token（一次性使用）
 * 可选：如果需要 token 可重复使用，可以不调用此方法
 *
 * @param token - 要删除的 token
 */
export async function consumeCsrfToken(token: string): Promise<void> {
  const client = getDbClient();

  try {
    await client`DELETE FROM "CsrfToken" WHERE token = ${token}`;
    logger.info(`Token consumed and removed`);
  } finally {
    await client.end();
  }
}

/**
 * 清理过期的 tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const client = getDbClient();

  try {
    const result = await client`
      DELETE FROM "CsrfToken"
      WHERE "expiresAt" < NOW()
      RETURNING token
    `;

    if (result.length > 0) {
      logger.info(`Cleaned up ${result.length} expired tokens`);
    }
  } finally {
    await client.end();
  }
}

/**
 * 清理用户的所有 tokens（用户登出时调用）
 *
 * @param userId - 用户 ID
 */
export async function clearUserTokens(userId: string): Promise<void> {
  const client = getDbClient();

  try {
    const result = await client`
      DELETE FROM "CsrfToken"
      WHERE "userId" = ${userId}
      RETURNING token
    `;

    if (result.length > 0) {
      logger.info(`Cleared ${result.length} tokens for user ${userId}`);
    }
  } finally {
    await client.end();
  }
}
