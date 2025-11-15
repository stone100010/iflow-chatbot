"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "Auto", icon: Monitor },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Appearance
      </div>

      {/* macOS 风格三段式选择器 */}
      <div className="relative">
        {/* 滑动背景 */}
        <div className="relative flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
          {themeOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`relative flex-1 flex flex-col items-center gap-1.5 py-3 px-4 rounded-md transition-all duration-200 ${
                  isSelected
                    ? "bg-white dark:bg-zinc-900 shadow-sm"
                    : "hover:bg-zinc-50/50 dark:hover:bg-zinc-700/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isSelected
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isSelected
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
