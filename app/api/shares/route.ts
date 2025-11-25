import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { shares, shareSnapshots, workspace, iflowMessage } from '@/lib/db/schema';
import { generateUniqueShortId } from '@/lib/utils/generate-unique-short-id';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';

// 创建分享请求验证
const createShareSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
});

/**
 * POST /api/shares
 * 创建分享并生成消息快照
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createShareSchema.parse(body);

    // 1. 验证工作区所有权并获取消息
    const workspaceWithMessages = await db.query.workspace.findFirst({
      where: and(
        eq(workspace.id, validated.workspaceId),
        eq(workspace.userId, session.user.id)
      ),
      with: {
        messages: {
          orderBy: [asc(iflowMessage.createdAt)],
        },
      },
    });

    if (!workspaceWithMessages) {
      return NextResponse.json(
        { error: '工作区不存在或无权限' },
        { status: 404 }
      );
    }

    if (!workspaceWithMessages.messages || workspaceWithMessages.messages.length === 0) {
      return NextResponse.json(
        { error: '无法分享空对话' },
        { status: 400 }
      );
    }

    // 2. 生成唯一 shortId
    const shortId = await generateUniqueShortId();
    const snapshotAt = new Date();

    // 3. 创建分享记录
    const [share] = await db.insert(shares).values({
      shortId,
      workspaceId: validated.workspaceId,
      userId: session.user.id,
      title: validated.title,
      description: validated.description,
      privacy: 'public', // 创建分享即为公开
      messageCount: workspaceWithMessages.messages.length,
      snapshotAt,
      ogTitle: validated.ogTitle,
      ogDescription: validated.ogDescription,
    }).returning();

    // 4. 批量插入快照消息(核心逻辑)
    const snapshotMessages = workspaceWithMessages.messages.map((msg, index) => ({
      shareId: share.id,
      messageId: msg.id, // 仅用于追踪,不建外键
      role: msg.role,
      content: msg.content,
      sequenceNumber: index + 1,
      metadata: {
        agentInfo: msg.agentInfo,
        toolCalls: msg.toolCalls,
        plan: msg.plan,
        stopReason: msg.stopReason,
      },
      messageCreatedAt: msg.createdAt,
      snapshotAt,
    }));

    await db.insert(shareSnapshots).values(snapshotMessages);

    // 5. 返回分享信息
    return NextResponse.json({
      ...share,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shortId}`,
    });
  } catch (error) {
    console.error('Create share error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数验证失败', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '创建分享失败' },
      { status: 500 }
    );
  }
}
