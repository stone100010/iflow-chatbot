"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useState, useEffect } from "react";
import { PlusIcon } from "@/components/icons";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import { PerformanceMonitor } from "@/lib/performance-monitor";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MessageSquareIcon, ClockIcon, Trash2Icon, MoreVerticalIcon, PinIcon, Edit2Icon, BotIcon, WorkflowIcon, TerminalIcon } from "lucide-react";

// 工作区历史类型
interface WorkspaceHistory {
  id: string;
  name: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

// 截断文本为指定长度(汉字为准)
const truncateText = (text: string, maxLength: number = 8): string => {
  if (!text) return "";

  let count = 0;
  let result = "";

  for (const char of text) {
    // 判断是否为汉字或全角字符(占2个长度)
    const isFullWidth = /[\u4e00-\u9fa5\uff00-\uffef]/.test(char);
    count += isFullWidth ? 1 : 0.5;

    if (count > maxLength) {
      return result + "...";
    }

    result += char;
  }

  return result;
};

export function AppSidebarTemp({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [workspaces, setWorkspaces] = useState<WorkspaceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogWorkspaceId, setDeleteDialogWorkspaceId] = useState<string | null>(null);

  // 加载工作区历史
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadWorkspaces();
  }, [user]);

  const loadWorkspaces = async () => {
    PerformanceMonitor.start("Sidebar-LoadWorkspaces");

    try {
      console.log("📂 [Sidebar] Loading workspaces list");

      const fetchStart = performance.now();
      const response = await fetch("/api/iflow/workspaces");
      const fetchDuration = performance.now() - fetchStart;
      PerformanceMonitor.logNetworkRequest("/api/iflow/workspaces", fetchDuration);

      if (response.ok) {
        const data = await response.json();
        setWorkspaces(
          data.workspaces.map((ws: any) => ({
            id: ws.id,
            name: ws.name,
            createdAt: new Date(ws.createdAt),
            lastAccessedAt: new Date(ws.lastAccessedAt),
          }))
        );
        console.log(`[Sidebar] Loaded ${data.workspaces.length} workspaces`);
      }
    } catch (error) {
      console.error("[Sidebar] Failed to load workspaces:", error);
    } finally {
      setIsLoading(false);
      PerformanceMonitor.end("Sidebar-LoadWorkspaces");
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/iflow/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 从列表中移除
        setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
        // 如果删除的是当前页面，返回首页
        router.push("/");
      } else {
        console.error("[Sidebar] Failed to delete workspace");
      }
    } catch (error) {
      console.error("[Sidebar] Error deleting workspace:", error);
    } finally {
      setDeleteDialogWorkspaceId(null);
    }
  };

  const handleNewChat = () => {
    setOpenMobile(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-col gap-3">
              {/* Logo and New Chat */}
              <div className="flex flex-row items-center justify-between">
                <Link
                  className="flex flex-row items-center gap-3"
                  href="/"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <MessageSquareIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span className="cursor-pointer font-semibold text-lg text-zinc-900 dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                      iFlow Chat
                    </span>
                  </div>
                </Link>
                <div className="flex flex-row gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="h-8 p-1 md:h-fit md:p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={handleNewChat}
                        type="button"
                        variant="ghost"
                      >
                        <PlusIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent align="end" className="hidden md:block">
                      New Chat
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* 智能体拓展 */}
              <div className="flex flex-col gap-1">
                <div className="px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  智能体拓展
                </div>
                <Link
                  href="/workflows"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <WorkflowIcon className="w-4 h-4" />
                    <span>工作流</span>
                  </Button>
                </Link>
                <Link
                  href="/agents"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <BotIcon className="w-4 h-4" />
                    <span>智能体</span>
                  </Button>
                </Link>
                <Link
                  href="/commands"
                  onClick={() => {
                    setOpenMobile(false);
                  }}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <TerminalIcon className="w-4 h-4" />
                    <span>指令</span>
                  </Button>
                </Link>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* 聊天历史列表 */}
          <div className="flex flex-col gap-2 p-2">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Loading...
                </p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <MessageSquareIcon className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  No chat history
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                  Your chat history will appear here after starting a new conversation
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1">
                  Recent Chats
                </div>
                {workspaces.map((workspace) => {
                  return (
                    <div
                      key={workspace.id}
                      className="group relative flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {/* 左侧主要内容区域 */}
                      <Link
                        href={`/chat/${workspace.id}`}
                        onClick={() => {
                          setOpenMobile(false);
                        }}
                        className="flex-1 flex flex-col gap-1 min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquareIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors flex-shrink-0" />
                          <span
                            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                            title={workspace.name}
                          >
                            {truncateText(workspace.name, 8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 ml-6">
                          <ClockIcon className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {new Date(workspace.lastAccessedAt).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </Link>

                      {/* 右侧更多按钮 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVerticalIcon className="w-4 h-4 text-zinc-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: 实现置顶功能
                              console.log("Pin workspace:", workspace.id);
                            }}
                          >
                            <PinIcon className="w-4 h-4 mr-2" />
                            <span>Pin</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: 实现重命名功能
                              console.log("Rename workspace:", workspace.id);
                            }}
                          >
                            <Edit2Icon className="w-4 h-4 mr-2" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialogWorkspaceId(workspace.id);
                            }}
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                          >
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SidebarContent>

        {user && (
          <SidebarFooter>
            <SidebarUserNav user={user} />
          </SidebarFooter>
        )}
      </Sidebar>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={deleteDialogWorkspaceId !== null}
        onOpenChange={(open) => !open && setDeleteDialogWorkspaceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All chat history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogWorkspaceId) {
                  handleDeleteWorkspace(deleteDialogWorkspaceId);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
