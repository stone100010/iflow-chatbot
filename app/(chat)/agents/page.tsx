'use client';

import { useState } from 'react';
import { UnifiedGallery } from '@/components/unified-gallery';
import { UnifiedCard } from '@/components/unified-card';
import { AgentEditor } from '@/components/agents';

const CATEGORIES = ['开发', '基础设施', '数据', '商业', '质量', '文档'];

const TAGS = [
  'Python', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Java', 'C++', 'C#', 'PHP', 'C语言', 'Elixir',
  'DevOps', '云计算', '数据库', '架构',
  '数据分析', '数据工程', '人工智能/机器学习',
  '市场营销', '金融', '法律',
  '测试', '安全', '性能',
  '文档', 'UI/UX',
  '前端', '后端', '移动开发', '游戏开发', '支持'
];

export default function AgentsPage() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleInstall = (id: string) => {
    console.log('Install agent:', id);
    // TODO: 实现安装逻辑
  };

  return (
    <>
      <UnifiedGallery
        title="智能体"
        apiEndpoint="/api/agents"
        categories={CATEGORIES}
        tags={TAGS}
        itemKey="agents"
        onCreateItem={() => setIsEditorOpen(true)}
        renderCard={(item) => (
          <UnifiedCard
            key={item.id}
            id={item.id}
            name={item.name}
            category={item.category}
            version={item.metadata?.version}
            description={item.description}
            tags={item.tags}
            usageCount={item.usageCount}
            icon={item.icon}
            onInstall={handleInstall}
          />
        )}
      />

      <AgentEditor
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={() => {
          setIsEditorOpen(false);
        }}
      />
    </>
  );
}
