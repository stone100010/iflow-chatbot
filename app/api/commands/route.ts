import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { commands } from '@/lib/db/schema';
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
      .from(commands)
      .where(eq(commands.isPreset, true))
      .orderBy(desc(commands.usageCount));

    if (category) {
      query = query.where(and(
        eq(commands.isPreset, true),
        eq(commands.category, category)
      )) as any;
    }

    if (search) {
      query = query.where(and(
        eq(commands.isPreset, true),
        sql`${commands.name} ILIKE ${`%${search}%`}`
      )) as any;
    }

    const results = await query;

    return NextResponse.json({ commands: results });
  } catch (error) {
    console.error('[Commands API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
