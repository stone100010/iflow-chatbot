/**
 * CSRF Token API
 *
 * GET /api/csrf-token - 获取 CSRF token
 */

import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateCsrfToken } from "@/lib/security/csrf";

export async function GET() {
  // 验证用户身份
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 生成 CSRF token
  const csrfToken = generateCsrfToken(session.user.id);

  return NextResponse.json({
    csrfToken,
    expiresIn: 3600, // 1 小时（秒）
  });
}
