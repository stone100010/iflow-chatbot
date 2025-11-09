"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useState, useEffect, memo } from "react";
import { ThinkBlock } from "./think-block";
import { PerformanceMonitor } from "@/lib/performance-monitor";

interface MessageContentProps {
  content: string;
}

// 使用 React.memo 优化性能,只在 content 变化时重新渲染
export const MessageContent = memo(function MessageContent({ content }: MessageContentProps) {
  useEffect(() => {
    const label = `MessageContent-Render-${content.substring(0, 20)}`;
    PerformanceMonitor.start(label);
    return () => {
      PerformanceMonitor.end(label);
    };
  }, [content]);

  // 提取 <think> 标签内容
  const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
  const thinkMatches = Array.from(content.matchAll(thinkRegex));

  // 移除 <think> 标签后的内容
  const mainContent = content.replace(thinkRegex, "").trim();

  return (
    <div className="space-y-3">
      {/* 渲染思考过程 */}
      {thinkMatches.map((match, index) => (
        <ThinkBlock key={index} content={match[1].trim()} />
      ))}

      {/* 渲染主要内容 */}
      {mainContent && (
        <div className="prose dark:prose-invert max-w-none text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                if (!inline && language) {
                  return (
                    <CodeBlock
                      language={language}
                      code={String(children).replace(/\n$/, "")}
                    />
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {mainContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
});

interface CodeBlockProps {
  language: string;
  code: string;
}

// CodeBlock 也使用 memo 优化
const CodeBlock = memo(function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 dark:bg-zinc-950 rounded-t-lg border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors rounded"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5" />
              已复制
            </>
          ) : (
            <>
              <CopyIcon className="w-3.5 h-3.5" />
              复制代码
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "0.5rem",
          borderBottomRightRadius: "0.5rem",
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
});
