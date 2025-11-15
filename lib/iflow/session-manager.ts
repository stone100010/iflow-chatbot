/**
 * iFlow 会话管理器
 *
 * 负责管理用户的 iFlow Client 会话，包括会话创建、复用、清理等
 */

import { IFlowClient } from "@iflow-ai/iflow-cli-sdk";
import type {
  IFlowClientConfig,
  IFlowModel,
  IFlowPermissionMode,
  IFlowSession,
} from "./types";
import { createIFlowClient } from "./client";
import { ensureWorkspace } from "./workspace";
import { getIFlowMessagesByWorkspaceId } from "@/lib/db/queries";
import { createLogger } from "@/lib/logger";

/**
 * 会话管理器类
 */
export class IFlowSessionManager {
  /**
   * 存储所有活动会话
   * Key: `${userId}:${workspaceId}`
   */
  private sessions: Map<string, IFlowSession> = new Map();

  /**
   * 最大会话数限制
   * 防止内存无限增长
   */
  private readonly MAX_SESSIONS = 1000;

  /**
   * 会话超时时间（毫秒）
   * 默认 30 分钟无活动后自动清理
   */
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

  /**
   * 清理间隔（毫秒）
   * 每 5 分钟检查一次过期会话
   */
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;

  /**
   * 历史消息上下文配置
   */
  private readonly MAX_CONTEXT_MESSAGES = 20; // 最多保留最近 20 条消息
  private readonly MAX_MESSAGE_LENGTH = 1000; // 每条消息最大 1000 字符

  /**
   * 清理定时器
   */
  private cleanupTimer?: NodeJS.Timeout;

  /**
   * 会话统计信息
   */
  private stats = {
    totalCreated: 0,
    totalDestroyed: 0,
    evictionCount: 0,
  };

  /**
   * Logger 实例
   */
  private logger = createLogger("SessionManager");

  constructor() {
    // 启动自动清理定时器
    this.startCleanup();
  }

  /**
   * 获取或创建会话
   *
   * 如果会话存在且配置未改变，则复用现有会话
   * 如果配置改变，则销毁旧会话并创建新会话
   * 如果会话数达到上限，则淘汰最不活跃的会话
   *
   * @param userId - 用户 ID
   * @param workspaceId - 工作区 ID
   * @param config - 会话配置
   * @returns iFlow 会话
   */
  async getOrCreateSession(
    userId: string,
    workspaceId: string,
    config: { modelName: IFlowModel; permissionMode: IFlowPermissionMode }
  ): Promise<IFlowSession> {
    const sessionKey = this.getSessionKey(userId, workspaceId);
    const existingSession = this.sessions.get(sessionKey);

    // 如果会话存在，检查配置是否改变
    if (existingSession) {
      const configChanged =
        existingSession.modelName !== config.modelName ||
        existingSession.permissionMode !== config.permissionMode;

      // 配置未改变，复用会话
      if (!configChanged) {
        // 更新最后活动时间
        existingSession.lastActivity = new Date();
        return existingSession;
      }

      // 配置改变，销毁旧会话
      this.logger.info(
        `Configuration changed for ${sessionKey}, destroying old session`
      );
      await this.destroySession(sessionKey);
    }

    // 检查会话数限制，如果达到上限则淘汰最老的会话
    if (this.sessions.size >= this.MAX_SESSIONS) {
      this.logger.warn(
        `Session limit reached (${this.MAX_SESSIONS}), evicting oldest session`
      );
      await this.evictOldestSession();
    }

    // 创建新会话
    return await this.createSession(userId, workspaceId, config);
  }

