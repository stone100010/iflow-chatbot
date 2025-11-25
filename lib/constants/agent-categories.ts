// AI Agent Categories (对应 iFlow 官方分类)
export const AGENT_CATEGORIES = {
  'development': {
    id: 'development',
    name: 'Development',
    nameCN: '开发',
    icon: '💻',
    description: 'Code development, programming languages',
  },
  'infrastructure': {
    id: 'infrastructure',
    name: 'Infrastructure',
    nameCN: '基础设施',
    icon: '🏗️',
    description: 'DevOps, database, deployment',
  },
  'data': {
    id: 'data',
    name: 'Data',
    nameCN: '数据',
    icon: '📊',
    description: 'Data analysis, AI/ML, analytics',
  },
  'business': {
    id: 'business',
    name: 'Business',
    nameCN: '商业',
    icon: '💼',
    description: 'Product, marketing, finance',
  },
  'quality': {
    id: 'quality',
    name: 'Quality',
    nameCN: '质量',
    icon: '✅',
    description: 'Testing, QA, code review',
  },
  'documentation': {
    id: 'documentation',
    name: 'Documentation',
    nameCN: '文档',
    icon: '📝',
    description: 'Technical writing, API docs',
  },
  'other': {
    id: 'other',
    name: 'Other',
    nameCN: '其他',
    icon: '📦',
    description: 'Other agent types',
  },
} as const;

export type AgentCategory = keyof typeof AGENT_CATEGORIES;

// Helper function to get category info
export function getAgentCategory(id: AgentCategory) {
  return AGENT_CATEGORIES[id];
}

// Get all categories as array
export function getAllCategories() {
  return Object.values(AGENT_CATEGORIES);
}

// Get Chinese category name from English ID
export function getCategoryNameCN(id: string): string | undefined {
  const category = Object.values(AGENT_CATEGORIES).find(cat => cat.id === id);
  return category?.nameCN;
}

// Get English ID from Chinese category name
export function getCategoryIdFromCN(nameCN: string): string | undefined {
  const category = Object.values(AGENT_CATEGORIES).find(cat => cat.nameCN === nameCN);
  return category?.id;
}
