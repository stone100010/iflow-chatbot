/**
 * useIFlowChat Hook
 *
 * 核心前端 Hook，负责管理 iFlow 聊天状态、发送消息和接收 SSE 流
 */

"use client";

import { useCallback, useReducer, useRef, useState, useEffect } from "react";
import { nanoid } from "nanoid";
import type {
  IFlowChatMessage,
  IFlowModel,
  IFlowPermissionMode,
  SSEData,
  ToolCall,
  PlanEntry,
} from "@/lib/iflow/types";
import { PerformanceMonitor } from "@/lib/performance-monitor";

/**
 * 消息操作类型
 */
type MessageAction =
  | { type: "SET_MESSAGES"; payload: IFlowChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: IFlowChatMessage }
  | {
      type: "UPDATE_LAST_MESSAGE";
      payload: Partial<IFlowChatMessage>;
    }
  | {
      type: "UPDATE_LAST_CONTENT";
      payload: string;
      agentInfo?: IFlowChatMessage["agentInfo"];
    }
  | {
      type: "UPDATE_LAST_TOOL_CALL";
      payload: ToolCall;
    }
  | {
      type: "UPDATE_LAST_PLAN";
      payload: PlanEntry[];
    }
  | {
      type: "FINISH_LAST_MESSAGE";
      payload: string | undefined;
    }
  | { type: "CLEAR_MESSAGES" };

/**
 * 消息 Reducer - 优化的状态更新逻辑
 * 避免每次更新都复制整个消息数组
 */
function messagesReducer(
  state: IFlowChatMessage[],
  action: MessageAction
): IFlowChatMessage[] {
  switch (action.type) {
    case "SET_MESSAGES":
      return action.payload;

    case "ADD_MESSAGE":
      return [...state, action.payload];

    case "UPDATE_LAST_MESSAGE": {
      if (state.length === 0) return state;
      const newState = state.slice();
      const lastIndex = newState.length - 1;
      newState[lastIndex] = {
        ...newState[lastIndex],
        ...action.payload,
      };
      return newState;
    }

    case "UPDATE_LAST_CONTENT": {
      if (state.length === 0) return state;
      const lastMsg = state[state.length - 1];
      if (lastMsg.role !== "assistant") return state;

      const newState = state.slice();
      const lastIndex = newState.length - 1;
      newState[lastIndex] = {
        ...lastMsg,
        content: action.payload,
        ...(action.agentInfo && { agentInfo: action.agentInfo }),
      };
      return newState;
    }

    case "UPDATE_LAST_TOOL_CALL": {
      if (state.length === 0) return state;
      const lastMsg = state[state.length - 1];
      if (lastMsg.role !== "assistant") return state;

      const toolCalls = lastMsg.toolCalls || [];
      const existingIndex = toolCalls.findIndex(
        (tc) => tc.toolName === action.payload.toolName
      );

      const newToolCalls =
        existingIndex >= 0
          ? toolCalls.map((tc, idx) =>
              idx === existingIndex
                ? { ...tc, ...action.payload }
                : tc
            )
          : [...toolCalls, action.payload];

      const newState = state.slice();
      const lastIndex = newState.length - 1;
      newState[lastIndex] = {
        ...lastMsg,
        toolCalls: newToolCalls,
      };
      return newState;
    }

    case "UPDATE_LAST_PLAN": {
      if (state.length === 0) return state;
      const lastMsg = state[state.length - 1];
      if (lastMsg.role !== "assistant") return state;

      const newState = state.slice();
      const lastIndex = newState.length - 1;
      newState[lastIndex] = {
        ...lastMsg,
        plan: action.payload,
      };
      return newState;
    }

    case "FINISH_LAST_MESSAGE": {
      if (state.length === 0) return state;
      const lastMsg = state[state.length - 1];
      if (lastMsg.role !== "assistant") return state;

      const newState = state.slice();
      const lastIndex = newState.length - 1;
      newState[lastIndex] = {
        ...lastMsg,
        stopReason: action.payload,
      };
      return newState;
    }

    case "CLEAR_MESSAGES":
      return [];

    default:
      return state;
  }
}

/**
 * Hook 配置选项
 */
