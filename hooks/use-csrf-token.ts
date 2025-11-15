/**
 * useCsrfToken Hook
 *
 * 管理 CSRF token 的获取、存储和自动刷新
 */

"use client";

import { useEffect, useState, useCallback } from "react";

interface CsrfTokenData {
  token: string;
  expiresAt: number;
}

/**
 * Hook 返回值
 */
interface UseCsrfTokenReturn {
  csrfToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

/**
 * 从 API 获取 CSRF token
 */
async function fetchCsrfToken(): Promise<CsrfTokenData> {
  const response = await fetch("/api/csrf-token");

  if (!response.ok) {
    throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    token: data.csrfToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };
}

/**
 * useCsrfToken Hook
 *
 * 自动获取和刷新 CSRF token
 */
export function useCsrfToken(): UseCsrfTokenReturn {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 获取新的 CSRF token
   */
  const refreshToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCsrfToken();
      setCsrfToken(data.token);

      // 在 token 过期前 5 分钟自动刷新
      const refreshTime = data.expiresAt - Date.now() - 5 * 60 * 1000;

      if (refreshTime > 0) {
        setTimeout(() => {
          refreshToken();
        }, refreshTime);
      }
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error(String(err));
      setError(fetchError);
      console.error("[useCsrfToken] Failed to fetch token:", fetchError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载时获取 token
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return {
    csrfToken,
    isLoading,
    error,
    refreshToken,
  };
}
