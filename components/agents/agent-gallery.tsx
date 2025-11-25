'use client';

import { useState, useMemo } from 'react';
import { useAgents } from '@/lib/hooks/use-agents';
import { AgentCard } from './agent-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentGalleryProps {
  onSelectAgent?: (agent: any) => void;
  onCreateAgent?: () => void;
  selectedAgentId?: string | null;
}

// 官方固定分类
const CATEGORIES = ['开发', '基础设施', '数据', '商业', '质量', '文档'];

// 官方固定标签
const TAGS = [
  'Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java', 'C++', 'C#', 'PHP', 'C语言', 'Elixir',
  'DevOps', '云计算', '数据库', '架构',
  '数据分析', '数据工程', '人工智能/机器学习',
  '市场营销', '金融', '法律',
  '测试', '安全', '性能',
  '文档', 'UI/UX',
  '前端', '后端', '移动开发', '游戏开发', '支持'
];

export function AgentGallery({
  onSelectAgent,
  onCreateAgent,
  selectedAgentId,
}: AgentGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12; // 4列 × 3行

  const { data: agentsData, isLoading } = useAgents({
    search: searchQuery || undefined,
  });

  const agents = agentsData?.agents || [];

  // 根据选中的分类和标签过滤智能体
  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((agent) => agent.category === selectedCategory);
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter((agent) => {
        if (!agent.tags || !Array.isArray(agent.tags)) return false;
        return selectedTags.some((tag) => agent.tags.includes(tag));
      });
    }

    return filtered;
  }, [agents, selectedCategory, selectedTags]);

  // 分页计算
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE);
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAgents.slice(startIndex, endIndex);
  }, [filteredAgents, currentPage, ITEMS_PER_PAGE]);

  // 切换分类或标签时重置到第一页
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Header - Full Width */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="text-2xl font-bold">智能体</h2>
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
              {CATEGORIES.map((category) => (
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

          {/* Tags */}
          <div>
            <h3 className="text-sm font-semibold mb-3">标签</h3>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
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
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar and Create Button */}
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
              {onCreateAgent && (
                <Button onClick={onCreateAgent} className="flex-shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              )}
            </div>
          </div>

          {/* Agent List */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `没有找到匹配 "${searchQuery}" 的智能体`
                    : selectedTags.length > 0
                    ? '没有匹配所选标签的智能体'
                    : selectedCategory === 'all'
                    ? '暂无智能体'
                    : '该分类下暂无智能体'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 auto-rows-fr gap-4 flex-1 content-start">
                  {paginatedAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      onSelect={onSelectAgent}
                      isSelected={selectedAgentId === agent.id}
                    />
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
