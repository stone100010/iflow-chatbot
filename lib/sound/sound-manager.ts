/**
 * 音效管理器 - 管理用户音效偏好设置
 *
 * 功能：
 * - 从 localStorage 读取/保存用户偏好
 * - 控制音效播放
 * - 处理浏览器自动播放策略
 */

import { soundGenerator, type SoundType } from "./sound-generator";

// 用户音效偏好设置
export interface SoundSettings {
  enabled: boolean;        // 是否启用音效
  type: SoundType;         // 音效类型
  volume: number;          // 音量 0-1
}

// localStorage key
const STORAGE_KEY = "iflow-sound-settings";

// 默认设置
const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  type: "soft-chime",
  volume: 0.5,
};

/**
 * 音效管理器类
 */
export class SoundManager {
  private settings: SoundSettings;
  private isActivated: boolean = false; // 是否已激活音频上下文（需要用户交互）

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * 从 localStorage 加载设置
   */
  private loadSettings(): SoundSettings {
    // SSR 环境检查
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return DEFAULT_SETTINGS;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error("Failed to load sound settings:", error);
    }
    return DEFAULT_SETTINGS;
  }

  /**
   * 保存设置到 localStorage
   */
  private saveSettings(): void {
    // SSR 环境检查
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Failed to save sound settings:", error);
    }
  }

  /**
   * 获取当前设置
   */
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(partial: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  /**
   * 激活音频上下文
   * 浏览器要求用户交互后才能播放音频
   * 在用户首次点击"试听"时调用
   */
  activate(): void {
    if (!this.isActivated) {
      // 播放一个静默音以激活音频上下文
      try {
        soundGenerator.play("none", 0);
        this.isActivated = true;
      } catch (error) {
        console.error("Failed to activate audio context:", error);
      }
    }
  }

  /**
   * 播放通知音效
   * 仅在当前标签页可见且设置启用时播放
   */
  playNotification(): void {
    // 检查是否启用
    if (!this.settings.enabled) {
      return;
    }

    // 检查音效类型
    if (this.settings.type === "none") {
      return;
    }

    // 检查标签页是否可见（避免后台标签页播放）
    if (document.visibilityState !== "visible") {
      return;
    }

    // 自动激活（如果还未激活）
    if (!this.isActivated) {
      this.activate();
    }

    // 播放音效
    try {
      soundGenerator.play(this.settings.type, this.settings.volume);
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }

  /**
   * 试听音效（用于设置页面）
   * 不检查启用状态，直接播放
   */
  preview(type: SoundType, volume?: number): void {
    if (type === "none") return;

    // 激活音频上下文
    this.activate();

    try {
      const previewVolume = volume !== undefined ? volume : this.settings.volume;
      soundGenerator.play(type, previewVolume);
    } catch (error) {
      console.error("Failed to preview sound:", error);
    }
  }

  /**
   * 启用音效
   */
  enable(): void {
    this.updateSettings({ enabled: true });
  }

  /**
   * 禁用音效
   */
  disable(): void {
    this.updateSettings({ enabled: false });
  }

  /**
   * 设置音效类型
   */
  setSoundType(type: SoundType): void {
    this.updateSettings({ type });
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    // 确保音量在 0-1 范围内
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updateSettings({ volume: clampedVolume });
  }

  /**
   * 重置为默认设置
   */
  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

// 导出单例
export const soundManager = new SoundManager();

// 音效类型显示名称
export const SOUND_TYPE_NAMES: Record<SoundType, string> = {
  "soft-chime": "Soft Chime",
  "crisp-ping": "Crisp Ping",
  "gentle-bell": "Gentle Bell",
  "success-tone": "Success Tone",
  "bubble-pop": "Bubble Pop",
  "subtle-notification": "Subtle Notification",
  "none": "None",
};

// 音效类型描述
export const SOUND_TYPE_DESCRIPTIONS: Record<SoundType, string> = {
  "soft-chime": "Gentle two-tone chime, pleasant and calm",
  "crisp-ping": "Sharp single note, clear and concise",
  "gentle-bell": "Resonating bell sound, warm and inviting",
  "success-tone": "Uplifting three-note melody, cheerful",
  "bubble-pop": "Playful pop sound, light and fun",
  "subtle-notification": "Very quiet ping, perfect for office",
  "none": "No sound",
};
