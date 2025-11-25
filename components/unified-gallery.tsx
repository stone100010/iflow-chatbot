'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  usageCount: number;
  icon?: string;
  [key: string]: any; // 允许其他自定义字段
}

interface UnifiedGalleryProps {
  title: string;
  apiEndpoint: string;
  categories: string[];
  tags?: string[]; // 可选的标签列表
  itemKey: string; // 'workflows' | 'commands' | 'agents'
  onCreateItem?: () => void; // 可选的创建按钮
  renderCard: (item: GalleryItem) => React.ReactNode; // 自定义卡片渲染
}

export function UnifiedGallery({
  title,
  apiEndpoint,
  categories,
  tags = [],
  itemKey,
  onCreateItem,
  renderCard,
}: UnifiedGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12; // 4列 × 3行

  // 加载数据
  useEffect(() => {
    loadItems();
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const loadItems = async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);

    try {
      const response = await fetch(`${apiEndpoint}?${params}`);
      const data = await response.json();
      setItems(data[itemKey] || []);
    } catch (error) {
      console.error('Failed to load items:', error);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 根据选中的分类和标签过滤
  const filteredItems = useMemo(() => {
    let filtered = items;

    // 标签过滤（客户端过滤）
    if (selectedTags.length > 0 && tags.length > 0) {
      filtered = filtered.filter((item) => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return selectedTags.some((tag) => item.tags!.includes(tag));
      });
    }

    return filtered;
  }, [items, selectedTags, tags]);

  // 分页计算
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  // 切换标签时重置到第一页
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-66 border-r bg-muted/10 p-6 space-y-6 flex-shrink-0">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3">类别</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border hover:bg-muted'
                )}
              >
                全部分类
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm transition-colors',
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border hover:bg-muted'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Tags - 仅当提供了标签列表时显示 */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">标签</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm transition-colors',
                      selectedTags.includes(tag)
                        ? 'bg-primary/20 text-primary font-medium border-primary'
                        : 'bg-background border hover:bg-muted'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {onCreateItem && (
                <Button onClick={onCreateItem} className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `没有找到匹配 "${searchQuery}" 的内容`
                    : selectedTags.length > 0
                    ? '没有匹配所选标签的内容'
                    : selectedCategory === 'all'
                    ? '暂无数据'
                    : '该分类下暂无数据'}
                </p>
              </div>
            ) : (
              <>
                {/* 卡片网格区域 - 减去翻页栏高度（约48px），然后分成3行 */}
                <div className="grid grid-cols-4 grid-rows-3 gap-4" style={{ height: 'calc(100% - 48px)' }}>
                  {paginatedItems.map((item) => renderCard(item))}
                </div>

                {/* 分页控件 - 固定在右下角 */}
                {totalPages > 1 && (
                  <div className="absolute bottom-6 right-6 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {currentPage} / {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
