import { redirect } from "next/navigation";
import { auth } from "../(auth)/auth";
import { IFlowChat } from "@/components/iflow-chat";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 主页面始终是新对话，生成临时 workspaceId
  // 当用户发送第一条消息时，会在数据库中创建工作区
  const workspaceId = generateUUID();

  return (
    <IFlowChat
      workspaceId={workspaceId}
      initialModelName="MiniMax-M2"
      initialPermissionMode="yolo"
      loadHistory={false}
    />
  );
}