  /**
   * 创建新会话
   *
   * @param userId - 用户 ID
   * @param workspaceId - 工作区 ID
   * @param config - 会话配置
   * @returns 新创建的会话
   */
  private async createSession(
    userId: string,
    workspaceId: string,
    config: { modelName: IFlowModel; permissionMode: IFlowPermissionMode }
  ): Promise<IFlowSession> {
    const sessionKey = this.getSessionKey(userId, workspaceId);

    this.logger.info(
      `Creating new session for ${sessionKey} with model=${config.modelName}, permission=${config.permissionMode}`
    );

    // 确保工作区存在
    await ensureWorkspace(workspaceId, userId);

    // 加载历史消息并构建上下文
    let historyContext: string | undefined;
    try {
      const historicalMessages = await getIFlowMessagesByWorkspaceId(workspaceId);

      if (historicalMessages && historicalMessages.length > 0) {
        // 只保留最近的 N 条消息作为上下文
        const recentMessages = historicalMessages.slice(-this.MAX_CONTEXT_MESSAGES);

        this.logger.info(
          `Found ${historicalMessages.length} historical messages, will use recent ${recentMessages.length} for first message`
        );

        // 构建历史对话重放文本 - 直接以对话形式重放，不加任何提示
        // 这样AI会认为这些是真实发生的对话，而不是"别人告诉它的"
        const conversationHistory = recentMessages
          .map((msg) => {
            const content = msg.content || "";
            // 限制每条消息最大长度
            const truncatedContent =
              content.length > this.MAX_MESSAGE_LENGTH
                ? content.substring(0, this.MAX_MESSAGE_LENGTH) + "..."
                : content;

            // 直接返回内容，不加 "用户:" "助手:" 标签
            // SDK 会自然地理解这是对话流
            return truncatedContent;
          })
          .join("\n\n");

        // 直接使用历史内容，不加任何包装
        historyContext = conversationHistory + "\n\n";

        this.logger.info(
          `History context built (${historyContext.length} chars, ${recentMessages.length} messages)`
        );
      } else {
        this.logger.info(
          `No historical messages found for ${sessionKey}, starting fresh conversation`
        );
      }
    } catch (historyError) {
      this.logger.error(
        `Failed to load historical context for ${sessionKey}`,
        historyError
      );
      // 继续创建会话，即使历史加载失败
    }

    // 创建 iFlow Client 配置
    const clientConfig: IFlowClientConfig = {
      workspaceId,
      userId,
      modelName: config.modelName,
      permissionMode: config.permissionMode,
      // 不再通过 contextPrompt 传递历史
    };

    // 创建并连接 iFlow Client（createIFlowClient 内部已经调用 connect）
    let client: IFlowClient;
    try {
      client = await createIFlowClient(clientConfig);
      this.logger.info(`iFlow Client connected for ${sessionKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to create/connect iFlow Client for ${sessionKey}`,
        error
      );
      throw new Error(`Failed to connect to iFlow: ${error}`);
    }

    // 创建会话对象
    const session: IFlowSession = {
      id: crypto.randomUUID(),
      userId,
      workspaceId,
      client,
      modelName: config.modelName,
      permissionMode: config.permissionMode,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      historyContext, // 保存历史上下文
      isFirstMessage: true, // 标记为首次消息
    };

    // 存储会话
    this.sessions.set(sessionKey, session);

    // 更新统计
    this.stats.totalCreated++;

    this.logger.info(
      `Session created: ${session.id} for ${sessionKey} (total: ${this.sessions.size}/${this.MAX_SESSIONS})`
    );

    return session;
  }

  /**
   * 销毁会话
   *
   * @param sessionKey - 会话 Key
   */
  async destroySession(sessionKey: string): Promise<void> {
    const session = this.sessions.get(sessionKey);
    if (!session) {
      return;
    }

    this.logger.info(`Destroying session ${session.id} (${sessionKey})`);

    try {
      // 断开 iFlow Client
      await session.client.disconnect();
      this.logger.info(`iFlow Client disconnected for ${sessionKey}`);
    } catch (error) {
      this.logger.error(
        `Error disconnecting client for ${sessionKey}`,
        error
      );
    }

    // 从 Map 中删除
    this.sessions.delete(sessionKey);

    // 更新统计
    this.stats.totalDestroyed++;

    this.logger.info(`Session ${session.id} destroyed (remaining: ${this.sessions.size})`);
  }

