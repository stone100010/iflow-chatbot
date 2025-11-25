import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiAgents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/app/(auth)/auth';

// POST /api/agents/[id]/use - Record agent usage
export async function POST(
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

    // Increment usage count
    await db
      .update(aiAgents)
      .set({
        usageCount: sql`${aiAgents.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(aiAgents.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording agent usage:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}