export interface UseIFlowChatOptions {
  workspaceId: string;
  initialMessages?: IFlowChatMessage[];
  modelName?: IFlowModel;
  permissionMode?: IFlowPermissionMode;
  loadHistory?: boolean; // 是否加载历史消息
  csrfToken?: string | null; // CSRF token
  onError?: (error: Error) => void;
  onFinish?: (message: IFlowChatMessage) => void;
}

/**
 * Hook 返回值
 */
export interface UseIFlowChatReturn {
  messages: IFlowChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  isStreaming: boolean;
  isLoadingHistory: boolean; // 是否正在加载历史
  currentConfig: {
    modelName: IFlowModel;
    permissionMode: IFlowPermissionMode;
  };
  updateConfig: (config: {
    modelName?: IFlowModel;
    permissionMode?: IFlowPermissionMode;
  }) => void;
  error: Error | null;
  clearMessages: () => void;
}

/**
 * useIFlowChat Hook
 *
 * @param options - Hook 配置选项
 * @returns Hook 返回值
 */
export function useIFlowChat(
  options: UseIFlowChatOptions
): UseIFlowChatReturn {
  const {
    workspaceId,
    initialMessages = [],
    modelName = "MiniMax-M2",
    permissionMode = "yolo",
    loadHistory = false,
    csrfToken,
    onError,
    onFinish,
  } = options;

  // 状态管理 - 使用 useReducer 优化性能
  const [messages, dispatch] = useReducer(messagesReducer, initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentConfig, setCurrentConfig] = useState({
    modelName,
    permissionMode,
  });

  // AbortController 用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 加载历史消息
   */
  useEffect(() => {
    if (!loadHistory) return;

    let isCancelled = false;

    const loadHistoryMessages = async () => {
      PerformanceMonitor.start("Load-History");
      setIsLoadingHistory(true);
      setError(null);

      try {
        console.log(`📜 [useIFlowChat] Loading history for workspace ${workspaceId}`);

        const fetchStart = performance.now();
        const response = await fetch(
          `/api/iflow/messages?workspaceId=${workspaceId}`
        );
        const fetchDuration = performance.now() - fetchStart;
        PerformanceMonitor.logNetworkRequest("/api/iflow/messages", fetchDuration);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (isCancelled) return;

        // 转换消息格式
        const loadedMessages: IFlowChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          agentInfo: msg.agentInfo,
          toolCalls: msg.toolCalls,
          plan: msg.plan,
          stopReason: msg.stopReason,
          createdAt: new Date(msg.createdAt),
        }));

        console.log(`[useIFlowChat] Loaded ${loadedMessages.length} messages from history`);
        dispatch({ type: "SET_MESSAGES", payload: loadedMessages });
      } catch (err: any) {
        if (isCancelled) return;

        console.error("[useIFlowChat] Failed to load history:", err);
        const loadError = err instanceof Error ? err : new Error(String(err));
        setError(loadError);
        if (onError) {
          onError(loadError);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistoryMessages();

    return () => {
      isCancelled = true;
    };
  }, [workspaceId, loadHistory]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        console.warn("[useIFlowChat] Empty message, ignoring");
        return;
      }

      if (isStreaming) {
        console.warn("[useIFlowChat] Already streaming, ignoring new message");
        return;
      }

      PerformanceMonitor.start("SendMessage-Complete");
      console.log("💬 [useIFlowChat] Sending message:", content.substring(0, 50));

      // 清除之前的错误
      setError(null);

      // 添加用户消息
      const userMessage: IFlowChatMessage = {
        id: nanoid(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });

      // 创建助手消息占位符
      const assistantMessage: IFlowChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: "",
        toolCalls: [],
        plan: [],
        createdAt: new Date(),
      };
      dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });

      setIsStreaming(true);

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      try {
        // 发送请求到 API
        console.log("📡 [useIFlowChat] Fetching /api/iflow/chat with workspaceId:", workspaceId);

        const fetchStart = performance.now();
        const response = await fetch("/api/iflow/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(csrfToken && { "x-csrf-token": csrfToken }),
          },
          body: JSON.stringify({
            workspaceId,
            message: content.trim(),
            modelName: currentConfig.modelName,
            permissionMode: currentConfig.permissionMode,
          }),
          signal: abortControllerRef.current.signal,
        });
        const fetchDuration = performance.now() - fetchStart;
        PerformanceMonitor.logNetworkRequest("/api/iflow/chat (request)", fetchDuration);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        if (!response.body) {
          throw new Error("Response body is null");
        }

        // 读取 SSE 流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("[useIFlowChat] Stream completed");
            break;
          }

          // 解码数据块
          buffer += decoder.decode(value, { stream: true });

          // 按行分割
          const lines = buffer.split("\n");

          // 保留最后一个不完整的行
          buffer = lines.pop() || "";

          // 处理每一行
          for (const line of lines) {
            if (!line.trim()) continue;

            // SSE 格式: data: {...}
            if (line.startsWith("data: ")) {
              try {
                const jsonData = line.slice(6); // 去掉 "data: "
                const data = JSON.parse(jsonData) as SSEData;

                // 使用 dispatch 更新消息状态 - 避免复制整个数组
                switch (data.type) {
                  case "text-delta":
                    // iFlow SDK 返回完整文本,直接替换而不是追加
                    dispatch({
                      type: "UPDATE_LAST_CONTENT",
                      payload: data.text,
                      agentInfo: data.agentInfo,
                    });
                    break;

                  case "tool-call":
                    // 更新工具调用
                    const toolCall: ToolCall = {
                      id: nanoid(),
                      toolName: data.toolName,
                      status: data.status,
                      label: data.label,
                      args: data.args,
                      result: data.result,
                      error: data.error,
                    };
                    dispatch({
                      type: "UPDATE_LAST_TOOL_CALL",
                      payload: toolCall,
                    });
                    break;

                  case "plan":
                    // 更新任务计划
                    dispatch({
                      type: "UPDATE_LAST_PLAN",
                      payload: data.entries,
                    });
                    break;

                  case "finish":
                    // 标记完成
                    dispatch({
                      type: "FINISH_LAST_MESSAGE",
                      payload: data.stopReason,
                    });
                    break;

                  case "error":
                    // 错误处理
                    console.error("[useIFlowChat] Stream error:", data.error);
                    const streamError = new Error(data.error);
                    setError(streamError);
                    if (onError) {
                      onError(streamError);
                    }
                    break;
                }

                // 如果是完成或错误消息，结束流
                if (data.type === "finish" || data.type === "error") {
                  // 触发 onFinish 回调
                  if (data.type === "finish" && onFinish) {
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg?.role === "assistant") {
                      onFinish(lastMsg);
                    }
                  }
                  break;
                }
              } catch (parseError) {
                console.error("[useIFlowChat] Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("[useIFlowChat] Request aborted by user");
        } else {
          console.error("[useIFlowChat] Error:", err);
          const fetchError =
            err instanceof Error ? err : new Error(String(err));
          setError(fetchError);
          if (onError) {
            onError(fetchError);
          }

          // 在最后一条消息中显示错误
          dispatch({
            type: "UPDATE_LAST_CONTENT",
            payload: `错误: ${fetchError.message}`,
          });
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
        PerformanceMonitor.end("SendMessage-Complete");
      }
    },
    [
      workspaceId,
      currentConfig,
      isStreaming,
      csrfToken,
      onError,
      onFinish,
    ]
  );

  /**
   * 停止生成
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      console.log("[useIFlowChat] Stopping generation");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 更新配置
   */
  const updateConfig = useCallback(
    (config: {
      modelName?: IFlowModel;
      permissionMode?: IFlowPermissionMode;
    }) => {
      setCurrentConfig((prev) => ({
        modelName: config.modelName ?? prev.modelName,
        permissionMode: config.permissionMode ?? prev.permissionMode,
      }));
    },
    []
  );

  /**
   * 清除消息
   */
  const clearMessages = useCallback(() => {
    dispatch({ type: "CLEAR_MESSAGES" });
  }, []);

  return {
    messages,
    sendMessage,
    stopGeneration,
    isStreaming,
    isLoadingHistory,
    currentConfig,
    updateConfig,
    error,
    clearMessages,
  };
}
