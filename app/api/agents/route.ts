import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiAgents } from '@/lib/db/schema';
import { eq, and, or, desc, ilike, sql } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';
import { getCategoryNameCN } from '@/lib/constants/agent-categories';

// Validation schema
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10).max(10000),
  category: z.enum([
    'code-development',
    'debugging',
    'documentation',
    'performance',
    'security',
    'architecture',
    'other',
  ]),
  icon: z.string().max(10),
  tags: z.array(z.string()).max(10).default([]),
  isPublic: z.boolean().default(false),
});

// GET /api/agents - List agents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    const conditions = [];

    // User can see: their own agents + public preset agents
    conditions.push(
      or(
        eq(aiAgents.userId, session.user.id as string),
        and(eq(aiAgents.isPreset, true), eq(aiAgents.isPublic, true))
      )
    );

    // Filter by category (convert English ID to Chinese name)
    if (category) {
      const categoryCN = getCategoryNameCN(category);
      if (categoryCN) {
        conditions.push(eq(aiAgents.category, categoryCN));
      }
    }

    // Search by name or description
    if (search) {
      conditions.push(
        or(
          ilike(aiAgents.name, `%${search}%`),
          ilike(aiAgents.description, `%${search}%`)
        )
      );
    }

    const agents = await db.query.aiAgents.findMany({
      where: and(...conditions),
      orderBy: [desc(aiAgents.usageCount), desc(aiAgents.createdAt)],
      limit,
      offset,
      columns: {
        systemPrompt: false, // Don't return system prompt in list view
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAgentSchema.parse(body);

    // Create agent
    const [agent] = await db
      .insert(aiAgents)
      .values({
        ...validated,
        userId: session.user.id as string,
        isPreset: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
