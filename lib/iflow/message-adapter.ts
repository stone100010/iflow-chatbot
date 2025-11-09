/**
 * iFlow 消息转换器
 *
 * 负责将 iFlow SDK 的消息格式转换为前端可用的 SSE 格式
 */

import type {
  IFlowSDKMessage,
  TextDeltaMessage,
  ToolCallMessage,
  PlanMessage,
  FinishMessage,
  ErrorMessage,
  SSEData,
} from "./types";

/**
 * 将 iFlow SDK 消息适配为 SSE 数据
 *
 * @param message - iFlow SDK 原始消息
 * @returns SSE 数据格式（如果无法识别则返回 null）
 */
export function adaptIFlowMessage(message: any): SSEData | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  // 详细记录收到的消息
  console.log("[MessageAdapter] Received message:", JSON.stringify(message, null, 2));

  // 根据消息类型进行适配
  // 注意：iFlow SDK 实际返回的类型是 assistant, tool_call, task_finish 等
  switch (message.type) {
    case "assistant":  // iFlow SDK 实际类型
      return adaptAssistant(message);

    case "text-delta":  // 保留兼容
      return adaptTextDelta(message);

    case "tool_call":
      return adaptToolCall(message);

    case "plan":
      return adaptPlan(message);

    case "task_finish":  // iFlow SDK 实际类型
      return adaptTaskFinish(message);

    case "finish":  // 保留兼容
      return adaptFinish(message);

    case "error":
      console.error("[MessageAdapter] Error message details:", JSON.stringify(message, null, 2));
      return adaptError(message);

    default:
      console.warn("[MessageAdapter] Unknown message type:", message.type, "Full message:", JSON.stringify(message, null, 2));
      return null;
  }
}

/**
 * 适配 assistant 消息（iFlow SDK 实际类型）
 * assistant 消息包含文本内容，类似于 text-delta
 */
function adaptAssistant(message: any): TextDeltaMessage {
  // iFlow SDK 的 assistant 消息包含 chunk 字段（不是 content！）
  // chunk 是一个对象，包含 text 属性
  const chunkText = message.chunk?.text || message.content || message.text || "";
  const text = String(chunkText);

  if (text && text.length > 0) {
    console.log("[MessageAdapter] Adapting assistant message, text length:", text.length, "preview:", text.substring(0, Math.min(50, text.length)));
  }

  return {
    type: "text-delta",
    text: text,
    agentInfo: message.agentInfo
      ? {
          type: message.agentInfo.type || "unknown",
          name: message.agentInfo.name,
          description: message.agentInfo.description,
        }
      : undefined,
  };
}

/**
 * 适配文本增量消息
 */
function adaptTextDelta(message: any): TextDeltaMessage {
  return {
    type: "text-delta",
    text: message.text || "",
    agentInfo: message.agentInfo
      ? {
          type: message.agentInfo.type || "unknown",
          name: message.agentInfo.name,
          description: message.agentInfo.description,
        }
      : undefined,
  };
}

/**
 * 适配工具调用消息
 * iFlow SDK 的 tool_call 消息包含 toolName, status, label, args, content 等字段
 */
function adaptToolCall(message: any): ToolCallMessage {
  console.log("[MessageAdapter] Adapting tool_call:", message.toolName, "status:", message.status);

  return {
    type: "tool-call",
    toolName: message.toolName || message.tool_name || "unknown",
    status: message.status || "pending",
    label: message.label,
    args: message.args || message.arguments,
    result: message.result || message.content,
    error: message.error,
  };
}

/**
 * 适配任务计划消息
 */
function adaptPlan(message: any): PlanMessage {
  const entries = Array.isArray(message.entries) ? message.entries : [];

  return {
    type: "plan",
    entries: entries.map((entry: any, index: number) => ({
      id: entry.id || `plan-${index}`,
      content: entry.content || "",
      activeForm: entry.activeForm || entry.content || "",
      status: entry.status || "pending",
      priority: entry.priority,
    })),
  };
}

/**
 * 适配 task_finish 消息（iFlow SDK 实际类型）
 * task_finish 表示任务完成
 */
function adaptTaskFinish(message: any): FinishMessage {
  console.log("[MessageAdapter] Adapting task_finish message");

  return {
    type: "finish",
    stopReason: message.stopReason || message.reason || "end_turn",
  };
}

/**
 * 适配完成消息
 */
function adaptFinish(message: any): FinishMessage {
  return {
    type: "finish",
    stopReason: message.stopReason || "end_turn",
  };
}

/**
 * 适配错误消息
 */
function adaptError(message: any): ErrorMessage {
  // 尝试多个可能的错误字段
  const errorText =
    message.error ||
    message.message ||
    message.description ||
    message.details ||
    (message.data && typeof message.data === 'string' ? message.data : null) ||
    "Unknown error";

  console.error("[MessageAdapter] Adapted error:", {
    errorText,
    code: message.code,
    originalMessage: message
  });

  return {
    type: "error",
    error: errorText,
    code: message.code,
  };
}

/**
 * 格式化 SSE 消息
 *
 * @param data - SSE 数据
 * @returns 格式化的 SSE 字符串
 */
export function formatSSE(data: SSEData): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * 批量适配 iFlow 消息流
 *
 * @param messages - iFlow SDK 消息异步迭代器
 * @returns SSE 数据异步迭代器
 */
export async function* adaptIFlowStream(
  messages: AsyncIterable<any>
): AsyncGenerator<SSEData> {
  for await (const message of messages) {
    const adapted = adaptIFlowMessage(message);
    if (adapted) {
      yield adapted;
    }
  }
}

/**
 * 创建 SSE 响应流
 *
 * @param messages - iFlow SDK 消息异步迭代器
 * @returns ReadableStream
 */
export function createSSEStream(messages: AsyncIterable<any>): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const message of messages) {
          const adapted = adaptIFlowMessage(message);
          if (adapted) {
            const sseData = formatSSE(adapted);
            controller.enqueue(encoder.encode(sseData));
          }

          // 如果是结束消息，关闭流
          if (adapted?.type === "finish" || adapted?.type === "error") {
            controller.close();
            break;
          }
        }
      } catch (error) {
        console.error("[MessageAdapter] Error in SSE stream:", error);

        // 发送错误消息
        const errorMessage: ErrorMessage = {
          type: "error",
          error: error instanceof Error ? error.message : "Stream error",
        };
        controller.enqueue(encoder.encode(formatSSE(errorMessage)));

        controller.close();
      }
    },

    cancel() {
      console.log("[MessageAdapter] SSE stream cancelled by client");
    },
  });
}
