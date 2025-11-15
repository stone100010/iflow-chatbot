"use client";

import { Volume2, VolumeX, Play } from "lucide-react";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import type { SoundType } from "@/lib/sound/sound-generator";
import { SOUND_TYPE_NAMES } from "@/lib/sound/sound-manager";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const SOUND_TYPES: SoundType[] = [
  "soft-chime",
  "crisp-ping",
  "gentle-bell",
  "success-tone",
  "bubble-pop",
  "subtle-notification",
  "none",
];

export function SoundSettings() {
  const { settings, toggleEnabled, setSoundType, setVolume, previewSound } =
    useNotificationSound();

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handlePreview = () => {
    if (settings.type !== "none") {
      previewSound(settings.type, settings.volume);
    }
  };

  const handleSoundChange = (value: string) => {
    const newType = value as SoundType;
    setSoundType(newType);
    // 自动试听新选择的音效
    if (newType !== "none") {
      setTimeout(() => {
        previewSound(newType, settings.volume);
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题行 + 开关 */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Sound
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={toggleEnabled}
          className="scale-90"
        />
      </div>

      {/* 音效选择 + 试听按钮 */}
      <div className="flex items-center gap-2">
        <Select
          value={settings.type}
          onValueChange={handleSoundChange}
          disabled={!settings.enabled}
        >
          <SelectTrigger className="flex-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOUND_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {SOUND_TYPE_NAMES[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={!settings.enabled || settings.type === "none"}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* 音量滑块 */}
      <div className="flex items-center gap-3">
        <VolumeX className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <Slider
            value={[settings.volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.01}
            disabled={!settings.enabled}
            className="flex-1"
          />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-10 text-right">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
        <Volume2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
      </div>
    </div>
  );
}
