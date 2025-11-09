import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  message,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  vote,
  type Workspace,
  workspace,
  type IFlowMessage,
  iflowMessage,
  type WebsiteDeployment,
  websiteDeployment,
} from "./schema";
import { generateHashedPassword } from "./utils";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map(c => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await db
      .update(chat)
      .set({ lastContext: context })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

// ============================================================================
// iFlow 相关查询
// ============================================================================

/**
 * 创建工作区
 */
export async function createWorkspace({
  id,
  userId,
  name,
  path,
  modelName = "MiniMax-M2",
  permissionMode = "yolo",
}: {
  id?: string;
  userId: string;
  name: string;
  path: string;
  modelName?: string;
  permissionMode?: string;
}) {
  try {
    const [newWorkspace] = await db
      .insert(workspace)
      .values({
        ...(id && { id }),
        userId,
        name,
        path,
        modelName,
        permissionMode,
        size: "0",
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newWorkspace;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create workspace"
    );
  }
}

/**
 * 获取用户的所有工作区
 */
export async function getWorkspacesByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(workspace)
      .where(eq(workspace.userId, userId))
      .orderBy(desc(workspace.lastAccessedAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get workspaces by user id"
    );
  }
}

/**
 * 根据 ID 获取工作区
 */
export async function getWorkspaceById(workspaceId: string) {
  try {
    const [selectedWorkspace] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId));

    return selectedWorkspace;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get workspace by id"
    );
  }
}

/**
 * 更新工作区最后访问时间
 */
export async function updateWorkspaceLastAccessed(workspaceId: string) {
  try {
    return await db
      .update(workspace)
      .set({ lastAccessedAt: new Date() })
      .where(eq(workspace.id, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update workspace last accessed"
    );
  }
}

/**
 * 更新工作区大小
 */
export async function updateWorkspaceSize(workspaceId: string, size: string) {
  try {
    return await db
      .update(workspace)
      .set({ size, updatedAt: new Date() })
      .where(eq(workspace.id, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update workspace size"
    );
  }
}

/**
 * 更新工作区信息（名称、自定义状态等）
 */
export async function updateWorkspace(
  workspaceId: string,
  data: {
    name?: string;
    isNameCustomized?: boolean;
    modelName?: string;
    permissionMode?: string;
  }
) {
  try {
    const [updatedWorkspace] = await db
      .update(workspace)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspace.id, workspaceId))
      .returning();

    return updatedWorkspace;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update workspace"
    );
  }
}

/**
 * 删除工作区（及其所有消息）
 */
