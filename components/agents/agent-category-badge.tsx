import { Badge } from '@/components/ui/badge';
import { getAgentCategory } from '@/lib/constants/agent-categories';

interface AgentCategoryBadgeProps {
  category: string;
  showIcon?: boolean;
  className?: string;
}

export function AgentCategoryBadge({
  category,
  showIcon = true,
  className = '',
}: AgentCategoryBadgeProps) {
  const categoryData = getAgentCategory(category as any);

  if (!categoryData) {
    return null;
  }

  return (
    <Badge variant="secondary" className={`text-xs ${className}`}>
      {showIcon && <span className="mr-1">{categoryData.icon}</span>}
      {categoryData.name}
    </Badge>
  );
}
