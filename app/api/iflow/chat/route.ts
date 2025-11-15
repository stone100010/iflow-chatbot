/**
 * iFlow 聊天 API 路由
 *
 * 处理用户的聊天请求，使用 iFlow CLI SDK 进行流式响应
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { sessionManager } from "@/lib/iflow/session-manager";
import { adaptIFlowMessage } from "@/lib/iflow/message-adapter";
import type { IFlowModel, IFlowPermissionMode } from "@/lib/iflow/types";
import { isValidModel, isValidPermissionMode } from "@/lib/iflow/client";
import { validateCsrfToken } from "@/lib/security/csrf";
import { chatRateLimiter, createRateLimitResponse } from "@/lib/security/rate-limiter";
import {
  getIFlowMessageCountToday,
  saveIFlowMessage,
  updateWorkspaceLastAccessed,
  getWorkspaceById,
  createWorkspace,
} from "@/lib/db/queries";

export const maxDuration = 60;

/**
 * 请求体验证 Schema
 */
const chatRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  modelName: z.string(),
  permissionMode: z.string(),
});

/**
 * 根据用户消息生成对话名称
 * 简单截取用户消息的前20个字符
 */
function generateWorkspaceName(userMessage: string): string {
  const cleanMessage = userMessage.trim();
  if (cleanMessage.length <= 20) {
    return cleanMessage;
  }
  return cleanMessage.substring(0, 20) + "...";
}

/**
 * 用户每日消息限制
 */
const MESSAGE_LIMITS = {
  regular: 100,
  premium: 1000,
};

/**
 * 检查用户每日消息限制
 */
async function checkDailyMessageLimit(
  userId: string,
  userType: "regular"
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = MESSAGE_LIMITS[userType];
  const used = await getIFlowMessageCountToday(userId);

  return {
    allowed: used < limit,
    remaining: limit - used,
  };
}

