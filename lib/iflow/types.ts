/**
 * iFlow CLI SDK 类型定义
 *
 * 这个文件定义了 iFlow SDK 相关的所有 TypeScript 类型
 */

// ============================================================================
// iFlow SDK 消息类型
// ============================================================================

/**
 * iFlow SDK 消息的基础类型
 */
export type IFlowSDKMessageType =
  | "text-delta"
  | "tool-call"
  | "plan"
  | "finish"
  | "error";

/**
 * Agent 信息
 */
export interface AgentInfo {
  type: string;
  name?: string;
  description?: string;
}

/**
 * 工具调用状态
 */
export type ToolCallStatus = "pending" | "executing" | "completed" | "failed";

/**
 * 工具调用信息
 */
export interface ToolCall {
  id: string;
  toolName: string;
  status: ToolCallStatus;
  label?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

/**
 * 任务计划条目状态
 */
export type PlanEntryStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * 任务计划条目优先级
 */
export type PlanPriority = "low" | "medium" | "high";

/**
 * 任务计划条目
 */
export interface PlanEntry {
  id: string;
  content: string;
  activeForm: string;
  status: PlanEntryStatus;
  priority?: PlanPriority;
}

/**
 * 停止原因
 */
export type StopReason = "end_turn" | "stop" | "error" | "interrupted";

/**
 * 文本增量消息
 */
export interface TextDeltaMessage {
  type: "text-delta";
  text: string;
  agentInfo?: AgentInfo;
}

/**
 * 工具调用消息
 */
export interface ToolCallMessage {
  type: "tool-call";
  toolName: string;
  status: ToolCallStatus;
  label?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

/**
 * 任务计划消息
 */
export interface PlanMessage {
  type: "plan";
  entries: PlanEntry[];
}

/**
 * 完成消息
 */
export interface FinishMessage {
  type: "finish";
  stopReason: StopReason;
}

/**
 * 错误消息
 */
export interface ErrorMessage {
  type: "error";
  error: string;
  code?: string;
}

/**
 * iFlow SDK 消息联合类型
 */
export type IFlowSDKMessage =
  | TextDeltaMessage
  | ToolCallMessage
  | PlanMessage
  | FinishMessage
  | ErrorMessage;

// ============================================================================
// 前端消息类型
// ============================================================================

/**
 * 前端消息角色
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * 前端聊天消息
 */
export interface IFlowChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  agentInfo?: AgentInfo;
  toolCalls?: ToolCall[];
  plan?: PlanEntry[];
  stopReason?: StopReason;
  createdAt: Date;
}

// ============================================================================
// iFlow 配置类型
// ============================================================================

/**
 * iFlow 支持的模型
 */
export type IFlowModel =
  | "MiniMax-M2"
  | "Qwen3-Coder-Plus"
  | "DeepSeek-V3.2"
  | "GLM-4.6"
  | "Kimi-K2-0905";

/**
 * iFlow 权限模式
 */
export type IFlowPermissionMode =
  | "default"    // 默认模式，每次操作需要确认
  | "autoEdit"   // 自动编辑模式，自动执行编辑操作
  | "yolo"       // YOLO 模式，自动执行所有操作
  | "plan";      // 计划模式，先制定计划再执行

/**
 * iFlow Client 配置
 */
export interface IFlowClientConfig {
  workspaceId: string;
  userId: string;
  modelName: IFlowModel;
  permissionMode: IFlowPermissionMode;
  contextPrompt?: string; // 可选的上下文提示（用于加载历史会话）
}

/**
 * iFlow 会话信息
 */
export interface IFlowSession {
  id: string;
  userId: string;
  workspaceId: string;
  client: any; // IFlowClient 类型（避免循环依赖）
  modelName: IFlowModel;
  permissionMode: IFlowPermissionMode;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
}

// ============================================================================
// 工作区类型
// ============================================================================

/**
 * 工作区信息
 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  modelName: IFlowModel;
  permissionMode: IFlowPermissionMode;
  createdAt: Date;
  lastAccessedAt: Date;
  updatedAt: Date;
}

/**
 * 工作区文件信息
 */
export interface WorkspaceFile {
  name: string;
  path: string;
  size: number;
  type: "file" | "directory";
  modifiedAt: Date;
}

// ============================================================================
// API 请求/响应类型
// ============================================================================

/**
 * 聊天请求
 */
export interface ChatRequest {
  workspaceId: string;
  message: string;
  modelName: IFlowModel;
  permissionMode: IFlowPermissionMode;
}

/**
 * SSE 流式响应数据
 */
export type SSEData = IFlowSDKMessage;

/**
 * API 错误响应
 */
export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// 用户类型扩展
// ============================================================================

/**
 * 用户类型
 */
export type UserType = "guest" | "regular" | "premium";

/**
 * 用户限制配置
 */
export interface UserLimits {
  messagesPerDay: number;
  concurrentRequests: number;
  workspaceLimit: number;
  maxFileSize: number; // bytes
  maxWorkspaceSize: number; // bytes
}

// ============================================================================
// 常量导出
// ============================================================================

/**
 * 支持的模型列表
 */
export const IFLOW_MODELS: IFlowModel[] = [
  "MiniMax-M2",
  "Qwen3-Coder-Plus",
  "DeepSeek-V3.2",
  "GLM-4.6",
  "Kimi-K2-0905",
];

/**
 * 支持的权限模式列表
 */
export const IFLOW_PERMISSION_MODES: IFlowPermissionMode[] = [
  "default",
  "autoEdit",
  "yolo",
  "plan",
];

/**
 * 模型显示名称映射
 */
export const IFLOW_MODEL_NAMES: Record<IFlowModel, string> = {
  "MiniMax-M2": "MiniMax M2",
  "Qwen3-Coder-Plus": "Qwen 3 Coder Plus",
  "DeepSeek-V3.2": "DeepSeek V3.2",
  "GLM-4.6": "GLM 4.6",
  "Kimi-K2-0905": "Kimi K2",
};

/**
 * 权限模式显示名称映射
 */
export const IFLOW_PERMISSION_MODE_NAMES: Record<IFlowPermissionMode, string> = {
  default: "默认模式",
  autoEdit: "自动编辑",
  yolo: "YOLO 模式",
  plan: "计划模式",
};

/**
 * 权限模式描述
 */
export const IFLOW_PERMISSION_MODE_DESCRIPTIONS: Record<IFlowPermissionMode, string> = {
  default: "每次操作需要确认",
  autoEdit: "自动执行编辑操作",
  yolo: "自动执行所有操作",
  plan: "先制定计划再执行",
};

/**
 * 用户限制配置
 */
export const USER_LIMITS: Record<UserType, UserLimits> = {
  guest: {
    messagesPerDay: 20,
    concurrentRequests: 1,
    workspaceLimit: 1,
    maxFileSize: 1 * 1024 * 1024, // 1MB
    maxWorkspaceSize: 10 * 1024 * 1024, // 10MB
  },
  regular: {
    messagesPerDay: 100,
    concurrentRequests: 3,
    workspaceLimit: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxWorkspaceSize: 100 * 1024 * 1024, // 100MB
  },
  premium: {
    messagesPerDay: 1000,
    concurrentRequests: 10,
    workspaceLimit: 100,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxWorkspaceSize: 1024 * 1024 * 1024, // 1GB
  },
};
