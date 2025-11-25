'use client';

import { UnifiedGallery } from '@/components/unified-gallery';
import { UnifiedCard } from '@/components/unified-card';

const CATEGORIES = ['数据', '文档处理', '艺术创作', '项目开发'];

const TAGS = [
  'Python', 'JavaScript', 'TypeScript', 'Node.js', 'React',
  '数据分析', '自动化', 'API', 'Web开发', '测试',
  '文档生成', '代码生成', 'DevOps', '云服务'
];

export default function WorkflowsPage() {
  const handleInstall = (id: string) => {
    console.log('Install workflow:', id);
    // TODO: 实现安装逻辑
  };

  return (
    <UnifiedGallery
      title="工作流"
      apiEndpoint="/api/workflows"
      categories={CATEGORIES}
      tags={TAGS}
      itemKey="workflows"
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
