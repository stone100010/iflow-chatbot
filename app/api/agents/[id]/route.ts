import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiAgents } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10).max(10000).optional(),
  category: z
    .enum([
      'code-development',
      'debugging',
      'documentation',
      'performance',
      'security',
      'architecture',
      'other',
    ])
    .optional(),
  icon: z.string().max(10).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/agents/[id] - Get single agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await db.query.aiAgents.findFirst({
      where: eq(aiAgents.id, params.id),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user can access this agent
    const canAccess =
      agent.userId === session.user.id ||
      (agent.isPreset && agent.isPublic);

    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If user is not the owner, don't return systemPrompt
    if (agent.userId !== session.user.id) {
      const { systemPrompt, ...agentWithoutPrompt } = agent;
      return NextResponse.json({ agent: agentWithoutPrompt });
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/[id] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await db.query.aiAgents.findFirst({
      where: eq(aiAgents.id, params.id),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Only owner can update (preset agents cannot be updated)
    if (agent.userId !== session.user.id || agent.isPreset) {
      return NextResponse.json(
        { error: 'Cannot update this agent' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateAgentSchema.parse(body);

    const [updated] = await db
      .update(aiAgents)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(aiAgents.id, params.id))
      .returning();

    return NextResponse.json({ agent: updated });
  } catch (error) {
    console.error('Error updating agent:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await db.query.aiAgents.findFirst({
      where: eq(aiAgents.id, params.id),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Only owner can delete (preset agents cannot be deleted)
    if (agent.userId !== session.user.id || agent.isPreset) {
      return NextResponse.json(
        { error: 'Cannot delete this agent' },
        { status: 403 }
      );
    }

    await db.delete(aiAgents).where(eq(aiAgents.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
