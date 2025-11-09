/**
 * IFlowModelSelector 组件
 *
 * 用于选择 iFlow AI 模型
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import {
  IFLOW_MODELS,
  IFLOW_MODEL_NAMES,
  type IFlowModel,
} from "@/lib/iflow/types";

interface IFlowModelSelectorProps {
  value: IFlowModel;
  onChange: (model: IFlowModel) => void;
  disabled?: boolean;
  className?: string;
}

export function IFlowModelSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: IFlowModelSelectorProps) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={`inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        aria-label="选择 AI 模型"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">模型:</span>
          <Select.Value>{IFLOW_MODEL_NAMES[value]}</Select.Value>
        </div>
        <Select.Icon>
          <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg z-50"
          position="popper"
          sideOffset={8}
        >
          <Select.Viewport className="p-1">
            {IFLOW_MODELS.map((model) => (
              <Select.Item
                key={model}
                value={model}
                className="relative flex items-center gap-2 px-3 py-2 pr-8 text-sm rounded-md cursor-pointer select-none outline-none hover:bg-zinc-100 dark:hover:bg-zinc-900 data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-900 transition-colors"
              >
                <Select.ItemText>{IFLOW_MODEL_NAMES[model]}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-2">
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
