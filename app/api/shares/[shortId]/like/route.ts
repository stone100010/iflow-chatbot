import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { shares, shareLikes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/shares/[shortId]/like
 * 点赞/取消点赞（需要登录）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { shortId } = await params;
    const userId = session.user.id;

    // 1. 查找分享记录
    const share = await db.query.shares.findFirst({
      where: eq(shares.shortId, shortId),
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在' }, { status: 404 });
    }

    // 2. 检查是否已点赞
    const existingLike = await db.query.shareLikes.findFirst({
      where: and(
        eq(shareLikes.shareId, share.id),
        eq(shareLikes.userId, userId)
      ),
    });

    let isLiked: boolean;

    if (existingLike) {
      // 3a. 取消点赞
      await db
        .delete(shareLikes)
        .where(
          and(
            eq(shareLikes.shareId, share.id),
            eq(shareLikes.userId, userId)
          )
        );

      // 更新点赞计数
      await db
        .update(shares)
        .set({
          likeCount: Math.max(0, share.likeCount - 1),
        })
        .where(eq(shares.id, share.id));

      isLiked = false;
    } else {
      // 3b. 添加点赞
      await db.insert(shareLikes).values({
        shareId: share.id,
        userId,
      });

      // 更新点赞计数
      await db
        .update(shares)
        .set({
          likeCount: share.likeCount + 1,
        })
        .where(eq(shares.id, share.id));

      isLiked = true;
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: isLiked ? share.likeCount + 1 : Math.max(0, share.likeCount - 1),
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    );
  }
}
