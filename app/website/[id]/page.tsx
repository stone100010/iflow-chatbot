"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";

export default function WebsitePage() {
  const params = useParams();
  const deploymentId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployment, setDeployment] = useState<{
    url: string;
    title?: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    const fetchDeployment = async () => {
      try {
        const response = await fetch(
          `/api/iflow/website-deployments/${deploymentId}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError("网站不存在或已被删除");
          } else if (response.status === 403) {
            setError("您没有访问权限");
          } else {
            setError("加载网站信息失败");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setDeployment(data);

        // 自动重定向到实际 URL
        window.location.href = data.url;
      } catch (err) {
        console.error("Failed to load deployment:", err);
        setError("加载网站信息失败");
        setLoading(false);
      }
    };

    if (deploymentId) {
      fetchDeployment();
    }
  }, [deploymentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center space-y-4">
          <Loader2Icon className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            正在跳转到网站...
          </h1>
          {deployment?.title && (
            <p className="text-zinc-600 dark:text-zinc-400">
              {deployment.title}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {error}
          </h1>
          <Button
            onClick={() => (window.location.href = "/")}
            className="mt-4"
          >
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  // 如果没有自动重定向，显示手动跳转按钮
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="text-6xl">🚀</div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {deployment?.title || "网站已就绪"}
        </h1>
        {deployment?.description && (
          <p className="text-zinc-600 dark:text-zinc-400">
            {deployment.description}
          </p>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          如果没有自动跳转，请点击下方按钮
        </p>
        {deployment && (
          <Button
            onClick={() => (window.location.href = deployment.url)}
            className="mt-4"
            size="lg"
          >
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            访问网站
          </Button>
        )}
      </div>
    </div>
  );
}
