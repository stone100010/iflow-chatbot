import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getWorkspaceById,
  deleteWorkspace,
  updateWorkspace,
} from "@/lib/db/queries";

/**
 * GET /api/iflow/workspaces/[id]
 * 获取指定工作区信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const userId = session.user.id;

    // 验证工作区所有权
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

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      isNameCustomized: workspace.isNameCustomized,
      createdAt: workspace.createdAt,
      lastAccessedAt: workspace.lastAccessedAt,
    });
  } catch (error) {
    console.error("[Workspaces API] Get error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/iflow/workspaces/[id]
 * 删除指定工作区
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const userId = session.user.id;

    // 验证工作区所有权
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

    // 删除工作区
    await deleteWorkspace(workspaceId);

    console.log(`[Workspaces API] Deleted workspace: ${workspaceId}`);

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("[Workspaces API] Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/iflow/workspaces/[id]
 * 更新工作区名称
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;
    const userId = session.user.id;

    // 解析请求体
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid workspace name" },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Workspace name too long (max 255 characters)" },
        { status: 400 }
      );
    }

    // 验证工作区所有权
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

    // 更新工作区名称
    const updatedWorkspace = await updateWorkspace(workspaceId, {
      name: name.trim(),
      isNameCustomized: true, // 标记为用户自定义名称
    });

    console.log(`[Workspaces API] Updated workspace name: ${workspaceId} -> "${name}"`);

    return NextResponse.json({
      success: true,
      workspace: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        isNameCustomized: updatedWorkspace.isNameCustomized,
      },
    });
  } catch (error) {
    console.error("[Workspaces API] Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
