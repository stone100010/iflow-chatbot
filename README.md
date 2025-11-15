  <a href="https://github.com/stone100010/iflow-chatbot">
  <h1 align="center">iFlow Chatbot</h1>
</a>

<p align="center">
    A full-featured Agent chatbot built with Next.js 15 and iFlow CLI SDK, providing Web-based iFlow-like interactive experience.
</p>

<p align="center">
  <a href="README_CN.md" style="color: #0066cc; text-decoration: none; font-weight: bold;">
    📖 中文文档 (Chinese Documentation)
  </a>
</p>

---

## 🙏 Tribute

Great thanks to the [iFlow](https://platform.iflow.cn/) team for their excellent work and all staff for their hard work! 🎉🎉🎉

---

## 🎯 Project Overview

iFlow Chatbot is a production-ready Agent chat application that integrates the **iFlow CLI SDK** to provide powerful features:

- 🤖 Multi-model AI support (MiniMax-M2, Qwen3, DeepSeek, GLM, Kimi)
- 💬 Intelligent conversation with context memory
- 🔧 Tool call visualization and task planning
- 📱 Fully responsive design (Desktop + Mobile)
- 🎨 Dark mode with system theme detection
- 🔐 Secure authentication system (CSRF protection + API rate limiting)
- 💾 Persistent chat history and workspace management
- ⚡ High-performance React rendering optimization (database indexes + session caching)

---

## 📋 Key Features

### 💬 Intelligent Conversation
- Multi-turn dialogue with context understanding (limited to recent 20 messages for optimization)
- Real-time streaming message transmission (useReducer optimization for state updates)
- Markdown rendering with code highlighting
- Tool call status visualization
- Task plan progress tracking

### 🛠️ Tool Integration
- File operations and code generation
- Visual tool call process display
- Task execution plan presentation
- Code editor and file preview
- Smart Markdown rendering for Write/Edit tools

### 📱 User Experience
- Fully responsive design
- Desktop: Sidebar + main chat area
- Mobile: Drawer-style sidebar + fullscreen chat
- Dark mode support
- Touch-optimized interface
- Elegant collapsible content sections

### 🔐 Security & Performance
- **CSRF Protection**: Token-based cross-site request forgery prevention
- **API Rate Limiting**: Sliding window algorithm to prevent abuse
- **Structured Logging**: Complete logging system with file and console output
- **Database Optimization**: Indexed key fields for improved query performance
- **Memory Management**: Session LRU cache to prevent memory leaks
- **Context Optimization**: Smart message history limiting to reduce token consumption

### 🔧 Configuration System

**Supported Models:**
- MiniMax-M2
- Qwen3-Coder-Plus  
- DeepSeek-V3.2
- GLM-4.6
- Kimi-K2-0905

**Permission Modes:**
- `default`: Confirm every operation
- `autoEdit`: Auto-execute edit operations
- `yolo`: Auto-execute all operations
- `plan`: Plan before execution

---

## 🏗️ Technical Architecture

### Frontend Technology
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: React Hooks + Context
- **Animations**: Framer Motion
- **Code Highlighting**: react-syntax-highlighter

### Backend Technology
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: NextAuth v5
- **API**: Next.js API Routes
- **Real-time Communication**: Server-Sent Events (SSE)
- **Security**: CSRF protection + API rate limiting
- **Logging**: Structured logging system (winston-like)
- **Caching**: LRU cache (Session management)

### Core Integration
- **AI SDK**: iFlow CLI SDK v0.1.2
- **Message System**: WebSocket + SSE
- **Workspace Management**: File system integration
- **Session Management**: 30-minute auto-cleanup + bounded cache to prevent leaks
- **Performance Monitoring**: Database index optimization + query performance tracking

---

## 🚀 Quick Start

### 🚀 One-Click Deployment

**The simplest way:** You can directly hand the current project to iFlow for review, and it will automatically analyze the project structure and complete the deployment. No manual environment variable configuration or installation commands required.

### 🛠️ Manual Installation

If manual installation is needed, ensure the following environment requirements:
- Node.js 18+
- PostgreSQL database
- iFlow API key

**Installation Steps:**

1. **Clone the project**
```bash
git clone https://github.com/stone100010/iflow-chatbot.git
cd iflow-chatbot
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

Create `.env.local` file:
```env
# Database
POSTGRES_URL="postgresql://..."

# iFlow API
IFLOW_API_KEY="sk-..."
IFLOW_BASE_URL="https://apis.iflow.cn/v1"

# NextAuth
AUTH_SECRET="your-secret-key"
```

4. **Database migration**
```bash
pnpm db:migrate
```

5. **Start development server**
```bash
pnpm dev
```

The app will start at [localhost:3000](http://localhost:3000).

---

## 🎨 Interface Features

### Responsive Design
- **Desktop**: Sidebar + main chat area layout
- **Mobile**: Drawer-style sidebar + fullscreen chat experience
- **Adaptive**: Config selector auto-switches between Popover/Sheet

### Dark Mode
- next-themes integration
- System theme auto-detection
- Dynamic theme color switching

### Interaction Details
- Streaming message display
- Tool call progress animations
- Task plan progress bars
- **Collapsible content sections**:
  - 💭 **Thinking Process**: Collapsible thinking blocks with merged display
  - 📋 **Task Plan**: Collapsible task list with expandable steps
  - 🔧 **Tool Calls**: Two-layer collapsible structure (overall + individual tools)
  - 🎨 **Smart Rendering**: Automatic Markdown formatting for .md files, syntax highlighting for code files
- Code syntax highlighting (oneDark theme)

---

## 🔐 Permission Control

### Authentication System
- NextAuth v5 integration
- User registration and login
- Session management with auto-expiration
- API key environment variable protection

### Security Mechanisms
- **CSRF Protection**:
  - Token-based encrypted validation mechanism
  - Automatic token refresh and expiration management
  - Hook-based convenient usage (`use-csrf-token`)
- **API Rate Limiting**:
  - Sliding window algorithm
  - Configurable rate limit policies (requests/time window)
  - Redis/Memory dual implementation support
  - Admin endpoint for monitoring rate limit status
- **Session Management**:
  - LRU cache strategy
  - Bounded cache to prevent memory leaks
  - Automatic expiration and cleanup mechanism

### Admin Features
- `/api/admin/sessions` - Session management and monitoring
- `/api/admin/rate-limits` - Rate limit rules viewing and configuration

### iFlow Permission Modes
- **default**: Each operation requires confirmation
- **autoEdit**: Auto-execute edit operations
- **yolo**: Auto-execute all operations
- **plan**: Make detailed plans before execution

---

## 🤝 Contributing Guide

Contributions are welcome! Please feel free to submit Pull Requests.

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the Apache-2.0 License.

---

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for Next.js and deployment platform
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- All contributors and supporters

---

## 📞 Contact

For questions or feedback, please create an Issue on GitHub.

**Project Link**: [https://github.com/stone100010/iflow-chatbot](https://github.com/stone100010/iflow-chatbot)