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
   * 清理定时器
   */
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    // 启动自动清理定时器
    this.startCleanup();
  }

  /**
   * 获取或创建会话
   *
   * 如果会话存在且配置未改变，则复用现有会话
   * 如果配置改变，则销毁旧会话并创建新会话
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
      console.log(
        `[SessionManager] Configuration changed for ${sessionKey}, destroying old session`
      );
      await this.destroySession(sessionKey);
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

    console.log(
      `[SessionManager] Creating new session for ${sessionKey} with model=${config.modelName}, permission=${config.permissionMode}`
    );

    // 确保工作区存在
    await ensureWorkspace(workspaceId, userId);

    // 加载历史消息并构建上下文摘要
    let contextPrompt: string | undefined;
    try {
      const historicalMessages = await getIFlowMessagesByWorkspaceId(workspaceId);

      if (historicalMessages && historicalMessages.length > 0) {
        console.log(
          `[SessionManager] Found ${historicalMessages.length} historical messages, building context...`
        );

        // 使用所有历史消息构建上下文
        const conversationHistory = historicalMessages
          .map((msg) => {
            const role = msg.role === "user" ? "User" : "Assistant";
            const content = msg.content || "";
            // 限制每条消息最大 1000 字符
            const truncatedContent =
              content.length > 1000
                ? content.substring(0, 1000) + "..."
                : content;
            return `${role}: ${truncatedContent}`;
          })
          .join("\n\n");

        contextPrompt = `[CONVERSATION HISTORY - This is a continued conversation. Below is the recent chat history for context:]\n\n${conversationHistory}\n\n[END OF HISTORY - Please continue the conversation naturally based on this context.]`;

        console.log(
          `[SessionManager] Context prompt built (${contextPrompt.length} chars)`
        );
      } else {
        console.log(
          `[SessionManager] No historical messages found for ${sessionKey}`
        );
      }
    } catch (historyError) {
      console.error(
        `[SessionManager] Failed to load historical context for ${sessionKey}:`,
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
      contextPrompt, // 传递上下文提示
    };

    // 创建并连接 iFlow Client（createIFlowClient 内部已经调用 connect）
    let client: IFlowClient;
    try {
      client = await createIFlowClient(clientConfig);
      console.log(`[SessionManager] iFlow Client connected for ${sessionKey}`);
    } catch (error) {
      console.error(
        `[SessionManager] Failed to create/connect iFlow Client for ${sessionKey}:`,
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
    };

    // 存储会话
    this.sessions.set(sessionKey, session);

    console.log(
      `[SessionManager] Session created: ${session.id} for ${sessionKey}`
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

    console.log(`[SessionManager] Destroying session ${session.id} (${sessionKey})`);

    try {
      // 断开 iFlow Client
      await session.client.disconnect();
      console.log(`[SessionManager] iFlow Client disconnected for ${sessionKey}`);
    } catch (error) {
      console.error(
        `[SessionManager] Error disconnecting client for ${sessionKey}:`,
        error
      );
    }

    // 从 Map 中删除
    this.sessions.delete(sessionKey);

    console.log(`[SessionManager] Session ${session.id} destroyed`);
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

    console.log("[SessionManager] Cleanup timer started");
  }

  /**
   * 停止自动清理定时器
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      console.log("[SessionManager] Cleanup timer stopped");
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
      console.log(
        `[SessionManager] Cleaning up ${expiredSessions.length} expired sessions`
      );

      for (const sessionKey of expiredSessions) {
        await this.destroySession(sessionKey);
      }
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
   * 销毁用户的所有会话
   *
   * @param userId - 用户 ID
   */
  async destroyUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.keys()).filter((key) =>
      key.startsWith(`${userId}:`)
    );

    console.log(
      `[SessionManager] Destroying ${userSessions.length} sessions for user ${userId}`
    );

    for (const sessionKey of userSessions) {
      await this.destroySession(sessionKey);
    }
  }

  /**
   * 销毁所有会话（用于优雅关闭）
   */
  async destroyAllSessions(): Promise<void> {
    console.log(
      `[SessionManager] Destroying all ${this.sessions.size} sessions`
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
    console.log("[SessionManager] Graceful shutdown initiated");
    await sessionManager.destroyAllSessions();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}
