/**
 * iFlow Client 配置和创建工厂
 *
 * 这个文件负责创建和配置 iFlow CLI SDK 客户端实例
 */

import { IFlowClient, IFlowOptions } from "@iflow-ai/iflow-cli-sdk";
import type {
  IFlowClientConfig,
  IFlowModel,
  IFlowPermissionMode,
} from "./types";
import { getWorkspaceDir } from "./workspace";

/**
 * 创建 iFlow 客户端
 *
 * @param config - 客户端配置
 * @returns iFlow 客户端实例
 */
export async function createIFlowClient(config: IFlowClientConfig): Promise<IFlowClient> {
  const { workspaceId, userId, modelName, permissionMode, contextPrompt } = config;

  // 获取工作区目录路径
  const workspaceDir = getWorkspaceDir(workspaceId);

  // iFlow SDK expects lowercase model names (e.g., "minimax-m2")
  const normalizedModelName = modelName.toLowerCase();

  // 从环境变量或配置中获取 API 配置
  const apiKey = process.env.IFLOW_API_KEY;
  const baseUrl = process.env.IFLOW_BASE_URL || "https://apis.iflow.cn/v1";

  // 构建 IFlowOptions
  const options: IFlowOptions = {
    // 工作区目录
    cwd: workspaceDir,

    // 认证信息 - 包含完整的 API 配置
    authMethodInfo: {
      apiKey: apiKey,
      baseUrl: baseUrl,
      modelName: normalizedModelName,
    },

    // 会话设置
    sessionSettings: {
      permission_mode: permissionMode,
      // 如果有历史上下文，添加到 system_prompt
      ...(contextPrompt && { append_system_prompt: contextPrompt }),
    },

    // 日志级别（开发环境启用调试）
    logLevel: process.env.NODE_ENV === "development" ? "DEBUG" : "INFO",
  };

  // 创建 iFlow Client 实例
  const client = new IFlowClient(options);

  // 连接到 iFlow（SDK文档要求）
  await client.connect();

  return client;
}

/**
 * 验证模型名称
 */
export function isValidModel(model: string): model is IFlowModel {
  const validModels: IFlowModel[] = [
    "MiniMax-M2",
    "Qwen3-Coder-Plus",
    "DeepSeek-V3.2",
    "GLM-4.6",
    "Kimi-K2-0905",
  ];
  return validModels.includes(model as IFlowModel);
}

/**
 * 验证权限模式
 */
export function isValidPermissionMode(
  mode: string
): mode is IFlowPermissionMode {
  const validModes: IFlowPermissionMode[] = [
    "default",
    "autoEdit",
    "yolo",
    "plan",
  ];
  return validModes.includes(mode as IFlowPermissionMode);
}

/**
 * 获取默认模型
 */
export function getDefaultModel(): IFlowModel {
  return (process.env.IFLOW_DEFAULT_MODEL as IFlowModel) || "MiniMax-M2";
}

/**
 * 获取默认权限模式
 */
export function getDefaultPermissionMode(): IFlowPermissionMode {
  return (
    (process.env.IFLOW_DEFAULT_PERMISSION_MODE as IFlowPermissionMode) || "yolo"
  );
}