/**
 * POST /api/iflow/chat
 *
 * 主聊天接口，使用 SSE 流式返回响应
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userType = session.user.type;

    console.log(`[Chat API] Request from user: ${userId} (${userType})`);

    // 2. CSRF 保护验证
    const csrfToken = request.headers.get("x-csrf-token");
    if (!validateCsrfToken(csrfToken, userId)) {
      console.warn(`[Chat API] CSRF validation failed for user ${userId}`);
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    // 3. 速率限制检查
    const rateLimitResult = chatRateLimiter.check(userId);
    if (!rateLimitResult.allowed) {
      console.warn(`[Chat API] Rate limit exceeded for user ${userId}`);
      const response = createRateLimitResponse(rateLimitResult.resetTime);
      return NextResponse.json(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // 添加速率限制信息到响应头（用于客户端显示）
    const rateLimitHeaders = {
      "X-RateLimit-Limit": "20",
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
    };

    // 4. 解析和验证请求体
    let body: z.infer<typeof chatRequestSchema>;
    try {
      const json = await request.json();
      body = chatRequestSchema.parse(json);
    } catch (error) {
      console.error("[Chat API] Invalid request body:", error);
      return NextResponse.json(
        { error: "Invalid request body", details: error },
        { status: 400 }
      );
    }

    const { workspaceId, message, modelName, permissionMode } = body;

    // 5. 验证模型和权限模式
    if (!isValidModel(modelName)) {
      return NextResponse.json(
        { error: `Invalid model: ${modelName}` },
        { status: 400 }
      );
    }

    if (!isValidPermissionMode(permissionMode)) {
      return NextResponse.json(
        { error: `Invalid permission mode: ${permissionMode}` },
        { status: 400 }
      );
    }

    // 6. 每日消息限额检查
    const rateLimit = await checkDailyMessageLimit(userId, userType);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: MESSAGE_LIMITS[userType],
          remaining: rateLimit.remaining,
        },
        { status: 429 }
      );
    }

    console.log(
      `[Chat API] Processing message for workspace ${workspaceId}, model=${modelName}, permission=${permissionMode}`
    );

    // 7. 确保工作区存在
    let workspace = await getWorkspaceById(workspaceId);

    if (!workspace) {
      // 工作区不存在，创建新工作区
      console.log(`[Chat API] Creating new workspace: ${workspaceId}`);

      // 使用用户第一条消息生成工作区名称
      const generatedName = generateWorkspaceName(message);

      workspace = await createWorkspace({
        id: workspaceId,
        userId,
        name: generatedName,
        path: `/tmp/iflow-workspace-${workspaceId}`,
        modelName,
        permissionMode,
      });

      console.log(`[Chat API] Created workspace: ${workspace.id} with name: "${generatedName}"`);
    } else if (workspace.userId !== userId) {
      // 工作区不属于当前用户
      return NextResponse.json(
        { error: "Forbidden: Not your workspace" },
        { status: 403 }
      );
    }

    // 8. 获取或创建 iFlow 会话
    let iflowSession;
    try {
      iflowSession = await sessionManager.getOrCreateSession(
        userId,
        workspaceId,
        {
          modelName: modelName as IFlowModel,
          permissionMode: permissionMode as IFlowPermissionMode,
        }
      );
      console.log(`[Chat API] Got session: ${iflowSession.id}`);
    } catch (error) {
      console.error("[Chat API] Failed to get session:", error);
      return NextResponse.json(
        {
          error: "Failed to create iFlow session",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // 9. 发送消息到 iFlow
    try {
      // 检查是否是首次消息，如果是则带上历史上下文
      let messageToSend = message;

      if (iflowSession.isFirstMessage && iflowSession.historyContext) {
        // 第一次发送消息时，带上历史上下文
        messageToSend = iflowSession.historyContext + message;
        console.log(`[Chat API] First message with history context (${iflowSession.historyContext.length} chars)`);

        // 标记已发送首次消息
        iflowSession.isFirstMessage = false;
      } else {
        console.log(`[Chat API] Regular message (no history context)`);
      }

      await iflowSession.client.sendMessage(messageToSend);
      console.log(`[Chat API] Message sent to iFlow`);
    } catch (error) {
      console.error("[Chat API] Failed to send message:", error);
      return NextResponse.json(
        {
          error: "Failed to send message to iFlow",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // 10. 创建 SSE 流式响应
    try {
      const messageStream = iflowSession.client.receiveMessages();

      // 收集助手消息数据用于保存
      let assistantContent = "";
      let agentInfo: any = null;
      const toolCalls: any[] = [];
      const planEntries: any[] = [];
      let stopReason: string | undefined;

      // 创建一个转换流来收集数据
      const collectingStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          try {
            for await (const message of messageStream) {
              console.log("[Chat API] Raw iFlow message type:", message.type, "keys:", Object.keys(message));

              const adapted = adaptIFlowMessage(message);

              if (!adapted) {
                console.warn("[Chat API] adaptIFlowMessage returned null for message type:", message.type);
                continue;
              }

              console.log("[Chat API] Adapted message type:", adapted.type);

              if (adapted) {
                // 收集数据
                if (adapted.type === "text-delta") {
                  assistantContent += adapted.text;
                  if (adapted.agentInfo && !agentInfo) {
                    agentInfo = adapted.agentInfo;
                  }
                } else if (adapted.type === "tool-call") {
                  toolCalls.push({
                    id: adapted.toolName + "-" + Date.now(),
                    toolName: adapted.toolName,
                    status: adapted.status,
                    label: adapted.label,
                    args: adapted.args,
                    result: adapted.result,
                    error: adapted.error,
                  });
                } else if (adapted.type === "plan") {
                  planEntries.push(...adapted.entries);
                } else if (adapted.type === "finish") {
                  stopReason = adapted.stopReason;
                }

                // 发送 SSE 数据 - 添加安全检查
                try {
                  const sseData = `data: ${JSON.stringify(adapted)}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                } catch (enqueueError) {
                  // Controller 已关闭，停止发送
                  console.log("[Chat API] Controller closed, stopping message stream");
                  break;
                }

                // 如果是结束消息，保存助手消息并关闭流
                if (adapted.type === "finish" || adapted.type === "error") {
                  // 异步保存助手消息
                  if (assistantContent) {
                    saveIFlowMessage({
                      workspaceId,
                      role: "assistant",
                      content: assistantContent,
                      agentInfo: agentInfo || undefined,
                      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                      plan: planEntries.length > 0 ? planEntries : undefined,
                      stopReason,
                    }).catch((error) => {
                      console.error("[Chat API] Failed to save assistant message:", error);
                    });
                  }

                  // 安全关闭 controller
                  try {
                    controller.close();
                  } catch (closeError) {
                    console.log("[Chat API] Controller already closed in finish handler");
                  }
                  break;
                }
              }
            }
          } catch (error) {
            console.error("[Chat API] Error in message stream:", error);

            // 只有在 controller 还未关闭时才发送错误消息
            try {
              const errorMessage = {
                type: "error",
                error: error instanceof Error ? error.message : "Stream error",
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
            } catch (enqueueError) {
              // Controller 已关闭，忽略错误
              console.log("[Chat API] Controller already closed, skipping error message");
            }

            // 安全关闭 controller
            try {
              controller.close();
            } catch (closeError) {
              // Controller 已关闭，忽略错误
              console.log("[Chat API] Controller already closed");
            }
          }
        },

        cancel() {
          console.log("[Chat API] Stream cancelled by client");
        },
      });

      console.log(`[Chat API] Streaming response started`);

      // 更新会话活动时间和消息计数
      iflowSession.lastActivity = new Date();
      iflowSession.messageCount++;

      // 保存用户消息到数据库（异步，不阻塞响应）
      saveIFlowMessage({
        workspaceId,
        role: "user",
        content: message,
      }).catch((error) => {
        console.error("[Chat API] Failed to save user message:", error);
      });

      // 更新工作区最后访问时间
      updateWorkspaceLastAccessed(workspaceId).catch((error) => {
        console.error(
          "[Chat API] Failed to update workspace last accessed:",
          error
        );
      });

      return new Response(collectingStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no", // Disable nginx buffering
          ...rateLimitHeaders,
        },
      });
    } catch (error) {
      console.error("[Chat API] Failed to create stream:", error);
      return NextResponse.json(
        {
          error: "Failed to create response stream",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Chat API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/iflow/chat
 *
 * CORS 预检请求
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
