'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AgentTagProps {
  icon: string;
  name: string;
  onRemove?: () => void;
  className?: string;
}

export function AgentTag({ icon, name, onRemove, className = '' }: AgentTagProps) {
  return (
    <Badge variant="secondary" className={`text-sm py-1 px-2 ${className}`}>
      <span className="mr-1">{icon}</span>
      <span className="font-medium">{name}</span>
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 ml-1 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3 h-3 hover:text-destructive" />
        </Button>
      )}
    </Badge>
  );
}
