import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { workflows } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = db
      .select()
      .from(workflows)
      .where(eq(workflows.isPreset, true))
      .orderBy(desc(workflows.usageCount));

    if (category) {
      query = query.where(and(
        eq(workflows.isPreset, true),
        eq(workflows.category, category)
      )) as any;
    }

    if (search) {
      query = query.where(and(
        eq(workflows.isPreset, true),
        sql`${workflows.name} ILIKE ${`%${search}%`}`
      )) as any;
    }

    const results = await query;

    return NextResponse.json({ workflows: results });
  } catch (error) {
    console.error('[Workflows API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
