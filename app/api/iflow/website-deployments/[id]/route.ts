/**
 * 单个网站部署 API
 *
 * GET: 获取部署详情
 * PATCH: 更新部署状态
 * DELETE: 删除部署记录
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getWebsiteDeploymentById,
  updateWebsiteDeploymentStatus,
  deleteWebsiteDeployment,
} from "@/lib/db/queries";

/**
 * GET /api/iflow/website-deployments/[id]
 *
 * 获取单个网站部署详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deploymentId = params.id;

    // 2. 获取部署信息
    const deployment = await getWebsiteDeploymentById(deploymentId);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    // 3. 验证权限（只能访问自己的部署）
    if (deployment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. 返回部署信息
    return NextResponse.json({
      id: deployment.id,
      workspaceId: deployment.workspaceId,
      port: deployment.port,
      url: deployment.url,
      chatbotUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/website/${deployment.id}`,
      title: deployment.title,
      description: deployment.description,
      status: deployment.status,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    });
  } catch (error) {
    console.error("[Website Deployment API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/iflow/website-deployments/[id]
 *
 * 更新网站部署状态
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deploymentId = params.id;

    // 2. 获取部署信息并验证权限
    const deployment = await getWebsiteDeploymentById(deploymentId);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    if (deployment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. 解析请求体
    const body = await request.json();
    const { status } = body;

    // 4. 验证状态值
    if (!status || !["running", "stopped"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'running' or 'stopped'" },
        { status: 400 }
      );
    }

    // 5. 更新状态
    const updatedDeployment = await updateWebsiteDeploymentStatus(
      deploymentId,
      status
    );

    console.log(
      `[Website Deployment API] Updated deployment ${deploymentId} status to ${status}`
    );

    return NextResponse.json({
      success: true,
      deployment: {
        id: updatedDeployment.id,
        status: updatedDeployment.status,
        updatedAt: updatedDeployment.updatedAt,
      },
    });
  } catch (error) {
    console.error("[Website Deployment API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/iflow/website-deployments/[id]
 *
 * 删除网站部署记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deploymentId = params.id;

    // 2. 获取部署信息并验证权限
    const deployment = await getWebsiteDeploymentById(deploymentId);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    if (deployment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. 删除部署记录
    await deleteWebsiteDeployment(deploymentId);

    console.log(
      `[Website Deployment API] Deleted deployment ${deploymentId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Website Deployment API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
