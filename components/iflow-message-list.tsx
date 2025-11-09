/**
 * IFlowMessageList - 优化的消息列表组件
 *
 * 使用 React.memo 避免不必要的重渲染
 */

"use client";

import { memo } from "react";
import { MessageContent } from "@/components/message-content";
import { IFlowToolStatus } from "@/components/iflow-tool-status";
import { IFlowPlanView } from "@/components/iflow-plan-view";
import type { IFlowChatMessage } from "@/lib/iflow/types";

interface IFlowMessageListProps {
  messages: IFlowChatMessage[];
}

export const IFlowMessageList = memo(function IFlowMessageList({ messages }: IFlowMessageListProps) {
  return (
    <>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`mb-4 md:mb-6 ${
            msg.role === "user" ? "flex justify-end" : ""
          }`}
        >
          <div
            className={`max-w-[85%] md:max-w-[75%] ${
              msg.role === "user"
                ? "bg-blue-500 text-white rounded-2xl px-4 py-3"
                : ""
            }`}
          >
            {msg.role === "user" ? (
              <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            ) : (
              <div className="space-y-3">
                {/* Agent 信息 */}
                {msg.agentInfo && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {msg.agentInfo.type}
                    </span>
                    {msg.agentInfo.name && (
                      <span>{msg.agentInfo.name}</span>
                    )}
                  </div>
                )}

                {/* 主要内容 */}
                {msg.content && <MessageContent content={msg.content} />}

                {/* 工具调用 */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <IFlowToolStatus toolCalls={msg.toolCalls} />
                )}

                {/* 任务计划 */}
                {msg.plan && msg.plan.length > 0 && (
                  <IFlowPlanView
                    entries={msg.plan}
                    isFinished={!!msg.stopReason}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
});
