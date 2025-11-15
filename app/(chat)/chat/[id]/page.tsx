import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { IFlowChat } from "@/components/iflow-chat";
import { getWorkspaceById } from "@/lib/db/queries";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const { id: workspaceId } = await params;

  // 获取工作区信息并验证所有权
  const workspace = await getWorkspaceById(workspaceId);

  if (!workspace) {
    redirect("/"); // 工作区不存在，返回首页
  }

  if (workspace.userId !== userId) {
    redirect("/"); // 不是用户的工作区，返回首页
  }

  return (
    <IFlowChat
      workspaceId={workspace.id}
      initialModelName={workspace.modelName as any}
      initialPermissionMode={workspace.permissionMode as any}
      loadHistory={true}
    />
  );
}
