'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AgentTag } from '@/components/agents';
import { useAgents } from '@/lib/hooks/use-agents';
import { BotIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AIAgent } from '@/lib/db/schema';

interface AgentSelectorProps {
  selectedAgent: Omit<AIAgent, 'systemPrompt'> | null;
  onSelectAgent: (agent: Omit<AIAgent, 'systemPrompt'> | null) => void;
  disabled?: boolean;
}

export function AgentSelector({
  selectedAgent,
  onSelectAgent,
  disabled = false,
}: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: agentsData, isLoading } = useAgents({
    search: search || undefined,
  });

  const agents = agentsData?.agents || [];

  const handleSelectAgent = (agent: Omit<AIAgent, 'systemPrompt'>) => {
    onSelectAgent(agent);
    setOpen(false);
  };

  if (selectedAgent) {
    return (
      <AgentTag
        icon={selectedAgent.icon}
        name={selectedAgent.name}
        onRemove={() => onSelectAgent(null)}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-2"
        >
          <BotIcon className="w-4 h-4" />
          <span>Select AI Agent</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            ) : agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BotIcon className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? `No agents found matching "${search}"` : 'No agents available'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent)}
                    className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-2xl flex-shrink-0">{agent.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {agent.name}
                        </span>
                        {agent.isPreset && (
                          <Badge variant="secondary" className="text-xs">
                            Preset
                          </Badge>
                        )}
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