export async function deleteWorkspace(workspaceId: string) {
  try {
    // 由于设置了 onDelete: "cascade"，删除工作区会自动删除所有相关消息
    return await db.delete(workspace).where(eq(workspace.id, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete workspace"
    );
  }
}

/**
 * 更新工作区配置
 */
export async function updateWorkspaceConfig({
  workspaceId,
  modelName,
  permissionMode,
}: {
  workspaceId: string;
  modelName?: string;
  permissionMode?: string;
}) {
  try {
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (modelName) updates.modelName = modelName;
    if (permissionMode) updates.permissionMode = permissionMode;

    return await db
      .update(workspace)
      .set(updates)
      .where(eq(workspace.id, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update workspace config"
    );
  }
}

/**
 * 删除工作区
 */
export async function deleteWorkspaceById(workspaceId: string) {
  try {
    return await db.delete(workspace).where(eq(workspace.id, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete workspace"
    );
  }
}

/**
 * 保存 iFlow 消息
 */
export async function saveIFlowMessage({
  workspaceId,
  role,
  content,
  agentInfo,
  toolCalls,
  plan,
  stopReason,
}: {
  workspaceId: string;
  role: "user" | "assistant";
  content: string;
  agentInfo?: any;
  toolCalls?: any[];
  plan?: any[];
  stopReason?: string;
}) {
  try {
    const [newMessage] = await db
      .insert(iflowMessage)
      .values({
        workspaceId,
        role,
        content,
        agentInfo,
        toolCalls,
        plan,
        stopReason,
        createdAt: new Date(),
      })
      .returning();

    return newMessage;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save iflow message"
    );
  }
}

/**
 * 批量保存 iFlow 消息
 */
export async function saveIFlowMessages(
  messages: Array<{
    workspaceId: string;
    role: "user" | "assistant";
    content: string;
    agentInfo?: any;
    toolCalls?: any[];
    plan?: any[];
    stopReason?: string;
  }>
) {
  try {
    return await db
      .insert(iflowMessage)
      .values(
        messages.map((msg) => ({
          ...msg,
          createdAt: new Date(),
        }))
      )
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save iflow messages"
    );
  }
}

/**
 * 获取工作区的消息历史
 */
export async function getIFlowMessagesByWorkspaceId(workspaceId: string) {
  try {
    return await db
      .select()
      .from(iflowMessage)
      .where(eq(iflowMessage.workspaceId, workspaceId))
      .orderBy(asc(iflowMessage.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get iflow messages by workspace id"
    );
  }
}

/**
 * 获取用户今日的消息数量
 */
export async function getIFlowMessageCountToday(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取用户的所有工作区
    const userWorkspaces = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.userId, userId));

    const workspaceIds = userWorkspaces.map((w) => w.id);

    if (workspaceIds.length === 0) {
      return 0;
    }

    // 统计今日用户消息数量
    const [result] = await db
      .select({ count: count(iflowMessage.id) })
      .from(iflowMessage)
      .where(
        and(
          inArray(iflowMessage.workspaceId, workspaceIds),
          gte(iflowMessage.createdAt, today),
          eq(iflowMessage.role, "user")
        )
      )
      .execute();

    return result?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get iflow message count today"
    );
  }
}

/**
 * 删除工作区的所有消息
 */
export async function deleteIFlowMessagesByWorkspaceId(workspaceId: string) {
  try {
    return await db
      .delete(iflowMessage)
      .where(eq(iflowMessage.workspaceId, workspaceId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete iflow messages by workspace id"
    );
  }
}

// ============================================================================
// 网站部署相关查询
// ============================================================================

/**
 * 创建网站部署记录
 */
export async function createWebsiteDeployment({
  workspaceId,
  userId,
  port,
  url,
  title,
  description,
}: {
  workspaceId: string;
  userId: string;
  port: string;
  url: string;
  title?: string;
  description?: string;
}) {
  try {
    const [deployment] = await db
      .insert(websiteDeployment)
      .values({
        workspaceId,
        userId,
        port,
        url,
        title,
        description,
        status: "running",
      })
      .returning();
    return deployment;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create website deployment"
    );
  }
}

/**
 * 根据 ID 获取网站部署记录
 */
export async function getWebsiteDeploymentById(id: string) {
  try {
    const [deployment] = await db
      .select()
      .from(websiteDeployment)
      .where(eq(websiteDeployment.id, id));
    return deployment;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get website deployment by id"
    );
  }
}

/**
 * 根据工作区 ID 获取所有网站部署记录
 */
export async function getWebsiteDeploymentsByWorkspaceId(workspaceId: string) {
  try {
    return await db
      .select()
      .from(websiteDeployment)
      .where(eq(websiteDeployment.workspaceId, workspaceId))
      .orderBy(desc(websiteDeployment.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get website deployments by workspace id"
    );
  }
}

/**
 * 根据用户 ID 获取所有网站部署记录
 */
export async function getWebsiteDeploymentsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(websiteDeployment)
      .where(eq(websiteDeployment.userId, userId))
      .orderBy(desc(websiteDeployment.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get website deployments by user id"
    );
  }
}

/**
 * 更新网站部署状态
 */
export async function updateWebsiteDeploymentStatus(
  id: string,
  status: "running" | "stopped"
) {
  try {
    const [deployment] = await db
      .update(websiteDeployment)
      .set({ status, updatedAt: new Date() })
      .where(eq(websiteDeployment.id, id))
      .returning();
    return deployment;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update website deployment status"
    );
  }
}

/**
 * 删除网站部署记录
 */
export async function deleteWebsiteDeployment(id: string) {
  try {
    return await db
      .delete(websiteDeployment)
      .where(eq(websiteDeployment.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete website deployment"
    );
  }
}
