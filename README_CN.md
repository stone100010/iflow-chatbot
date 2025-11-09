  <a href="https://github.com/stone100010/iflow-chatbot">
  <h1 align="center">iFlow Chatbot</h1>
</a>

<p align="center">
    基于 Next.js 15 和 iFlow CLI SDK 构建的全功能 Agent 聊天机器人，提供类似 Web端 iflow 的交互体验。
</p>

---

## 🙏 致敬

感谢 [iFlow](https://platform.iflow.cn/) 团队开发的伟大作品以及所有工作人员的辛勤付出！🎉🎉🎉

---

## 🎯 项目概述

iFlow Chatbot 是一个生产级 Agent 聊天应用，集成了 **iFlow CLI SDK**，提供强大功能：

- 🤖 多模型 AI 支持 (MiniMax-M2, Qwen3, DeepSeek, GLM, Kimi)
- 💬 智能对话与上下文记忆
- 🔧 工具调用可视化和任务规划
- 📱 响应式设计 (桌面 + 移动端)
- 🎨 深色模式与系统主题检测
- 🔐 安全的用户认证系统
- 💾 持久化聊天记录和工作区管理
- ⚡ 高性能 React 渲染优化

---

## 📋 主要功能

### 💬 智能对话
- 支持多轮对话和上下文理解
- 实时流式消息传输
- Markdown 渲染与代码高亮
- 工具调用状态可视化
- 任务计划进度跟踪

### 🛠️ 工具集成
- 文件操作和代码生成
- 可视化的工具调用过程
- 任务执行计划展示
- 代码编辑器和文件预览

### 📱 用户体验
- 完全响应式设计
- 桌面端：侧边栏 + 主聊天区
- 移动端：抽屉式侧边栏 + 全屏聊天
- 深色模式支持
- 触摸优化界面

### 🔧 配置系统

**支持的模型:**
- MiniMax-M2
- Qwen3-Coder-Plus  
- DeepSeek-V3.2
- GLM-4.6
- Kimi-K2-0905

**权限模式:**
- `default`: 每次操作都确认
- `autoEdit`: 自动执行编辑操作
- `yolo`: 自动执行所有操作
- `plan`: 执行前先制定计划

---

## 🏗️ 技术架构

### 前端技术
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: React Hooks + Context
- **动画**: Framer Motion
- **代码高亮**: react-syntax-highlighter

### 后端技术
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: NextAuth v5
- **API**: Next.js API Routes
- **实时通信**: Server-Sent Events (SSE)

### 核心集成
- **AI SDK**: iFlow CLI SDK v0.1.2
- **消息系统**: WebSocket + SSE
- **工作区管理**: 文件系统集成
- **会话管理**: 30分钟自动清理

---

## 🚀 快速开始

### 🚀 一键部署

**最简单的方式：** 你可以直接将当前项目交给 iFlow 查看，它会自动分析项目结构并完成部署。无需手动配置环境变量或执行安装命令。

### 🛠️ 手动安装

如果需要手动安装，请确保满足以下环境要求：
- Node.js 18+
- PostgreSQL 数据库
- iFlow API 密钥

**安装步骤：**

1. **克隆项目**
```bash
git clone https://github.com/stone100010/iflow-chatbot.git
cd iflow-chatbot
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**

创建 `.env.local` 文件:
```env
# 数据库
POSTGRES_URL="postgresql://..."

# iFlow API
IFLOW_API_KEY="sk-..."
IFLOW_BASE_URL="https://apis.iflow.cn/v1"

# NextAuth
AUTH_SECRET="your-secret-key"
```

4. **数据库迁移**
```bash
pnpm db:migrate
```

5. **启动开发服务器**
```bash
pnpm dev
```

应用将在 [localhost:3000](http://localhost:3000) 启动。

---

## 🎨 界面特性

### 响应式设计
- **桌面端**: 侧边栏 + 主聊天区域布局
- **移动端**: 抽屉式侧边栏 + 全屏聊天体验
- **自适应**: 配置选择器在 Popover/Sheet 间自动切换

### 深色模式
- next-themes 集成
- 系统主题自动检测
- 动态主题色切换

### 交互细节
- 流式消息显示
- 工具调用进度动画
- 任务计划进度条
- 可折叠的思考区块
- 代码语法高亮 (oneDark 主题)

---

## 🔐 权限控制

### 认证系统
- NextAuth v5 集成
- 访客用户支持 (`guest-{timestamp}`)
- 会话管理
- API 密钥环境变量保护

### iFlow 权限模式
- **default**: 每个操作都需要确认
- **autoEdit**: 自动执行编辑操作
- **yolo**: 自动执行所有操作
- **plan**: 执行前制定详细计划

---

## 🤝 贡献指南

欢迎贡献！请随意提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📄 开源协议

本项目采用 Apache-2.0 License 开源。

---

## 🙏 致谢

- [Vercel](https://vercel.com) 提供 Next.js 和部署平台
- [shadcn/ui](https://ui.shadcn.com) 提供精美组件
- 所有贡献者和支持者

---

## 📞 联系方式

如有问题或建议，请在 GitHub 上创建 Issue。

**项目地址**: [https://github.com/stone100010/iflow-chatbot](https://github.com/stone100010/iflow-chatbot)