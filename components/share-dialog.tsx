"use client";

import { useState } from "react";
import { useShare } from "@/hooks/use-share";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

interface ShareDialogProps {
  workspaceId: string;
  workspaceName: string;
  messageCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  workspaceId,
  workspaceName,
  messageCount,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const { createShare, loading } = useShare();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 表单状态
  const [title, setTitle] = useState(workspaceName || "");
  const [description, setDescription] = useState("");

  // 重置对话框状态
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setShareUrl(null);
      setCopied(false);
      setTitle(workspaceName || "");
      setDescription("");
    }, 300);
  };

  // 创建分享
  const handleCreateShare = async () => {
    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    const result = await createShare({
      workspaceId,
      title: title.trim(),
      description: description.trim() || undefined,
    });

    if (result) {
      setShareUrl(result.url);
    }
  };

  // 复制链接
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("复制失败，请手动复制链接");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享对话
          </DialogTitle>
          <DialogDescription>
            创建一个永久快照链接，分享你的对话记录
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          // 创建分享表单
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-title">标题 *</Label>
              <Input
                id="share-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="给这个分享起个标题"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {messageCount} 条消息将被冻结为快照
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-description">描述（可选）</Label>
              <Textarea
                id="share-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单描述这个对话的内容..."
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
              <p className="font-medium">💡 关于快照</p>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>分享会创建当前对话的永久副本</li>
                <li>即使原对话被修改或删除，分享链接仍然有效</li>
                <li>分享链接可以被任何人访问</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                取消
              </Button>
              <Button onClick={handleCreateShare} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "创建分享"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // 分享成功界面
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 space-y-2">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ✅ 分享链接已创建！
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                此链接永久有效，快照已冻结
              </p>
            </div>

            <div className="space-y-2">
              <Label>分享链接</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                查看分享
              </Button>
              <Button onClick={handleClose}>完成</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
