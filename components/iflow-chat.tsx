"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useIFlowChat } from "@/hooks/use-iflow-chat";
import { IFlowConfigSelector } from "@/components/iflow-config-selector";
import { IFlowMessageList } from "@/components/iflow-message-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { IFlowModel, IFlowPermissionMode } from "@/lib/iflow/types";
import { PlusIcon, StopIcon } from "@radix-ui/react-icons";
import { ArrowUpIcon, Edit2Icon, CheckIcon, XIcon } from "lucide-react";
import { PerformanceMonitor } from "@/lib/performance-monitor";

interface IFlowChatProps {
  workspaceId: string;
  initialModelName?: IFlowModel;
  initialPermissionMode?: IFlowPermissionMode;
  loadHistory?: boolean; // 是否加载历史消息
}

export function IFlowChat({
  workspaceId,
  initialModelName = "MiniMax-M2",
  initialPermissionMode = "yolo",
  loadHistory = false,
}: IFlowChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 标题编辑状态
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");

  // 页面性能监控 - 只在首次挂载时执行
  useEffect(() => {
    PerformanceMonitor.logPageMetrics();
  }, []);

  // 处理移动端键盘弹出时的滚动问题
  useEffect(() => {
    const handleFocus = () => {
      // 延迟执行，等待虚拟键盘完全弹出
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 300);
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  // 加载工作区名称
  useEffect(() => {
    const loadWorkspaceName = async () => {
      try {
        const response = await fetch(`/api/iflow/workspaces/${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setWorkspaceName(data.name || "Untitled");
        }
      } catch (error) {
        console.error("Failed to load workspace name:", error);
        setWorkspaceName("Untitled");
      }
    };

    if (workspaceId) {
      loadWorkspaceName();
    }
  }, [workspaceId]);

  // 使用 useCallback 稳定回调引用
  const handleError = useCallback((err: Error) => {
    console.error("Chat error:", err);
  }, []);

  const handleFinish = useCallback((msg: any) => {
    console.log("Message finished:", msg);
  }, []);

  const {
    messages,
    sendMessage,
    stopGeneration,
    isStreaming,
    isLoadingHistory,
    currentConfig,
    updateConfig,
    error,
    clearMessages,
  } = useIFlowChat({
    workspaceId,
    modelName: initialModelName,
    permissionMode: initialPermissionMode,
    loadHistory,
    onError: handleError,
    onFinish: handleFinish,
  });

  // 自动滚动到底部 - 使用 requestAnimationFrame 优化性能
  useEffect(() => {
    if (messages.length === 0) return;

    // 使用 requestAnimationFrame 避免频繁滚动
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const rafId = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(rafId);
  }, [messages.length]); // 只在消息数量变化时滚动，而不是每次内容变化

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 优化input change handler，避免重新创建
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // 标题编辑处理
  const handleStartEditTitle = () => {
    setEditingTitle(workspaceName);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!editingTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/iflow/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingTitle.trim() }),
      });

      if (response.ok) {
        setWorkspaceName(editingTitle.trim());
      } else {
        console.error("Failed to update workspace name");
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle("");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部工具栏 - 移动端优化 */}
      <div className="flex items-center justify-between p-2 md:p-4 border-b dark:border-zinc-800">
        <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
          <SidebarTrigger />

          {/* 对话标题 - 支持编辑 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditingTitle ? (
              <>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTitle();
                    } else if (e.key === "Escape") {
                      handleCancelEditTitle();
                    }
                  }}
                  autoFocus
                  className="h-8 text-sm flex-1 min-w-0"
                  placeholder="Enter title..."
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSaveTitle}
                  >
                    <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCancelEditTitle}
                  >
                    <XIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-sm md:text-base font-medium text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">
                  {workspaceName || "Untitled"}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleStartEditTitle}
                  disabled={isStreaming}
                >
                  <Edit2Icon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                </Button>
              </>
            )}
          </div>

          {/* 移动端: 显示紧凑的配置选择器 (Sheet) */}
          <div className="md:hidden flex-shrink-0">
            <IFlowConfigSelector
              modelName={currentConfig.modelName}
              permissionMode={currentConfig.permissionMode}
              onModelChange={(model) => updateConfig({ modelName: model })}
              onPermissionChange={(mode) => updateConfig({ permissionMode: mode })}
              disabled={isStreaming}
              variant="mobile"
            />
          </div>

          {/* 桌面端: 显示紧凑的配置选择器 (Popover) */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <IFlowConfigSelector
              modelName={currentConfig.modelName}
              permissionMode={currentConfig.permissionMode}
              onModelChange={(model) => updateConfig({ modelName: model })}
              onPermissionChange={(mode) => updateConfig({ permissionMode: mode })}
              disabled={isStreaming}
              variant="desktop"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* 移动端只显示图标,桌面端显示文字 */}
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            disabled={isStreaming || messages.length === 0}
            className="h-9 w-9 md:w-auto p-0 md:px-3"
          >
            <PlusIcon className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">New Chat</span>
          </Button>
        </div>
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}

      {/* 消息列表 - 移动端优化 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">
          {/* 加载历史消息状态 */}
          {isLoadingHistory && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Loading chat history...
              </p>
            </div>
          )}

          {/* 空消息状态 */}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Start a new conversation
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
                Chat with AI using iFlow CLI SDK - supports code generation, file operations, and more
              </p>
            </div>
          )}

          {/* 消息列表 */}
          <IFlowMessageList messages={messages} />

          {/* 加载状态 */}
          {isStreaming && (
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>正在生成回复...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区 - 移动端和桌面端优化 */}
      <div className="border-t dark:border-zinc-800 p-2 md:p-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                className="resize-none min-h-[44px] md:min-h-[48px] max-h-[200px] text-base rounded-xl md:rounded-2xl border-zinc-200 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 transition-all"
                disabled={isStreaming}
                rows={1}
              />
            </div>
            {isStreaming ? (
              <Button
                onClick={stopGeneration}
                variant="destructive"
                size="icon"
                className="h-11 w-11 md:h-12 md:w-12 rounded-full shrink-0 touch-manipulation bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-all shadow-sm hover:shadow-md"
                aria-label="Stop generating"
              >
                <StopIcon className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                className="h-11 w-11 md:h-12 md:w-12 rounded-full shrink-0 touch-manipulation bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 disabled:from-zinc-200 disabled:to-zinc-200 dark:disabled:from-zinc-800 dark:disabled:to-zinc-800 disabled:opacity-50 transition-all shadow-sm hover:shadow-md disabled:shadow-none"
                aria-label="Send message"
              >
                <ArrowUpIcon className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* 提示文本 - 桌面端显示 */}
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center hidden md:block">
            <span className="font-medium">模型:</span> {currentConfig.modelName}{" "}
            <span className="mx-2">·</span>
            <span className="font-medium">权限:</span>{" "}
            {currentConfig.permissionMode}
            <span className="mx-2">·</span>
            <span className="font-medium">工作区:</span> {workspaceId.slice(0, 8)}
            ...
          </div>
        </div>
      </div>
    </div>
  );
}
