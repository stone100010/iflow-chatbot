"use client";

import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeSettings } from "./theme-settings";
import { SoundSettings } from "./sound-settings";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  children?: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button
            type="button"
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-2">
          <ThemeSettings />

          <Separator />

          <SoundSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}
