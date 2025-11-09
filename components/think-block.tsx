"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface ThinkBlockProps {
  content: string;
}

export function ThinkBlock({ content }: ThinkBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取预览文本（前50个字符）
  const previewText = content.length > 50
    ? content.substring(0, 50) + "..."
    : content;

  return (
    <div className="my-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-zinc-200 dark:hover:bg-zinc-700/50 transition-colors rounded-lg"
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 mt-0.5 shrink-0" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            💭 思考过程
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-pre-wrap">
            {isExpanded ? content : previewText}
          </div>
        </div>
      </button>
    </div>
  );
}
