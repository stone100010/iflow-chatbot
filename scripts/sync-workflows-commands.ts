/**
 * 同步 iFlow 官方工作流和指令到数据库
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const WORKFLOW_API = 'https://iflow.cn/api/platform/workflows/list';
const COMMAND_API = 'https://platform.iflow.cn/api/platform/commands/list';

async function fetchAll(apiUrl: string, type: string) {
  const allItems: any[] = [];
  let page = 1;
  const size = 50;

  while (true) {
    console.log(`\n[Sync ${type}] Fetching page ${page}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, size, language: 'zh', name: '' }),
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    const result = await response.json();
    if (!result.success) throw new Error(`API error: ${result.message}`);

    const { data, total } = result.data;
    allItems.push(...data);

    console.log(`[Sync ${type}] Fetched ${data.length} items (Total: ${allItems.length}/${total})`);

    if (allItems.length >= total) break;
    page++;
  }

  return allItems;
}

async function syncWorkflows(sql: any, userId: string) {
  console.log('\n=== Syncing Workflows ===');

  const workflows = await fetchAll(WORKFLOW_API, 'Workflows');

  console.log(`\n[Workflows] Clearing existing presets...`);
  await sql`DELETE FROM "Workflow" WHERE "isPreset" = true`;

  console.log(`[Workflows] Inserting ${workflows.length} items...`);

  for (const wf of workflows) {
    const nameObj = JSON.parse(wf.name);
    const categoryObj = JSON.parse(wf.category);
    const tagsObj = wf.tags ? JSON.parse(wf.tags) : {};
    const descObj = JSON.parse(wf.description);
    const extInfo = wf.extInfo ? JSON.parse(wf.extInfo) : {};

    await sql`
      INSERT INTO "Workflow" (
        "userId", "externalId", "workflowId", "name", "description",
        "category", "tags", "version", "downloadUrl", "folderStructure",
        "isPreset", "isPublic", "usageCount", "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, ${wf.id}, ${wf.workflowId}, ${nameObj.zh || nameObj.en},
        ${descObj.zh || descObj.en}, ${categoryObj.zh || categoryObj.en},
        ${tagsObj.zh ? tagsObj.zh.split(',') : []}, ${wf.version},
        ${extInfo.url || null}, ${extInfo.folderStructure || null},
        true, true, ${wf.favTimes || 0}, NOW(), NOW()
      )
    `;
  }

  console.log(`✅ Workflows synced!`);
}

async function syncCommands(sql: any, userId: string) {
  console.log('\n=== Syncing Commands ===');

  const commands = await fetchAll(COMMAND_API, 'Commands');

  console.log(`\n[Commands] Clearing existing presets...`);
  await sql`DELETE FROM "Command" WHERE "isPreset" = true`;

  console.log(`[Commands] Inserting ${commands.length} items...`);

  for (const cmd of commands) {
    await sql`
      INSERT INTO "Command" (
        "userId", "externalId", "name", "description", "detailContext",
        "category", "tags", "modelName", "version",
        "isPreset", "isPublic", "usageCount", "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, ${cmd.id}, ${cmd.nameZh}, ${cmd.descriptionZh},
        ${cmd.detailContext}, ${cmd.categoryZh}, ${cmd.tagsZh || []},
        ${cmd.modelName}, ${cmd.version},
        true, true, ${cmd.favTimes || 0}, NOW(), NOW()
      )
    `;
  }

  console.log(`✅ Commands synced!`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('iFlow Workflows & Commands Sync');
  console.log('='.repeat(60));

  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL not set');
  }

  const sql = postgres(process.env.POSTGRES_URL);

  try {
    const adminUsers = await sql`SELECT id FROM "User" WHERE "isAdmin" = true LIMIT 1`;
    if (adminUsers.length === 0) throw new Error('No admin user found');

    const userId = adminUsers[0].id;
    console.log(`Using admin user: ${userId}`);

    await syncWorkflows(sql, userId);
    await syncCommands(sql, userId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Sync completed!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
