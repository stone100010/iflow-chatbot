'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface UnifiedCardProps {
  id: string;
  name: string;
  category: string;
  version?: number | string;
  description?: string;
  tags?: string[];
  usageCount: number;
  icon?: string;
  onInstall?: (id: string) => void;
}

export function UnifiedCard({
  id,
  name,
  category,
  version,
  description,
  tags = [],
  usageCount,
  icon,
  onInstall,
}: UnifiedCardProps) {
  // 格式化版本号
  const displayVersion = version ? `V${version}` : '';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* 标题 */}
      <h3 className="font-semibold text-base mb-2 line-clamp-1">{name}</h3>

      {/* 分类标签和版本号 */}
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-2 py-0.5"
        >
          {category}
        </Badge>
        {displayVersion && (
          <span className="text-xs text-muted-foreground">{displayVersion}</span>
        )}
      </div>

      {/* 描述 */}
      {description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
          {description}
        </p>
      )}

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs px-2 py-0.5 font-normal"
            >
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 font-normal"
            >
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* 底部：收藏数和安装按钮 */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="w-4 h-4" />
          <span>{usageCount}</span>
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onInstall?.(id);
          }}
          className="h-8 px-4 text-sm"
        >
          安装
        </Button>
      </div>
    </div>
  );
}
