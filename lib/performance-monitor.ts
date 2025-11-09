/**
 * 性能监控工具
 * 用于追踪和分析页面加载性能
 */

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  static start(label: string) {
    this.timers.set(label, performance.now());
    console.log(`⏱️  [Performance] START: ${label}`);
  }

  /**
   * 结束计时并输出耗时
   */
  static end(label: string) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`⚠️  [Performance] No start time for: ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    const emoji = duration > 1000 ? "🔴" : duration > 500 ? "🟡" : "🟢";

    console.log(`${emoji} [Performance] END: ${label} - ${duration.toFixed(2)}ms`);

    this.timers.delete(label);
    return duration;
  }

  /**
   * 测量异步函数执行时间
   */
  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      this.end(label);
      return result;
    } catch (error) {
      console.error(`❌ [Performance] ERROR in ${label}:`, error);
      this.end(label);
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  static measureSync<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      this.end(label);
      return result;
    } catch (error) {
      console.error(`❌ [Performance] ERROR in ${label}:`, error);
      this.end(label);
      throw error;
    }
  }

  /**
   * 输出网络请求性能
   */
  static logNetworkRequest(url: string, duration: number, size?: number) {
    const emoji = duration > 2000 ? "🔴" : duration > 1000 ? "🟡" : "🟢";
    const sizeInfo = size ? ` | ${(size / 1024).toFixed(2)}KB` : "";
    console.log(`${emoji} [Network] ${url} - ${duration.toFixed(2)}ms${sizeInfo}`);
  }

  /**
   * 输出当前页面性能指标
   */
  static logPageMetrics() {
    if (typeof window === "undefined") return;

    setTimeout(() => {
      const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

      if (!perfData) return;

      console.group("📊 [Performance] Page Load Metrics");
      console.log(`DNS Lookup: ${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`);
      console.log(`TCP Connection: ${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`);
      console.log(`Request: ${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`);
      console.log(`Response: ${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`);
      console.log(`DOM Processing: ${(perfData.domComplete - perfData.domLoading).toFixed(2)}ms`);
      console.log(`DOM Content Loaded: ${(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart).toFixed(2)}ms`);
      console.log(`Total Load Time: ${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`);
      console.groupEnd();
    }, 0);
  }
}
