"use client";

import { useState } from "react";

interface CreateShareParams {
  workspaceId: string;
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}

interface UpdateShareParams {
  title?: string;
  description?: string;
  privacy?: 'public' | 'private';
  isActive?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

interface ShareData {
  id: string;
  shortId: string;
  workspaceId: string;
  userId: string;
  title: string;
  description?: string;
  privacy: string;
  messageCount: number;
  viewCount: number;
  likeCount: number;
  isActive: boolean;
  snapshotAt: string;
  createdAt: string;
  url: string;
  messages?: Array<{
    id: string;
    role: string;
    content: string;
    sequenceNumber: number;
    metadata: Record<string, unknown>;
  }>;
  isLikedByCurrentUser?: boolean;
}

/**
 * Hook for managing share operations
 */
export function useShare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new share from a workspace
   */
  const createShare = async (params: CreateShareParams): Promise<ShareData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '创建分享失败');
      }

      const share = await response.json();
      return share;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建分享失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get share details by shortId
   */
  const getShare = async (shortId: string): Promise<ShareData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shares/${shortId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '获取分享失败');
      }

      const share = await response.json();
      return share;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取分享失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update share metadata
   */
  const updateShare = async (
    shortId: string,
    params: UpdateShareParams
  ): Promise<ShareData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shares/${shortId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '更新分享失败');
      }

      const share = await response.json();
      return share;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新分享失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a share
   */
  const deleteShare = async (shortId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shares/${shortId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除分享失败');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除分享失败';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle like on a share
   */
  const toggleLike = async (
    shortId: string
  ): Promise<{ isLiked: boolean; likeCount: number } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shares/${shortId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '操作失败');
      }

      const result = await response.json();
      return {
        isLiked: result.isLiked,
        likeCount: result.likeCount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createShare,
    getShare,
    updateShare,
    deleteShare,
    toggleLike,
  };
}
