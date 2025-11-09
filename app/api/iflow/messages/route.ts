/**
 * iFlow 消息历史 API
 *
 * 加载指定工作区的历史消息
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getIFlowMessagesByWorkspaceId, getWorkspaceById } from "@/lib/db/queries";

/**
 * GET /api/iflow/messages?workspaceId={id}
 *
 * 获取工作区的消息历史
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    // 3. 验证工作区所有权
    const workspace = await getWorkspaceById(workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Not your workspace" },
        { status: 403 }
      );
    }

    // 4. 获取消息历史
    const messages = await getIFlowMessagesByWorkspaceId(workspaceId);

    console.log(`[Messages API] Loaded ${messages.length} messages for workspace ${workspaceId}`);

    // 5. 返回消息列表
    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        agentInfo: msg.agentInfo,
        toolCalls: msg.toolCalls,
        plan: msg.plan,
        stopReason: msg.stopReason,
        createdAt: msg.createdAt,
      })),
      total: messages.length,
    });
  } catch (error) {
    console.error("[Messages API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
