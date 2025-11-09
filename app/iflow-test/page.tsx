"use client";

import { useState, useEffect } from "react";
import { useIFlowChat } from "@/hooks/use-iflow-chat";
import { IFlowModelSelector } from "@/components/iflow-model-selector";
import { IFlowPermissionModeSelector } from "@/components/iflow-permission-mode-selector";
import { IFlowToolStatus } from "@/components/iflow-tool-status";
import { IFlowPlanView } from "@/components/iflow-plan-view";

export default function IFlowTestPage() {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    stopGeneration,
    isStreaming,
    currentConfig,
    updateConfig,
    error,
    clearMessages,
  } = useIFlowChat({
    workspaceId: workspaceId || "temp",
    modelName: "MiniMax-M2",
    permissionMode: "yolo",
    onError: (err) => console.error("Chat error:", err),
    onFinish: (msg) => console.log("Message finished:", msg),
  });

  // 初始化工作区
  const initializeWorkspace = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/workspace/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "测试工作区" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const { workspace } = await response.json();
      setWorkspaceId(workspace.id);
      console.log("Workspace created:", workspace);
    } catch (error) {
      console.error("Failed to initialize workspace:", error);
      alert("创建工作区失败: " + error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !workspaceId) return;
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="container mx-auto p-6 max-w-5xl">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            iFlow 测试页面
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            测试 iFlow CLI SDK 集成功能
          </p>
        </div>

        {/* 工作区初始化 */}
        {!workspaceId && (
          <div className="mb-6 p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
            <h2 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              开始测试
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              首先需要创建一个测试工作区
            </p>
            <button
              onClick={initializeWorkspace}
              disabled={isInitializing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isInitializing ? "创建中..." : "创建测试工作区"}
            </button>
          </div>
        )}

        {/* 主界面 */}
        {workspaceId && (
          <>
            {/* 配置区 */}
            <div className="mb-6 p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
                配置
              </h2>
              <div className="flex flex-wrap gap-3">
                <IFlowModelSelector
                  value={currentConfig.modelName}
                  onChange={(model) => updateConfig({ modelName: model })}
                  disabled={isStreaming}
                />
                <IFlowPermissionModeSelector
                  value={currentConfig.permissionMode}
                  onChange={(mode) => updateConfig({ permissionMode: mode })}
                  disabled={isStreaming}
                />
                <button
                  onClick={clearMessages}
                  className="px-4 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                  disabled={isStreaming}
                >
                  清空消息
                </button>
                <div className="ml-auto text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
                  工作区: {workspaceId.slice(0, 8)}...
                </div>
              </div>
            </div>

            {/* 错误显示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  错误: {error.message}
                </p>
              </div>
            )}

            {/* 消息列表 */}
            <div className="mb-6 space-y-4 max-h-[600px] overflow-y-auto p-4 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
              {messages.length === 0 && (
                <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                  <p className="text-sm">还没有消息，开始对话吧！</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-50 dark:bg-blue-950 ml-12"
                      : "bg-zinc-100 dark:bg-zinc-900 mr-12"
                  }`}
                >
                  <div className="text-xs font-semibold mb-2 text-zinc-600 dark:text-zinc-400">
                    {msg.role === "user" ? "👤 用户" : "🤖 助手"}
                  </div>
                  <div className="text-sm whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                    {msg.content}
                  </div>

                  {/* Agent 信息 */}
                  {msg.agentInfo && (
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      Agent: {msg.agentInfo.name || msg.agentInfo.type}
                    </div>
                  )}

                  {/* 工具调用状态 */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3">
                      <IFlowToolStatus toolCalls={msg.toolCalls} />
                    </div>
                  )}

                  {/* 任务计划 */}
                  {msg.plan && msg.plan.length > 0 && (
                    <div className="mt-3">
                      <IFlowPlanView entries={msg.plan} />
                    </div>
                  )}
                </div>
              ))}

              {/* 加载状态 */}
              {isStreaming && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg mr-12">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      正在生成回复...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 输入区 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息... (Enter 发送)"
                className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button
                  onClick={stopGeneration}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  停止
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={!input.trim()}
                >
                  发送
                </button>
              )}
            </div>

            {/* 快捷提示 */}
            <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 text-center">
              按 Enter 发送消息 | Shift + Enter 换行
            </div>
          </>
        )}
      </div>
    </div>
  );
}
