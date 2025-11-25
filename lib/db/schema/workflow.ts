// Workflow Schema
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from '../schema';

export const workflows = pgTable(
  'Workflow',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    externalId: integer('externalId').unique(), // iFlow官方工作流ID
    workflowId: varchar('workflowId', { length: 100 }), // 官方workflowId
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }).notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    version: integer('version').notNull().default(1),
    downloadUrl: text('downloadUrl'), // 下载链接
    folderStructure: jsonb('folderStructure'), // 文件夹结构
    isPreset: boolean('isPreset').notNull().default(false),
    isPublic: boolean('isPublic').notNull().default(false),
    usageCount: integer('usageCount').notNull().default(0),

    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => ({
    userIdIdx: index('idx_workflow_user_id').on(table.userId),
    categoryIdx: index('idx_workflow_category').on(table.category),
    isPresetIdx: index('idx_workflow_is_preset').on(table.isPreset),
    externalIdIdx: index('idx_workflow_external_id').on(table.externalId),
  })
);

export const commands = pgTable(
  'Command',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    externalId: integer('externalId').unique(), // iFlow官方指令ID
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    detailContext: text('detailContext').notNull(), // 指令内容
    category: varchar('category', { length: 50 }).notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    modelName: varchar('modelName', { length: 50 }),
    version: integer('version').notNull().default(1),
    isPreset: boolean('isPreset').notNull().default(false),
    isPublic: boolean('isPublic').notNull().default(false),
    usageCount: integer('usageCount').notNull().default(0),

    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => ({
    userIdIdx: index('idx_command_user_id').on(table.userId),
    categoryIdx: index('idx_command_category').on(table.category),
    isPresetIdx: index('idx_command_is_preset').on(table.isPreset),
    externalIdIdx: index('idx_command_external_id').on(table.externalId),
  })
);

// Types
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type Command = typeof commands.$inferSelect;
export type NewCommand = typeof commands.$inferInsert;

import { sql } from 'drizzle-orm';
