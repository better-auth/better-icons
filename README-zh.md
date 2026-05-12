# Better Icons

从 150+ 图标集合中搜索和检索 200,000+ 图标。可作为 AI 代理的 MCP 服务器或 CLI 工具使用。

## 快速开始

### 添加技能

在你的代理环境中启用 `better-icons` CLI 功能：

```bash
npx skills add better-auth/better-icons
```

### 直接 CLI 安装

或者，全局安装 CLI 用于直接非代理使用：

```bash
# 使用 npm
npm install -g better-icons

# 使用 Bun（更快）
bun add -g better-icons
```

---

### MCP 服务器（AI 代理）

在 Claude Desktop 配置中添加：

```json
{
  "mcpServers": {
    "better-icons": {
      "command": "npx",
      "args": ["better-icons", "mcp"]
    }
  }
}
```

### CLI 使用

```bash
# 搜索图标
better-icons search "arrow right"

# 获取图标详情
better-icons get lucide:arrow-right

# 下载图标
better-icons download lucide:arrow-right --format svg

# 列出所有图标集合
better-icons collections

# 按集合搜索
better-icons search "home" --collection lucide
```

## 功能特性

- 🔍 **搜索 200,000+ 图标** — 来自 150+ 图标集合
- 🤖 **MCP 服务器** — AI 代理可以直接搜索和检索图标
- 📦 **CLI 工具** — 命令行界面用于快速搜索和下载
- 🎨 **多格式支持** — SVG、PNG 等格式
- ⚡ **快速搜索** — 基于索引的即时搜索
- 📋 **复制到剪贴板** — 直接复制 SVG 代码

## 支持的图标集合

- **Lucide** — 简洁美观的开源图标
- **Heroicons** — 由 Tailwind CSS 团队创建
- **Feather Icons** — 简单美丽的开源图标
- **Material Icons** — Google 的 Material Design 图标
- **Font Awesome** — 最流行的图标库
- **Tabler Icons** — 超过 4,000 个免费 SVG 图标
- **Phosphor Icons** — 灵活的图标家族
- 以及更多...

## MCP 工具

当作为 MCP 服务器运行时，提供以下工具：

| 工具 | 说明 |
|------|------|
| `search_icons` | 按关键词搜索图标 |
| `get_icon` | 获取特定图标的详细信息 |
| `list_collections` | 列出所有可用的图标集合 |
| `download_icon` | 下载图标文件 |

## 配置

创建 `~/.better-icons/config.json`：

```json
{
  "defaultFormat": "svg",
  "defaultSize": 24,
  "outputDir": "./icons"
}
```

## 开发

```bash
git clone https://github.com/better-auth/better-icons.git
cd better-icons
bun install
bun run dev
```

## 许可证

MIT
