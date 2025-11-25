"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IFlowMessageList } from "@/components/iflow-message-list";
import { Button } from "@/components/ui/button";
import { Heart, Eye, Share2, ArrowLeft } from "lucide-react";
import type { IFlowMessage as ChatMessage } from "@/lib/iflow/types";

interface ShareSnapshot {
  id: string;
  role: string;
  content: string;
  sequenceNumber: number;
  metadata: {
    agentInfo?: {
      type: string;
      name?: string;
      description?: string;
    } | null;
    toolCalls?: Array<{
      id: string;
      toolName: string;
      status: string;
      label?: string;
      args?: Record<string, unknown>;
      result?: unknown;
      error?: string;
    }> | null;
    plan?: Array<{
      id: string;
      content: string;
      activeForm: string;
      status: string;
      priority?: string;
    }> | null;
    stopReason?: string;
  };
  messageCreatedAt: string;
  snapshotAt: string;
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
  messages: ShareSnapshot[];
  isLikedByCurrentUser: boolean;
  url: string;
}

interface ShareViewProps {
  shortId: string;
}

export function ShareView({ shortId }: ShareViewProps) {
  const router = useRouter();
  const [share, setShare] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewTracked, setViewTracked] = useState(false);

  // 加载分享数据
  useEffect(() => {
    const loadShare = async () => {
      try {
        const response = await fetch(`/api/shares/${shortId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('分享不存在');
          } else if (response.status === 403) {
            setError('无权访问此分享');
          } else {
            setError('加载失败');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setShare(data);
        setIsLiked(data.isLikedByCurrentUser);
        setLikeCount(data.likeCount);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load share:', err);
        setError('网络错误');
        setLoading(false);
      }
    };

    loadShare();
  }, [shortId]);

  // 记录浏览
  useEffect(() => {
    if (share && !viewTracked) {
      fetch(`/api/shares/${shortId}/view`, {
        method: 'POST',
      }).catch(err => console.error('Failed to track view:', err));
      setViewTracked(true);
    }
  }, [share, shortId, viewTracked]);

  // 点赞处理
  const handleLike = async () => {
    try {
      const response = await fetch(`/api/shares/${shortId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('请先登录');
          router.push('/login');
          return;
        }
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  // 分享处理
  const handleShare = async () => {
    if (!share) return;

    try {
      await navigator.clipboard.writeText(share.url);
      alert('链接已复制到剪贴板');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('复制失败，请手动复制链接');
    }
  };

  // 转换快照消息为聊天消息格式
  const convertSnapshotsToMessages = (snapshots: ShareSnapshot[]): ChatMessage[] => {
    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      workspaceId: share?.workspaceId || '',
      role: snapshot.role as 'user' | 'assistant',
      content: snapshot.content,
      agentInfo: snapshot.metadata.agentInfo || null,
      toolCalls: snapshot.metadata.toolCalls || null,
      plan: snapshot.metadata.plan || null,
      stopReason: snapshot.metadata.stopReason || null,
      createdAt: new Date(snapshot.messageCreatedAt),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-destructive text-lg">{error || '分享不存在'}</div>
        <Button onClick={() => router.push('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 头部信息 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">{share.title}</h1>
              {share.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {share.description}
                </p>
              )}
            </div>
            <Button onClick={() => router.push('/')} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              首页
            </Button>
          </div>

          {/* 互动按钮 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
              <span>{likeCount}</span>
            </button>

            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{share.viewCount}</span>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>分享</span>
            </button>

            <div className="ml-auto text-xs">
              {new Date(share.snapshotAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <IFlowMessageList
            messages={convertSnapshotsToMessages(share.messages)}
            isStreaming={false}
          />
        </div>
      </div>

      {/* 底部提示 */}
      <div className="border-t bg-muted/50 py-3">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          这是一个分享的对话快照，共 {share.messageCount} 条消息
        </div>
      </div>
    </div>
  );
}
