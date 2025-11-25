import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from '../schema';
import { workspace } from '../schema';

// 分享主表
export const shares = pgTable('Share', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shortId: varchar('shortId', { length: 12 }).notNull().unique(),
  workspaceId: uuid('workspaceId')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),

  privacy: varchar('privacy', { length: 20 }).notNull().default('private'), // private | public
  messageCount: integer('messageCount').notNull().default(0),

  viewCount: integer('viewCount').notNull().default(0),
  likeCount: integer('likeCount').notNull().default(0),
  commentCount: integer('commentCount').notNull().default(0),

  isActive: boolean('isActive').notNull().default(true),
  snapshotAt: timestamp('snapshotAt', { withTimezone: true }).notNull(),

  ogTitle: varchar('ogTitle', { length: 200 }),
  ogDescription: text('ogDescription'),
  ogImage: text('ogImage'),

  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  shortIdIdx: index('idx_share_short_id').on(table.shortId),
  userIdIdx: index('idx_share_user_id').on(table.userId),
  workspaceIdIdx: index('idx_share_workspace_id').on(table.workspaceId),
  createdAtIdx: index('idx_share_created_at').on(table.createdAt),
  viewCountIdx: index('idx_share_view_count').on(table.viewCount),
  privacyIdx: index('idx_share_privacy').on(table.privacy),
  isActiveIdx: index('idx_share_is_active').on(table.isActive),
}));

// 快照消息表(核心设计)
export const shareSnapshots = pgTable('ShareSnapshot', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shareId: text('shareId')
    .notNull()
    .references(() => shares.id, { onDelete: 'cascade' }),

  messageId: text('messageId').notNull(), // 原始消息 ID(不建外键,确保独立性)
  role: varchar('role', { length: 20 }).notNull(), // user | assistant | system
  content: text('content').notNull(),

  sequenceNumber: integer('sequenceNumber').notNull(),
  metadata: jsonb('metadata').notNull().default({}),

  messageCreatedAt: timestamp('messageCreatedAt', { withTimezone: true }).notNull(),
  snapshotAt: timestamp('snapshotAt', { withTimezone: true }).notNull(),
}, (table) => ({
  shareIdIdx: index('idx_share_snapshot_share_id').on(table.shareId),
  sequenceIdx: index('idx_share_snapshot_sequence').on(table.shareId, table.sequenceNumber),
  uniqueSequenceIdx: uniqueIndex('idx_share_snapshot_unique_sequence').on(table.shareId, table.sequenceNumber),
}));

// 访问记录表
export const shareViews = pgTable('ShareView', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shareId: text('shareId')
    .notNull()
    .references(() => shares.id, { onDelete: 'cascade' }),

  visitorId: text('visitorId'),
  userId: uuid('userId').references(() => user.id, { onDelete: 'set null' }),

  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: text('userAgent'),
  referer: text('referer'),
  country: varchar('country', { length: 2 }),
  city: varchar('city', { length: 100 }),

  viewedAt: timestamp('viewedAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  shareIdIdx: index('idx_share_view_share_id').on(table.shareId),
  viewedAtIdx: index('idx_share_view_viewed_at').on(table.viewedAt),
  visitorIdIdx: index('idx_share_view_visitor_id').on(table.visitorId),
}));

// 点赞记录表
export const shareLikes = pgTable('ShareLike', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shareId: text('shareId')
    .notNull()
    .references(() => shares.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  shareIdIdx: index('idx_share_like_share_id').on(table.shareId),
  userIdIdx: index('idx_share_like_user_id').on(table.userId),
  uniqueIdx: uniqueIndex('idx_share_like_unique').on(table.shareId, table.userId),
}));

// Relations
export const shareRelations = relations(shares, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [shares.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, {
    fields: [shares.userId],
    references: [user.id],
  }),
  snapshots: many(shareSnapshots),
  views: many(shareViews),
  likes: many(shareLikes),
}));

export const shareSnapshotRelations = relations(shareSnapshots, ({ one }) => ({
  share: one(shares, {
    fields: [shareSnapshots.shareId],
    references: [shares.id],
  }),
}));

export const shareViewRelations = relations(shareViews, ({ one }) => ({
  share: one(shares, {
    fields: [shareViews.shareId],
    references: [shares.id],
  }),
  user: one(user, {
    fields: [shareViews.userId],
    references: [user.id],
  }),
}));

export const shareLikeRelations = relations(shareLikes, ({ one }) => ({
  share: one(shares, {
    fields: [shareLikes.shareId],
    references: [shares.id],
  }),
  user: one(user, {
    fields: [shareLikes.userId],
    references: [user.id],
  }),
}));

// Types
export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
export type ShareSnapshot = typeof shareSnapshots.$inferSelect;
export type NewShareSnapshot = typeof shareSnapshots.$inferInsert;
export type ShareView = typeof shareViews.$inferSelect;
export type NewShareView = typeof shareViews.$inferInsert;
export type ShareLike = typeof shareLikes.$inferSelect;
export type NewShareLike = typeof shareLikes.$inferInsert;
