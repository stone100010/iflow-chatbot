'use client';

import { AgentCard } from './agent-card';
import type { AIAgent } from '@/lib/db/schema';
import { Loader2 } from 'lucide-react';

interface AgentListProps {
  agents: Omit<AIAgent, 'systemPrompt'>[];
  isLoading?: boolean;
  onSelectAgent?: (agent: Omit<AIAgent, 'systemPrompt'>) => void;
  onEditAgent?: (agent: Omit<AIAgent, 'systemPrompt'>) => void;
  selectedAgentId?: string | null;
  emptyMessage?: string;
}

export function AgentList({
  agents,
  isLoading = false,
  onSelectAgent,
  onEditAgent,
  selectedAgentId,
  emptyMessage = 'No agents found',
}: AgentListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onSelect={onSelectAgent}
          onEdit={onEditAgent}
          isSelected={selectedAgentId === agent.id}
        />
      ))}
    </div>
  );
}
