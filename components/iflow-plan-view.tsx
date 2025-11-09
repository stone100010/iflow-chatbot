/**
 * IFlowPlanView 组件
 *
 * 显示 iFlow 任务计划列表
 */

"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { PlanEntry, PlanEntryStatus } from "@/lib/iflow/types";

interface IFlowPlanViewProps {
  entries: PlanEntry[];
  className?: string;
  isFinished?: boolean; // 消息是否已完成（用于历史消息）
}

/**
 * 获取状态图标和颜色
 */
function getStatusInfo(status: PlanEntryStatus): {
  icon: React.ElementType;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case "pending":
      return {
        icon: Circle,
        color: "text-zinc-400 dark:text-zinc-600",
        bgColor: "bg-zinc-50 dark:bg-zinc-900",
      };
    case "in_progress":
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
        icon: AlertCircle,
        color: "text-zinc-400 dark:text-zinc-600",
        bgColor: "bg-zinc-50 dark:bg-zinc-900",
      };
  }
}

/**
 * 获取优先级徽章
 */
function getPriorityBadge(priority?: string) {
  if (!priority) return null;

  const colors = {
    low: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    medium:
      "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400",
    high: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  };

  const labels = {
    low: "Low",
    medium: "Med",
    high: "High",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded ${
        colors[priority as keyof typeof colors] || colors.low
      }`}
    >
      {labels[priority as keyof typeof labels] || priority}
    </span>
  );
}

export function IFlowPlanView({
  entries,
  className = "",
  isFinished = false,
}: IFlowPlanViewProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  // 如果消息已完成，将所有 in_progress 的任务视为 skipped/completed
  const normalizedEntries = isFinished
    ? entries.map((entry) => ({
        ...entry,
        status:
          entry.status === "in_progress"
            ? ("completed" as PlanEntryStatus) // 或者可以用 "skipped"
            : entry.status,
      }))
    : entries;

  return (
    <div
      className={`p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Task Plan
        </h3>
        <span className="px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
          {normalizedEntries.length} items
        </span>
      </div>

      <div className="space-y-2">
        {normalizedEntries.map((entry, index) => {
          const { icon: StatusIcon, color, bgColor } = getStatusInfo(
            entry.status
          );

          // 对于已完成的消息，不显示动画
          const shouldAnimate = !isFinished && entry.status === "in_progress";

          return (
            <motion.div
              key={`${entry.id}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${bgColor}`}
            >
              {/* 序号 */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {index + 1}
                </span>
              </div>

              {/* 状态图标 */}
              <div className="flex-shrink-0 mt-0.5">
                <StatusIcon
                  className={`w-4 h-4 ${color} ${
                    shouldAnimate ? "animate-spin" : ""
                  }`}
                />
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {entry.status === "in_progress" && entry.activeForm
                      ? entry.activeForm
                      : entry.content}
                  </p>
                  {entry.priority && getPriorityBadge(entry.priority)}
                </div>

                {/* 状态文本 */}
                <span className={`text-xs ${color}`}>
                  {entry.status === "pending" && "Pending"}
                  {entry.status === "in_progress" && "In Progress..."}
                  {entry.status === "completed" && "Completed"}
                  {entry.status === "failed" && "Failed"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 进度条 */}
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <span>Progress</span>
          <span>
            {normalizedEntries.filter((e) => e.status === "completed").length} /{" "}
            {normalizedEntries.length}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
            initial={{ width: 0 }}
            animate={{
              width: `${
                (normalizedEntries.filter((e) => e.status === "completed").length /
                  normalizedEntries.length) *
                100
              }%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
