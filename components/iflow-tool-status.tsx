/**
 * IFlowToolStatus 组件
 *
 * 显示 iFlow 工具调用的状态（支持两层折叠 + 智能渲染）
 */

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  FileEdit,
  FileText,
  Search,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ToolCall, ToolCallStatus } from "@/lib/iflow/types";

interface IFlowToolStatusProps {
  toolCalls: ToolCall[];
  className?: string;
}

/**
 * 获取工具图标
 */
function getToolIcon(toolName: string) {
  switch (toolName.toLowerCase()) {
    case "read":
      return FileText;
    case "write":
      return FileEdit;
    case "edit":
      return FileEdit;
    case "bash":
      return Terminal;
    case "grep":
    case "glob":
      return Search;
    default:
      return FileText;
  }
}

/**
 * 获取状态图标和颜色
 */
function getStatusInfo(status: ToolCallStatus): {
  icon: React.ElementType;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case "pending":
      return {
        icon: Clock,
        color: "text-zinc-500 dark:text-zinc-400",
        bgColor: "bg-zinc-100 dark:bg-zinc-800",
      };
    case "executing":
      return {
        icon: Loader2,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950",
      };
    case "completed":
      return {
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950",
      };
    case "failed":
      return {
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950",
      };
    default:
      return {
        icon: Clock,
        color: "text-zinc-500 dark:text-zinc-400",
        bgColor: "bg-zinc-100 dark:bg-zinc-800",
      };
  }
}

export function IFlowToolStatus({
  toolCalls,
  className = "",
}: IFlowToolStatusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  const completedCount = toolCalls.filter((t) => t.status === "completed").length;
  const failedCount = toolCalls.filter((t) => t.status === "failed").length;

  return (
    <div
      className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden ${className}`}
    >
      {/* 第一层：整体折叠标题栏 */}
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

        {/* 标题和统计 */}
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            🔧 Tool Calls
          </h3>
          <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
            {toolCalls.length} items
          </span>
        </div>
      </button>

      {/* 第二层：展开后显示所有工具调用 */}
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 pt-3">
          <div className="space-y-2">
            {toolCalls.map((toolCall, index) => (
              <ToolCallItem key={`${toolCall.id}-${index}`} toolCall={toolCall} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 单个工具调用项（第二层折叠）
 */
function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ToolIcon = getToolIcon(toolCall.toolName);
  const { icon: StatusIcon, color, bgColor } = getStatusInfo(toolCall.status);

  // 检测是否有代码内容（来自 args.content 或 result）
  const codeContent = toolCall.args?.content || toolCall.result;
  const hasCode = typeof codeContent === "string" && codeContent.length > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border border-zinc-200 dark:border-zinc-800 ${bgColor} overflow-hidden`}
    >
      {/* 工具调用头部 */}
      <div
        className={`flex items-start gap-3 p-3 ${
          hasCode ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : ""
        }`}
        onClick={() => hasCode && setIsExpanded(!isExpanded)}
      >
        {/* 折叠图标 */}
        {hasCode && (
          <div className="flex-shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        )}

        {/* 工具图标 */}
        <div className="flex-shrink-0 mt-0.5">
          <ToolIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        </div>

        {/* 工具信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {toolCall.toolName}
            </span>
            <div className="flex items-center gap-1">
              <StatusIcon
                className={`w-3.5 h-3.5 ${color} ${
                  toolCall.status === "executing" ? "animate-spin" : ""
                }`}
              />
              <span className={`text-xs ${color}`}>
                {toolCall.status === "pending" && "Pending"}
                {toolCall.status === "executing" && "Executing"}
                {toolCall.status === "completed" && "Completed"}
                {toolCall.status === "failed" && "Failed"}
              </span>
            </div>
          </div>

          {/* 标签/描述 */}
          {toolCall.label && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {toolCall.label}
            </p>
          )}

          {/* 错误信息 */}
          {toolCall.error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Error: {toolCall.error}
            </p>
          )}
        </div>
      </div>

      {/* 展开的代码内容（第三层：单个工具内容展开） */}
      {isExpanded && hasCode && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <ContentDisplay
            content={codeContent as string}
            filePath={toolCall.args?.file_path as string | undefined}
            toolName={toolCall.toolName}
          />
        </div>
      )}
    </motion.div>
  );
}

/**
 * 智能内容显示组件
 * 根据文件类型选择渲染方式：Markdown vs 代码高亮
 */
function ContentDisplay({
  content,
  filePath,
  toolName
}: {
  content: string;
  filePath?: string;
  toolName: string;
}) {
  // 检测是否是 Markdown 文件
  const isMarkdown = filePath?.toLowerCase().endsWith('.md');

  // Write/Edit 工具的 Markdown 文件用 Markdown 渲染
  if (isMarkdown && (toolName.toLowerCase() === 'write' || toolName.toLowerCase() === 'edit')) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="prose dark:prose-invert max-w-none prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // 其他情况用代码高亮
  const language = detectLanguage(filePath);

  return (
    <div className="relative">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "0.75rem",
          maxHeight: "400px",
        }}
        showLineNumbers
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * 根据文件路径检测语言
 */
function detectLanguage(filePath?: string): string {
  if (!filePath) return "text";

  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "js":
      return "javascript";
    case "ts":
      return "typescript";
    case "jsx":
      return "jsx";
    case "tsx":
      return "tsx";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "css":
      return "css";
    case "html":
      return "html";
    case "sh":
      return "bash";
    default:
      return "text";
  }
}
