/**
 * IFlowPermissionModeSelector 组件
 *
 * 用于选择 iFlow 权限模式
 */

"use client";

import { Check, ChevronDown, Shield } from "lucide-react";
import * as Select from "@radix-ui/react-select";
import {
  IFLOW_PERMISSION_MODES,
  IFLOW_PERMISSION_MODE_NAMES,
  IFLOW_PERMISSION_MODE_DESCRIPTIONS,
  type IFlowPermissionMode,
} from "@/lib/iflow/types";

interface IFlowPermissionModeSelectorProps {
  value: IFlowPermissionMode;
  onChange: (mode: IFlowPermissionMode) => void;
  disabled?: boolean;
  className?: string;
}

export function IFlowPermissionModeSelector({
  value,
  onChange,
  disabled = false,
  className = "",
}: IFlowPermissionModeSelectorProps) {
  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className={`inline-flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        aria-label="选择权限模式"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">权限:</span>
          <Select.Value>{IFLOW_PERMISSION_MODE_NAMES[value]}</Select.Value>
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
            {IFLOW_PERMISSION_MODES.map((mode) => (
              <Select.Item
                key={mode}
                value={mode}
                className="relative flex flex-col items-start gap-1 px-3 py-2 pr-8 rounded-md cursor-pointer select-none outline-none hover:bg-zinc-100 dark:hover:bg-zinc-900 data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-2 w-full">
                  <Select.ItemText className="text-sm font-medium">
                    {IFLOW_PERMISSION_MODE_NAMES[mode]}
                  </Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </Select.ItemIndicator>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {IFLOW_PERMISSION_MODE_DESCRIPTIONS[mode]}
                </span>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
