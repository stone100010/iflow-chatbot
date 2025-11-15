/**
 * 音效生成器 - 使用 Web Audio API 生成各种提示音
 *
 * 优点：
 * - 无需外部音频文件
 * - 体积小，性能好
 * - 可自定义参数
 */

export type SoundType =
  | "soft-chime"
  | "crisp-ping"
  | "gentle-bell"
  | "success-tone"
  | "bubble-pop"
  | "subtle-notification"
  | "none";

/**
 * 音效生成器类
 */
export class SoundGenerator {
  private audioContext: AudioContext | null = null;

  /**
   * 获取或创建 AudioContext
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * 生成柔和钟声 - Soft Chime
   * 温柔的双音和弦，不刺耳
   */
  generateSoftChime(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    // 创建两个振荡器产生和弦效果
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 设置频率（C大调和弦）
    oscillator1.frequency.value = 523.25; // C5
    oscillator2.frequency.value = 659.25; // E5

    // 使用正弦波产生纯净音色
    oscillator1.type = "sine";
    oscillator2.type = "sine";

    // 连接节点
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 设置音量包络（ADSR）
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.6); // Decay & Release

    // 播放
    oscillator1.start(currentTime);
    oscillator2.start(currentTime);
    oscillator1.stop(currentTime + 0.6);
    oscillator2.stop(currentTime + 0.6);
  }

  /**
   * 生成清脆提示音 - Crisp Ping
   * 单音，清晰简洁
   */
  generateCrispPing(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 高频清脆音
    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 快速衰减
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.15);
  }

  /**
   * 生成温柔铃声 - Gentle Bell
   * 模拟铃铛的共鸣效果
   */
  generateGentleBell(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    // 创建多个谐波以模拟铃声
    const frequencies = [440, 880, 1320]; // A4 及其泛音
    const oscillators: OscillatorNode[] = [];
    const gainNode = ctx.createGain();

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = "sine";

      // 高频泛音音量递减
      oscGain.gain.value = 1 / (index + 1);

      osc.connect(oscGain);
      oscGain.connect(gainNode);
      oscillators.push(osc);
    });

    gainNode.connect(ctx.destination);

    // 铃声包络
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.0);

    oscillators.forEach(osc => {
      osc.start(currentTime);
      osc.stop(currentTime + 1.0);
    });
  }

  /**
   * 生成成功音效 - Success Tone
   * 向上的三音阶，给人积极愉悦的感觉
   */
  generateSuccessTone(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    // 三个音符：C-E-G（大三和弦）
    const notes = [
      { freq: 523.25, time: 0 },     // C5
      { freq: 659.25, time: 0.1 },   // E5
      { freq: 783.99, time: 0.2 },   // G5
    ];

    notes.forEach(note => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.frequency.value = note.freq;
      oscillator.type = "triangle"; // 三角波更柔和

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const startTime = currentTime + note.time;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  /**
   * 生成气泡音 - Bubble Pop
   * 轻快俏皮的声音
   */
  generateBubblePop(volume: number = 0.3): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 从高频快速下降
    oscillator.frequency.setValueAtTime(600, currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, currentTime + 0.1);
    oscillator.type = "sine";

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 快速爆发然后消失
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.1);
  }

  /**
   * 生成微妙提示音 - Subtle Notification
   * 极轻的提示，适合办公场景
   */
  generateSubtleNotification(volume: number = 0.2): void {
    const ctx = this.getAudioContext();
    const currentTime = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 中频柔和音
    oscillator.frequency.value = 400;
    oscillator.type = "sine";

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 极短的提示
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.08);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 0.08);
  }

  /**
   * 根据类型播放音效
   */
  play(type: SoundType, volume: number = 0.3): void {
    if (type === "none") return;

    try {
      switch (type) {
        case "soft-chime":
          this.generateSoftChime(volume);
          break;
        case "crisp-ping":
          this.generateCrispPing(volume);
          break;
        case "gentle-bell":
          this.generateGentleBell(volume);
          break;
        case "success-tone":
          this.generateSuccessTone(volume);
          break;
        case "bubble-pop":
          this.generateBubblePop(volume);
          break;
        case "subtle-notification":
          this.generateSubtleNotification(volume);
          break;
      }
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// 导出单例
export const soundGenerator = new SoundGenerator();
