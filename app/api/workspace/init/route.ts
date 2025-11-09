/**
 * 工作区初始化 API
 *
 * 用于创建新的 iFlow 工作区
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { createWorkspace } from "@/lib/db/queries";
import { getWorkspaceDir } from "@/lib/iflow/workspace";

export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. 解析请求体
    const body = await request.json();
    const { name } = body;

    console.log("[Workspace Init] Creating workspace for user:", session.user.id);

    // 3. 创建工作区记录（先用临时 ID）
    const tempWorkspace = await createWorkspace({
      userId: session.user.id,
      name: name || "默认工作区",
      path: "/tmp/placeholder", // 临时占位
      modelName: "MiniMax-M2",
      permissionMode: "yolo",
    });

    console.log("[Workspace Init] Workspace created:", tempWorkspace.id);

    // 4. 获取真实的工作区路径
    const realPath = getWorkspaceDir(tempWorkspace.id);

    console.log("[Workspace Init] Workspace path:", realPath);

    // 5. 返回工作区信息
    return NextResponse.json({
      workspace: {
        ...tempWorkspace,
        path: realPath,
      },
    });
  } catch (error) {
    console.error("[Workspace Init] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create workspace",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
