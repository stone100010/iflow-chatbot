import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { shares, shareSnapshots, shareLikes, shareViews } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// 更新分享请求验证
const updateShareSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  privacy: z.enum(['public', 'private']).optional(),
  isActive: z.boolean().optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url().optional(),
});

/**
 * GET /api/shares/[shortId]
 * 获取分享详情及快照消息
 */
export async function GET(
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

    // 2. 权限检查：private 分享只能作者访问
    if (share.privacy === 'private' && share.userId !== userId) {
      return NextResponse.json({ error: '无权访问此分享' }, { status: 403 });
    }

    // 3. 获取快照消息（按顺序）
    const snapshots = await db.query.shareSnapshots.findMany({
      where: eq(shareSnapshots.shareId, share.id),
      orderBy: [shareSnapshots.sequenceNumber],
    });

    // 4. 检查当前用户是否点赞过（仅登录用户）
    let isLikedByCurrentUser = false;
    if (userId) {
      const existingLike = await db.query.shareLikes.findFirst({
        where: and(
          eq(shareLikes.shareId, share.id),
          eq(shareLikes.userId, userId)
        ),
      });
      isLikedByCurrentUser = !!existingLike;
    }

    // 5. 返回完整的分享数据
    return NextResponse.json({
      ...share,
      messages: snapshots,
      isLikedByCurrentUser,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shortId}`,
    });
  } catch (error) {
    console.error('Get share error:', error);
    return NextResponse.json(
      { error: '获取分享失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/shares/[shortId]
 * 更新分享元数据（仅作者可操作）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { shortId } = await params;
    const body = await request.json();
    const validated = updateShareSchema.parse(body);

    // 1. 查找分享记录并验证所有权
    const share = await db.query.shares.findFirst({
      where: eq(shares.shortId, shortId),
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在' }, { status: 404 });
    }

    if (share.userId !== session.user.id) {
      return NextResponse.json({ error: '无权修改此分享' }, { status: 403 });
    }

    // 2. 更新分享记录
    const [updatedShare] = await db
      .update(shares)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(shares.id, share.id))
      .returning();

    return NextResponse.json(updatedShare);
  } catch (error) {
    console.error('Update share error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数验证失败', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '更新分享失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shares/[shortId]
 * 删除分享（仅作者可操作，级联删除快照）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { shortId } = await params;

    // 1. 查找分享记录并验证所有权
    const share = await db.query.shares.findFirst({
      where: eq(shares.shortId, shortId),
    });

    if (!share) {
      return NextResponse.json({ error: '分享不存在' }, { status: 404 });
    }

    if (share.userId !== session.user.id) {
      return NextResponse.json({ error: '无权删除此分享' }, { status: 403 });
    }

    // 2. 删除分享（级联删除关联的快照、浏览记录、点赞）
    await db.delete(shares).where(eq(shares.id, share.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    return NextResponse.json(
      { error: '删除分享失败' },
      { status: 500 }
    );
  }
}

