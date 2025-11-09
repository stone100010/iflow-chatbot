/**
 * iFlow 工作区列表 API
 *
 * 获取用户的所有工作区
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getWorkspacesByUserId } from "@/lib/db/queries";

/**
 * GET /api/iflow/workspaces
 *
 * 获取当前用户的所有工作区列表
 */
export async function GET(request: NextRequest) {
  const apiStart = performance.now();

  try {
    // 1. 身份验证
    const authStart = performance.now();
    const session = await auth();
    const authDuration = performance.now() - authStart;
    console.log(`⏱️  [Workspaces API] Auth took ${authDuration.toFixed(2)}ms`);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. 获取工作区列表
    const dbStart = performance.now();
    const workspaces = await getWorkspacesByUserId(userId);
    const dbDuration = performance.now() - dbStart;
    console.log(`⏱️  [Workspaces API] DB query took ${dbDuration.toFixed(2)}ms`);

    console.log(`[Workspaces API] Loaded ${workspaces.length} workspaces for user ${userId}`);

    // 3. 返回工作区列表
    const responseData = NextResponse.json({
      workspaces: workspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        path: ws.path,
        modelName: ws.modelName,
        permissionMode: ws.permissionMode,
        createdAt: ws.createdAt,
        lastAccessedAt: ws.lastAccessedAt,
      })),
      total: workspaces.length,
    });

    const totalDuration = performance.now() - apiStart;
    const emoji = totalDuration > 1000 ? "🔴" : totalDuration > 500 ? "🟡" : "🟢";
    console.log(`${emoji} [Workspaces API] Total API time: ${totalDuration.toFixed(2)}ms`);

    return responseData;
  } catch (error) {
    console.error("[Workspaces API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
