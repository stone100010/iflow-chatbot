'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AgentCategoryBadge } from './agent-category-badge';
import type { AIAgent } from '@/lib/db/schema';
import { MessageSquare, Star, Users } from 'lucide-react';

interface AgentCardProps {
  agent: Omit<AIAgent, 'systemPrompt'>;
  onSelect?: (agent: Omit<AIAgent, 'systemPrompt'>) => void;
  onEdit?: (agent: Omit<AIAgent, 'systemPrompt'>) => void;
  showActions?: boolean;
  isSelected?: boolean;
}

export function AgentCard({
  agent,
  onSelect,
  onEdit,
  showActions = true,
  isSelected = false,
}: AgentCardProps) {
  return (
    <Card
      className={`group transition-all hover:shadow-lg cursor-pointer ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(agent)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">{agent.icon}</span>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1">{agent.name}</CardTitle>
              {agent.isPreset && (
                <Badge variant="outline" className="mt-1 text-xs">
                  <Star className="w-3 h-3 mr-1" />
                  Preset
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {agent.description || 'No description provided'}
        </CardDescription>

        <div className="flex items-center gap-2 flex-wrap">
          <AgentCategoryBadge category={agent.category} />
          {agent.tags && agent.tags.length > 0 && (
            <>
              {agent.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {agent.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.tags.length - 2}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {agent.usageCount || 0}
            </span>
            {agent.isPublic && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Public
              </span>
            )}
          </div>

          {showActions && onEdit && !agent.isPreset && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(agent);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
