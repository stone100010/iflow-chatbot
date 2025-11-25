'use client';

import { UnifiedGallery } from '@/components/unified-gallery';
import { UnifiedCard } from '@/components/unified-card';

const CATEGORIES = ['实用工具', '开发', '测试', '文档'];

const TAGS = [
  'Python', 'JavaScript', 'TypeScript', 'Git', 'Docker',
  '调试', '重构', '代码审查', '单元测试', '文档生成',
  'CLI', 'API', '自动化', '格式化', '优化'
];

export default function CommandsPage() {
  const handleInstall = (id: string) => {
    console.log('Install command:', id);
    // TODO: 实现安装逻辑
  };

  return (
    <UnifiedGallery
      title="指令"
      apiEndpoint="/api/commands"
      categories={CATEGORIES}
      tags={TAGS}
      itemKey="commands"
      renderCard={(item) => (
        <UnifiedCard
          key={item.id}
          id={item.id}
          name={item.name}
          category={item.category}
          version={item.version}
          description={item.description}
          tags={item.tags}
          usageCount={item.usageCount}
          onInstall={handleInstall}
        />
      )}
    />
  );
}
