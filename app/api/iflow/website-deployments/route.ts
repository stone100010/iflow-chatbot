/**
 * 网站部署 API
 *
 * POST: 注册新的网站部署
 * GET: 获取用户的所有网站部署
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  createWebsiteDeployment,
  getWebsiteDeploymentsByUserId,
} from "@/lib/db/queries";

/**
 * POST /api/iflow/website-deployments
 *
 * 注册新的网站部署（由 iFlow CLI 调用）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. 解析请求体
    const body = await request.json();
    const { workspaceId, port, url, title, description } = body;

    // 3. 验证必需字段
    if (!workspaceId || !port || !url) {
      return NextResponse.json(
        { error: "Missing required fields: workspaceId, port, url" },
        { status: 400 }
      );
    }

    // 4. 创建部署记录
    const deployment = await createWebsiteDeployment({
      workspaceId,
      userId,
      port,
      url,
      title,
      description,
    });

    console.log(
      `[Website Deployment API] Created deployment ${deployment.id} for workspace ${workspaceId} on port ${port}`
    );

    // 5. 返回部署信息（包含可访问的 URL）
    return NextResponse.json({
      success: true,
      deployment: {
        id: deployment.id,
        workspaceId: deployment.workspaceId,
        port: deployment.port,
        url: deployment.url,
        // 提供通过 Chatbot 访问的友好链接
        chatbotUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/website/${deployment.id}`,
        title: deployment.title,
        description: deployment.description,
        status: deployment.status,
        createdAt: deployment.createdAt,
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
 * GET /api/iflow/website-deployments
 *
 * 获取当前用户的所有网站部署
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. 获取部署列表
    const deployments = await getWebsiteDeploymentsByUserId(userId);

    console.log(
      `[Website Deployment API] Loaded ${deployments.length} deployments for user ${userId}`
    );

    // 3. 返回部署列表
    return NextResponse.json({
      deployments: deployments.map((d) => ({
        id: d.id,
        workspaceId: d.workspaceId,
        port: d.port,
        url: d.url,
        chatbotUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/website/${d.id}`,
        title: d.title,
        description: d.description,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      total: deployments.length,
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
