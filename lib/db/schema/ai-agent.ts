// AI Agent Schema
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '../schema';

export const aiAgents = pgTable(
  'AIAgent',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    systemPrompt: text('systemPrompt').notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    icon: varchar('icon', { length: 10 }).notNull().default('🤖'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    isPreset: boolean('isPreset').notNull().default(false),
    isPublic: boolean('isPublic').notNull().default(false),
    usageCount: integer('usageCount').notNull().default(0),
    externalId: integer('externalId').unique(), // iFlow官方智能体ID

    // 分享相关字段
    shareCode: varchar('shareCode', { length: 32 }).unique(),
    allowShare: boolean('allowShare').notNull().default(false),
    shareCount: integer('shareCount').notNull().default(0),

    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => ({
    userIdIdx: index('idx_agent_user_id').on(table.userId),
    categoryIdx: index('idx_agent_category').on(table.category),
    isPresetIdx: index('idx_agent_is_preset').on(table.isPreset),
    isPublicIdx: index('idx_agent_is_public').on(table.isPublic),
    usageCountIdx: index('idx_agent_usage_count').on(table.usageCount.desc()),
    createdAtIdx: index('idx_agent_created_at').on(table.createdAt.desc()),
    shareCodeIdx: index('idx_agent_share_code').on(table.shareCode),
    externalIdIdx: index('idx_agent_external_id').on(table.externalId),
  })
);

// 智能体分享关系表
export const agentShares = pgTable(
  'AgentShare',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    agentId: text('agentId')
      .notNull()
      .references(() => aiAgents.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sharedAt: timestamp('sharedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean('isActive').notNull().default(true),
  },
  (table) => ({
    userIdIdx: index('idx_agent_share_user_id').on(table.userId),
    agentIdIdx: index('idx_agent_share_agent_id').on(table.agentId),
    activeIdx: index('idx_agent_share_active').on(table.userId, table.isActive),
    uniqueUserAgent: uniqueIndex('unique_user_agent').on(
      table.userId,
      table.agentId
    ),
  })
);

// Relations
export const aiAgentRelations = relations(aiAgents, ({ one, many }) => ({
  user: one(user, {
    fields: [aiAgents.userId],
    references: [user.id],
  }),
  shares: many(agentShares),
}));

export const agentShareRelations = relations(agentShares, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [agentShares.agentId],
    references: [aiAgents.id],
  }),
  user: one(user, {
    fields: [agentShares.userId],
    references: [user.id],
  }),
}));

// Types
export type AIAgent = typeof aiAgents.$inferSelect;
export type NewAIAgent = typeof aiAgents.$inferInsert;
export type AgentShare = typeof agentShares.$inferSelect;
export type NewAgentShare = typeof agentShares.$inferInsert;

// Metadata interface
export interface AgentMetadata {
  // 智能体变量 (Phase 2 功能)
  variables?: Array<{
    name: string;
    label: string;
    type: 'text' | 'select';
    required: boolean;
    defaultValue?: string;
    options?: string[];
  }>;

  // 使用示例
  examples?: Array<{
    input: string;
    output: string;
  }>;

  // 推荐配置
  recommendedModel?: string;
  recommendedPermission?: string;

  // 平均评分 (0-5)
  averageRating?: number;

  // 版本号
  version?: string;

  // 智能体人设
  personality?: string;
}