  /**
   * 获取会话 Key
   *
   * @param userId - 用户 ID
   * @param workspaceId - 工作区 ID
   * @returns 会话 Key
   */
  private getSessionKey(userId: string, workspaceId: string): string {
    return `${userId}:${workspaceId}`;
  }

  /**
   * 启动自动清理定时器
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);

    // 确保定时器不会阻止进程退出
    this.cleanupTimer.unref();

    this.logger.info("Cleanup timer started");
  }

  /**
   * 停止自动清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      this.logger.info("Cleanup timer stopped");
    }
  }

  /**
   * 清理过期会话
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const expiredSessions: string[] = [];

    // 找出所有过期会话
    for (const [sessionKey, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity.getTime();

      if (inactiveTime > this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionKey);
      }
    }

    // 销毁过期会话
    if (expiredSessions.length > 0) {
      this.logger.info(
        `Cleaning up ${expiredSessions.length} expired sessions`
      );

      for (const sessionKey of expiredSessions) {
        await this.destroySession(sessionKey);
      }
    }
  }

  /**
   * 淘汰最不活跃的会话（LRU策略）
   * 当会话数达到上限时调用
   */
  private async evictOldestSession(): Promise<void> {
    if (this.sessions.size === 0) {
      return;
    }

    // 找出最不活跃的会话
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [sessionKey, session] of this.sessions.entries()) {
      const lastActivityTime = session.lastActivity.getTime();
      if (lastActivityTime < oldestTime) {
        oldestTime = lastActivityTime;
        oldestKey = sessionKey;
      }
    }

    // 淘汰最老的会话
    if (oldestKey) {
      const session = this.sessions.get(oldestKey);
      this.logger.warn(
        `Evicting oldest session: ${session?.id} (${oldestKey}), last active: ${new Date(oldestTime).toISOString()}`
      );
      await this.destroySession(oldestKey);
      this.stats.evictionCount++;
    }
  }

  /**
   * 获取活动会话数量
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 获取所有活动会话信息（用于监控）
   */
  getActiveSessions(): Array<{
    sessionId: string;
    userId: string;
    workspaceId: string;
    modelName: string;
    permissionMode: string;
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
  }> {
    return Array.from(this.sessions.values()).map((session) => ({
      sessionId: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      modelName: session.modelName,
      permissionMode: session.permissionMode,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      messageCount: session.messageCount,
    }));
  }

  /**
   * 获取会话统计信息（用于监控和调试）
   */
  getStats(): {
    activeSessions: number;
    maxSessions: number;
    totalCreated: number;
    totalDestroyed: number;
    evictionCount: number;
    utilizationPercent: number;
  } {
    return {
      activeSessions: this.sessions.size,
      maxSessions: this.MAX_SESSIONS,
      totalCreated: this.stats.totalCreated,
      totalDestroyed: this.stats.totalDestroyed,
      evictionCount: this.stats.evictionCount,
      utilizationPercent: Math.round(
        (this.sessions.size / this.MAX_SESSIONS) * 100
      ),
    };
  }

  /**
   * 销毁用户的所有会话
   *
   * @param userId - 用户 ID
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.keys()).filter((key) =>
      key.startsWith(`${userId}:`)
    );

    this.logger.info(
      `Destroying ${userSessions.length} sessions for user ${userId}`
    );

    for (const sessionKey of userSessions) {
      await this.destroySession(sessionKey);
    }
  }

  /**
   * 销毁所有会话（用于优雅关闭）
   */
  async destroyAllSessions(): Promise<void> {
    this.logger.info(
      `Destroying all ${this.sessions.size} sessions`
    );

    const sessionKeys = Array.from(this.sessions.keys());

    for (const sessionKey of sessionKeys) {
      await this.destroySession(sessionKey);
    }

    this.stopCleanup();
  }
}

/**
 * 全局会话管理器实例
 */
export const sessionManager = new IFlowSessionManager();

/**
 * 优雅关闭处理
 */
if (typeof process !== "undefined") {
  const gracefulShutdown = async () => {
    const logger = createLogger("SessionManager");
    logger.info("Graceful shutdown initiated");
    await sessionManager.destroyAllSessions();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}
