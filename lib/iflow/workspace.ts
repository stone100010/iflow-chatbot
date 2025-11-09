/**
 * 工作区管理模块
 *
 * 负责工作区的创建、验证、清理和下载功能
 */

import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import archiver from "archiver";
import { Readable } from "node:stream";

/**
 * 工作区根目录
 */
const WORKSPACE_ROOT =
  process.env.IFLOW_WORKSPACE_DIR || "/var/workspaces";

/**
 * 获取工作区目录路径
 *
 * @param workspaceId - 工作区 ID
 * @returns 工作区完整路径
 */
export function getWorkspaceDir(workspaceId: string): string {
  return path.join(WORKSPACE_ROOT, `iflow_cli_${workspaceId}`);
}

/**
 * 验证工作区路径安全性（防止路径遍历攻击）
 *
 * @param workspaceId - 工作区 ID
 * @throws {Error} 如果路径不安全
 */
export function validateWorkspacePath(workspaceId: string): void {
  // 检查是否包含路径遍历字符
  if (workspaceId.includes("..") || workspaceId.includes("/") || workspaceId.includes("\\")) {
    throw new Error("Invalid workspace ID: path traversal detected");
  }

  // 检查工作区 ID 格式（UUID）
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(workspaceId)) {
    throw new Error("Invalid workspace ID: must be a valid UUID");
  }

  // 验证最终路径是否在允许的根目录下
  const workspaceDir = getWorkspaceDir(workspaceId);
  const normalizedPath = path.normalize(workspaceDir);
  const normalizedRoot = path.normalize(WORKSPACE_ROOT);

  if (!normalizedPath.startsWith(normalizedRoot)) {
    throw new Error("Invalid workspace path: outside of workspace root");
  }
}

/**
 * 确保工作区存在并且有正确的权限
 *
 * @param workspaceId - 工作区 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns 工作区路径
 */
export async function ensureWorkspace(
  workspaceId: string,
  userId: string
): Promise<string> {
  // 验证路径安全性
  validateWorkspacePath(workspaceId);

  const workspaceDir = getWorkspaceDir(workspaceId);

  // 确保根目录存在
  if (!existsSync(WORKSPACE_ROOT)) {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true, mode: 0o755 });
  }

  // 创建工作区目录（如果不存在）
  if (!existsSync(workspaceDir)) {
    await fs.mkdir(workspaceDir, { recursive: true, mode: 0o700 });

    // 创建 .workspace-info 文件记录所有者
    const workspaceInfo = {
      workspaceId,
      userId,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(
      path.join(workspaceDir, ".workspace-info"),
      JSON.stringify(workspaceInfo, null, 2),
      { mode: 0o600 }
    );
  } else {
    // 验证工作区所有权
    const infoPath = path.join(workspaceDir, ".workspace-info");
    if (existsSync(infoPath)) {
      const info = JSON.parse(await fs.readFile(infoPath, "utf-8"));
      if (info.userId !== userId) {
        throw new Error("Access denied: workspace belongs to another user");
      }
    }
  }

  return workspaceDir;
}

/**
 * 获取工作区大小（字节）
 *
 * @param workspaceId - 工作区 ID
 * @returns 工作区总大小
 */
export async function getWorkspaceSize(workspaceId: string): Promise<number> {
  validateWorkspacePath(workspaceId);

  const workspaceDir = getWorkspaceDir(workspaceId);

  if (!existsSync(workspaceDir)) {
    return 0;
  }

  let totalSize = 0;

  async function calculateSize(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await calculateSize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  }

  await calculateSize(workspaceDir);
  return totalSize;
}

/**
 * 清理工作区（删除所有文件）
 *
 * @param workspaceId - 工作区 ID
 * @param userId - 用户 ID（用于权限验证）
 */
export async function cleanWorkspace(
  workspaceId: string,
  userId: string
): Promise<void> {
  validateWorkspacePath(workspaceId);

  const workspaceDir = getWorkspaceDir(workspaceId);

  // 验证工作区所有权
  const infoPath = path.join(workspaceDir, ".workspace-info");
  if (existsSync(infoPath)) {
    const info = JSON.parse(await fs.readFile(infoPath, "utf-8"));
    if (info.userId !== userId) {
      throw new Error("Access denied: workspace belongs to another user");
    }
  }

  // 删除工作区目录
  if (existsSync(workspaceDir)) {
    await fs.rm(workspaceDir, { recursive: true, force: true });
  }
}

/**
 * 打包工作区为 ZIP 文件
 *
 * @param workspaceId - 工作区 ID
 * @param userId - 用户 ID（用于权限验证）
 * @returns ZIP 文件的 Buffer
 */
export async function zipWorkspace(
  workspaceId: string,
  userId: string
): Promise<Buffer> {
  validateWorkspacePath(workspaceId);

  const workspaceDir = getWorkspaceDir(workspaceId);

  // 验证工作区存在
  if (!existsSync(workspaceDir)) {
    throw new Error("Workspace not found");
  }

  // 验证工作区所有权
  const infoPath = path.join(workspaceDir, ".workspace-info");
  if (existsSync(infoPath)) {
    const info = JSON.parse(await fs.readFile(infoPath, "utf-8"));
    if (info.userId !== userId) {
      throw new Error("Access denied: workspace belongs to another user");
    }
  }

  // 创建 ZIP 压缩流
  const archive = archiver("zip", {
    zlib: { level: 9 }, // 最大压缩级别
  });

  const chunks: Buffer[] = [];

  // 将 ZIP 数据收集到 Buffer
  archive.on("data", (chunk) => chunks.push(chunk));

  // 返回 Promise
  return new Promise((resolve, reject) => {
    archive.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on("error", (err) => {
      reject(err);
    });

    // 添加工作区目录到 ZIP
    archive.directory(workspaceDir, false);

    // 完成压缩
    archive.finalize();
  });
}

/**
 * 列出工作区文件
 *
 * @param workspaceId - 工作区 ID
 * @param userId - 用户 ID（用于权限验证）
 * @param relativePath - 相对路径（可选，默认为根目录）
 * @returns 文件列表
 */
export async function listWorkspaceFiles(
  workspaceId: string,
  userId: string,
  relativePath = ""
): Promise<
  Array<{
    name: string;
    path: string;
    size: number;
    type: "file" | "directory";
    modifiedAt: Date;
  }>
> {
  validateWorkspacePath(workspaceId);

  const workspaceDir = getWorkspaceDir(workspaceId);

  // 验证工作区所有权
  const infoPath = path.join(workspaceDir, ".workspace-info");
  if (existsSync(infoPath)) {
    const info = JSON.parse(await fs.readFile(infoPath, "utf-8"));
    if (info.userId !== userId) {
      throw new Error("Access denied: workspace belongs to another user");
    }
  }

  // 构建完整路径
  const fullPath = path.join(workspaceDir, relativePath);

  // 验证路径仍在工作区内
  const normalizedPath = path.normalize(fullPath);
  const normalizedWorkspace = path.normalize(workspaceDir);
  if (!normalizedPath.startsWith(normalizedWorkspace)) {
    throw new Error("Invalid path: outside of workspace");
  }

  // 读取目录内容
  const entries = await fs.readdir(fullPath, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith(".")) // 隐藏文件
      .map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryPath);

        return {
          name: entry.name,
          path: path.join(relativePath, entry.name),
          size: entry.isFile() ? stats.size : 0,
          type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
          modifiedAt: stats.mtime,
        };
      })
  );

  return files;
}
