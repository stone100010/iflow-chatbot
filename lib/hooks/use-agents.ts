import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AIAgent } from '@/lib/db/schema';

// Types
interface AgentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface UseAgentsOptions {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface CreateAgentData {
  name: string;
  description?: string;
  systemPrompt: string;
  category: string;
  icon: string;
  tags?: string[];
  isPublic?: boolean;
}

// Fetch agents list
export function useAgents(options: UseAgentsOptions = {}) {
  return useQuery({
    queryKey: ['agents', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.category) params.set('category', options.category);
      if (options.search) params.set('search', options.search);
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.offset) params.set('offset', options.offset.toString());

      const res = await fetch(`/api/agents?${params}`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<{ agents: AIAgent[] }>;
    },
  });
}

// Fetch single agent
export function useAgent(id: string | null) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('Agent ID is required');
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch agent');
      return res.json() as Promise<{ agent: AIAgent }>;
    },
    enabled: !!id,
  });
}

// Fetch all categories
export function useAgentCategories() {
  return useQuery({
    queryKey: ['agent-categories'],
    queryFn: async () => {
      const res = await fetch('/api/agents/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json() as Promise<{ categories: AgentCategory[] }>;
    },
  });
}

// Create new agent
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAgentData) => {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create agent');
      }
      return res.json() as Promise<{ agent: AIAgent }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Update agent
export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreateAgentData>) => {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update agent');
      }
      return res.json() as Promise<{ agent: AIAgent }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Delete agent
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete agent');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

// Record agent usage
export function useAgentUsage(id: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${id}/use`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to record usage');
      return res.json();
    },
  });
}
