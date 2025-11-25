/**
 * 同步 iFlow 官方智能体到数据库
 *
 * 从 iFlow 官方商店 API 拉取所有智能体并存储到数据库
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const IFLOW_API_URL = 'https://platform.iflow.cn/api/platform/agents/list';

// 官方分类映射到图标
const CATEGORY_ICONS: Record<string, string> = {
  '开发': '💻',
  '基础设施': '🏗️',
  '数据': '📊',
  '商业': '💼',
  '文档': '📝',
  '质量': '✅',
  '其他': '🤖',
};

interface IFlowAgent {
  id: number;
  name: string;
  nameZh: string;
  modelName: string;
  category: string;
  categoryZh: string;
  tags: string[];
  tagsZh: string[];
  description: string;
  descriptionZh: string;
  detailContext: string;
  favTimes: number;
  version: number;
  color: string;
}

interface IFlowAPIResponse {
  success: boolean;
  code: string;
  message: string;
  data: {
    data: IFlowAgent[];
    total: number;
    page: number;
    size: number;
  };
}

async function fetchAllAgents(): Promise<IFlowAgent[]> {
  const allAgents: IFlowAgent[] = [];
  let page = 1;
  const size = 50;

  while (true) {
    console.log(`\n[Sync] Fetching page ${page}...`);

    const response = await fetch(IFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page,
        size,
        language: 'zh',
        name: '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.statusText}`);
    }

    const result: IFlowAPIResponse = await response.json();

    if (!result.success) {
      throw new Error(`API returned error: ${result.message}`);
    }

    const { data, total } = result.data;
    allAgents.push(...data);

    console.log(`[Sync] Fetched ${data.length} agents (Total so far: ${allAgents.length}/${total})`);

    // 如果已经获取所有数据，退出循环
    if (allAgents.length >= total) {
      break;
    }

    page++;
  }

  return allAgents;
}

async function syncAgentsToDatabase(agents: IFlowAgent[]) {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  const sql = postgres(process.env.POSTGRES_URL);

  try {
    // 1. 获取系统管理员用户ID
    console.log('\n[Sync] Finding system admin user...');
    const adminUsers = await sql`
      SELECT id FROM "User" WHERE "isAdmin" = true LIMIT 1
    `;

    if (adminUsers.length === 0) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    const systemUserId = adminUsers[0].id;
    console.log(`[Sync] Using admin user: ${systemUserId}`);

    // 2. 清空现有的预设智能体
    console.log('\n[Sync] Clearing existing preset agents...');
    const deleteResult = await sql`
      DELETE FROM "AIAgent" WHERE "isPreset" = true
    `;
    console.log(`[Sync] Deleted ${deleteResult.count} preset agents`);

    // 3. 插入新的智能体
    console.log('\n[Sync] Inserting new agents...');
    let insertedCount = 0;

    for (const agent of agents) {
      const icon = CATEGORY_ICONS[agent.categoryZh] || '🤖';

      await sql`
        INSERT INTO "AIAgent" (
          "userId",
          "externalId",
          "name",
          "description",
          "systemPrompt",
          "category",
          "icon",
          "tags",
          "isPreset",
          "isPublic",
          "usageCount",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${systemUserId},
          ${agent.id},
          ${agent.nameZh},
          ${agent.descriptionZh},
          ${agent.detailContext},
          ${agent.categoryZh},
          ${icon},
          ${agent.tagsZh || []},
          true,
          true,
          ${agent.favTimes || 0},
          NOW(),
          NOW()
        )
      `;

      insertedCount++;
      if (insertedCount % 10 === 0) {
        console.log(`[Sync] Inserted ${insertedCount}/${agents.length} agents...`);
      }
    }

    console.log(`\n[Sync] Successfully inserted ${insertedCount} agents`);

    // 4. 显示分类统计
    console.log('\n[Sync] Category statistics:');
    const categoryStats = await sql`
      SELECT category, COUNT(*) as count
      FROM "AIAgent"
      WHERE "isPreset" = true
      GROUP BY category
      ORDER BY count DESC
    `;

    categoryStats.forEach((stat: any) => {
      const icon = CATEGORY_ICONS[stat.category] || '🤖';
      console.log(`  ${icon} ${stat.category}: ${stat.count} agents`);
    });

  } finally {
    await sql.end();
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('iFlow Official Agents Sync');
  console.log('='.repeat(60));

  try {
    // 1. 从官方 API 拉取所有智能体
    const agents = await fetchAllAgents();
    console.log(`\n[Sync] Total agents fetched: ${agents.length}`);

    // 2. 同步到数据库
    await syncAgentsToDatabase(agents);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

main();
