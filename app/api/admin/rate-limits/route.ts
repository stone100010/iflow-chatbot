/**
 * Rate Limit Stats API
 *
 * GET /api/admin/rate-limits - 获取所有速率限制器的统计信息
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  chatRateLimiter,
  authRateLimiter,
  generalRateLimiter,
} from "@/lib/security/rate-limiter";

export async function GET() {
  // 验证用户身份
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 获取所有限制器的统计信息
  const stats = {
    chat: chatRateLimiter.getStats(),
    auth: authRateLimiter.getStats(),
    general: generalRateLimiter.getStats(),
  };

  return NextResponse.json({
    stats,
    timestamp: new Date().toISOString(),
  });
}
