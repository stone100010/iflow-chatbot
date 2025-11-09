"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Shield, Edit, Zap, Calendar } from "lucide-react";
import type { IFlowModel, IFlowPermissionMode } from "@/lib/iflow/types";

interface IFlowMobileConfigSelectorProps {
  modelName: IFlowModel;
  permissionMode: IFlowPermissionMode;
  onModelChange: (model: IFlowModel) => void;
  onPermissionChange: (mode: IFlowPermissionMode) => void;
  disabled?: boolean;
}

const MODELS: { value: IFlowModel; label: string; description: string }[] = [
  {
    value: "MiniMax-M2",
    label: "MiniMax-M2",
    description: "Default model, balanced performance",
  },
  {
    value: "Qwen3-Coder-Plus",
    label: "Qwen3-Coder-Plus",
    description: "Code-focused, ideal for programming",
  },
  {
    value: "DeepSeek-V3.2",
    label: "DeepSeek-V3.2",
    description: "Deep understanding, complex tasks",
  },
  {
    value: "GLM-4.6",
    label: "GLM-4.6",
    description: "Zhipu AI, Chinese optimized",
  },
  {
    value: "Kimi-K2-0905",
    label: "Kimi-K2-0905",
    description: "Moonshot, long context",
  },
];

const PERMISSION_MODES: {
  value: IFlowPermissionMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "default",
    label: "default",
    description: "Request permissions step by step",
    icon: Shield,
  },
  {
    value: "autoEdit",
    label: "autoEdit",
    description: "Automatically edit files",
    icon: Edit,
  },
  {
    value: "yolo",
    label: "yolo",
    description: "No authorization required",
    icon: Zap,
  },
  {
    value: "plan",
    label: "plan",
    description: "Plan first before execution",
    icon: Calendar,
  },
];

export function IFlowMobileConfigSelector({
  modelName,
  permissionMode,
  onModelChange,
  onPermissionChange,
  disabled = false,
}: IFlowMobileConfigSelectorProps) {
  const [open, setOpen] = useState(false);

  // 获取缩写显示
  const getShortLabel = () => {
    // 模型缩写映射
    const modelShortMap: Record<IFlowModel, string> = {
      "MiniMax-M2": "M2",
      "Qwen3-Coder-Plus": "Qwen",
      "DeepSeek-V3.2": "DS",
      "GLM-4.6": "GLM",
      "Kimi-K2-0905": "Kimi",
    };

    // 权限模式缩写映射
    const permShortMap: Record<IFlowPermissionMode, string> = {
      "default": "default",
      "autoEdit": "autoEdit",
      "yolo": "yolo",
      "plan": "plan",
    };

    const modelShort = modelShortMap[modelName] || modelName;
    const permShort = permShortMap[permissionMode] || permissionMode;
    return `${modelShort} · ${permShort}`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-9 px-2 md:px-3 text-xs md:text-sm gap-1"
        >
          <span className="font-medium">{getShortLabel()}</span>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[65vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">Settings</SheetTitle>
          <SheetDescription className="text-sm">
            Configure your AI assistant
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Model Selection */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-1">
              Model
            </h3>
            <div className="space-y-1.5">
              {MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => {
                    onModelChange(model.value);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-all touch-manipulation ${
                    modelName === model.value
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{model.label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {model.description}
                      </div>
                    </div>
                    {modelName === model.value && (
                      <div className="ml-2 text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Mode */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide px-1">
              Permission
            </h3>
            <div className="space-y-1.5">
              {PERMISSION_MODES.map((mode) => {
                return (
                  <button
                    key={mode.value}
                    onClick={() => {
                      onPermissionChange(mode.value);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-md transition-all touch-manipulation ${
                      permissionMode === mode.value
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{mode.label}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                          {mode.description}
                        </div>
                      </div>
                      {permissionMode === mode.value && (
                        <div className="ml-2 text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done button */}
          <Button
            onClick={() => setOpen(false)}
            className="w-full h-10 touch-manipulation mt-6"
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
