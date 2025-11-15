/**
 * Session Manager 监控 API
 *
 * GET /api/admin/sessions - 获取会话统计信息
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { sessionManager } from "@/lib/iflow/session-manager";

export async function GET() {
  // 验证身份
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 获取会话统计信息
  const stats = sessionManager.getStats();
  const activeSessions = sessionManager.getActiveSessions();

  return NextResponse.json({
    stats,
    activeSessions: activeSessions.slice(0, 100), // 只返回前100个，避免数据过大
    timestamp: new Date().toISOString(),
  });
}
