/**
 * useNotificationSound Hook
 *
 * 在 React 组件中使用音效功能
 */

import { useCallback, useEffect, useState } from "react";
import { soundManager, type SoundSettings } from "@/lib/sound/sound-manager";
import type { SoundType } from "@/lib/sound/sound-generator";

export function useNotificationSound() {
  // 从 soundManager 获取初始设置
  const [settings, setSettings] = useState<SoundSettings>(() =>
    soundManager.getSettings()
  );

  // 更新本地状态（当设置改变时）
  const refreshSettings = useCallback(() => {
    setSettings(soundManager.getSettings());
  }, []);

  // 播放通知音效
  const playNotification = useCallback(() => {
    soundManager.playNotification();
  }, []);

  // 试听音效
  const previewSound = useCallback((type: SoundType, volume?: number) => {
    soundManager.preview(type, volume);
  }, []);

  // 更新设置
  const updateSettings = useCallback(
    (partial: Partial<SoundSettings>) => {
      soundManager.updateSettings(partial);
      refreshSettings();
    },
    [refreshSettings]
  );

  // 启用/禁用音效
  const toggleEnabled = useCallback(() => {
    if (settings.enabled) {
      soundManager.disable();
    } else {
      soundManager.enable();
    }
    refreshSettings();
  }, [settings.enabled, refreshSettings]);

  // 设置音效类型
  const setSoundType = useCallback(
    (type: SoundType) => {
      soundManager.setSoundType(type);
      refreshSettings();
    },
    [refreshSettings]
  );

  // 设置音量
  const setVolume = useCallback(
    (volume: number) => {
      soundManager.setVolume(volume);
      refreshSettings();
    },
    [refreshSettings]
  );

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    soundManager.reset();
    refreshSettings();
  }, [refreshSettings]);

  return {
    // 当前设置
    settings,

    // 播放函数
    playNotification,
    previewSound,

    // 设置更新函数
    updateSettings,
    toggleEnabled,
    setSoundType,
    setVolume,
    resetSettings,
  };
}
