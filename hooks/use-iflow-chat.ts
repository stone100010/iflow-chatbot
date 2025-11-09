/**
 * useIFlowChat Hook
 *
 * 核心前端 Hook，负责管理 iFlow 聊天状态、发送消息和接收 SSE 流
 */

"use client";

import { useCallback, useRef, useState, useEffect } from "react";
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
 * Hook 配置选项
 */
export interface UseIFlowChatOptions {
  workspaceId: string;
  initialMessages?: IFlowChatMessage[];
  modelName?: IFlowModel;
  permissionMode?: IFlowPermissionMode;
  loadHistory?: boolean; // 是否加载历史消息
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
    onError,
    onFinish,
  } = options;

  // 状态管理
  const [messages, setMessages] = useState<IFlowChatMessage[]>(initialMessages);
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
        setMessages(loadedMessages);
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
      setMessages((prev) => [...prev, userMessage]);

      // 创建助手消息占位符
      const assistantMessage: IFlowChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: "",
        toolCalls: [],
        plan: [],
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

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

                // 更新消息状态
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];

                  if (lastMsg.role !== "assistant") {
                    console.warn(
                      "[useIFlowChat] Last message is not assistant, skipping update"
                    );
                    return prev;
                  }

                  switch (data.type) {
                    case "text-delta":
                      // iFlow SDK 返回完整文本,直接替换而不是追加
                      lastMsg.content = data.text;
                      if (data.agentInfo) {
                        lastMsg.agentInfo = data.agentInfo;
                      }
                      break;

                    case "tool-call":
                      // 更新工具调用
                      if (!lastMsg.toolCalls) {
                        lastMsg.toolCalls = [];
                      }

                      // 查找已存在的工具调用
                      const existingToolIndex = lastMsg.toolCalls.findIndex(
                        (tc) => tc.toolName === data.toolName
                      );

                      const toolCall: ToolCall = {
                        id: nanoid(),
                        toolName: data.toolName,
                        status: data.status,
                        label: data.label,
                        args: data.args,
                        result: data.result,
                        error: data.error,
                      };

                      if (existingToolIndex >= 0) {
                        // 更新已存在的工具调用
                        lastMsg.toolCalls[existingToolIndex] = {
                          ...lastMsg.toolCalls[existingToolIndex],
                          ...toolCall,
                        };
                      } else {
                        // 添加新的工具调用
                        lastMsg.toolCalls.push(toolCall);
                      }
                      break;

                    case "plan":
                      // 更新任务计划
                      lastMsg.plan = data.entries;
                      break;

                    case "finish":
                      // 标记完成
                      lastMsg.stopReason = data.stopReason;
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

                  return updated;
                });

                // 如果是完成或错误消息，结束流
                if (data.type === "finish" || data.type === "error") {
                  // 触发 onFinish 回调
                  if (data.type === "finish" && onFinish) {
                    setMessages((prev) => {
                      const lastMsg = prev[prev.length - 1];
                      if (lastMsg.role === "assistant") {
                        onFinish(lastMsg);
                      }
                      return prev;
                    });
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
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === "assistant") {
              lastMsg.content = `错误: ${fetchError.message}`;
            }
            return updated;
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
    setMessages([]);
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
