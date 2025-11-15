/**
 * IFlowThinkView - 思考过程显示组件
 *
 * 像 Task Plan 一样漂亮地显示思考过程
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface IFlowThinkViewProps {
  thinkBlocks: string[];
  className?: string;
}

export function IFlowThinkView({ thinkBlocks, className = "" }: IFlowThinkViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinkBlocks || thinkBlocks.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden ${className}`}
    >
      {/* 可折叠的标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
      >
        {/* 折叠图标 */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>

        {/* 标题 */}
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            💭 Thinking Process
          </h3>
          {thinkBlocks.length > 1 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
              {thinkBlocks.length} items
            </span>
          )}
        </div>
      </button>

      {/* 展开后显示所有思考块 */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 pt-3">
          <div className="space-y-2">
            {thinkBlocks.map((block, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
              >
                {/* 序号 */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                  {index + 1}
                </div>

                {/* 思考内容 */}
                <div className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                  {block}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
