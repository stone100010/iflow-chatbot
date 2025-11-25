import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { shares, shareViews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

/**
 * POST /api/shares/[shortId]/view
 * 记录分享浏览
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    // 1. 查找分享记录
    const share = await db.query.shares.findFirst({
      where: eq(shares.shortId, shortId),
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在' }, { status: 404 });
    }

    // 2. 获取访客信息
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || '';
    const referer = headersList.get('referer') || '';

    // 3. 生成访客 ID（对于未登录用户）
    const visitorId = userId ? null : `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 4. 记录浏览
    await db.insert(shareViews).values({
      shareId: share.id,
      visitorId,
      userId: userId || null,
      ipAddress: ipAddress.split(',')[0].trim().slice(0, 45), // 取第一个 IP，限制长度
      userAgent: userAgent.slice(0, 500),
      referer: referer.slice(0, 500),
    });

    // 5. 更新浏览计数
    await db
      .update(shares)
      .set({
        viewCount: share.viewCount + 1,
      })
      .where(eq(shares.id, share.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json(
      { error: '记录浏览失败' },
      { status: 500 }
    );
  }
}
