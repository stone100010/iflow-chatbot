/**
 * 手动执行数据库迁移脚本
 * 添加 isNameCustomized 字段到 Workspace 表
 */

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// 加载环境变量
config({ path: ".env.local" });

async function migrate() {
  const databaseUrl = process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.error("❌ 错误: 找不到 POSTGRES_URL 环境变量");
    console.error("请确保 .env.local 文件存在并包含 POSTGRES_URL");
    process.exit(1);
  }

  console.log("🔄 开始执行数据库迁移...");
  console.log("📝 添加 isNameCustomized 字段到 Workspace 表");

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    await client`
      ALTER TABLE "Workspace"
      ADD COLUMN IF NOT EXISTS "isNameCustomized" boolean DEFAULT false NOT NULL
    `;

    console.log("✅ 迁移成功完成！");
    console.log("✨ Workspace 表已添加 isNameCustomized 字段");
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    await client.end();
    process.exit(1);
  }

  await client.end();
  process.exit(0);
}

migrate();
