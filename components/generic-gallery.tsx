'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  usageCount: number;
}

interface GenericGalleryProps {
  title: string;
  apiEndpoint: string;
  categories: string[];
  itemKey: string; // 'workflows' | 'commands' | 'agents'
}

export function GenericGallery({ title, apiEndpoint, categories, itemKey }: GenericGalleryProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12; // 4列 × 3行

  useEffect(() => {
    loadItems();
    setCurrentPage(1); // 切换分类或搜索时重置到第一页
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

  // 分页计算
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Categories */}
        <div className="w-66 border-r bg-muted/10 p-6 space-y-6 flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold mb-3">类别</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border hover:bg-muted'
                }`}
              >
                全部分类
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Items Grid - 固定高度，禁止滚动 */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">暂无数据</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 auto-rows-fr gap-4 flex-1 content-start">
                  {paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                    >
                      <h3 className="font-semibold mb-2 line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>⭐ {item.usageCount}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 flex-shrink-0">
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
