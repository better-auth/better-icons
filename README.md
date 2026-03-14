# Better Icons

Search and retrieve 200,000+ icons from 150+ icon collections. Works as an MCP server for AI agents or CLI tool.

## Quick Start

### Add SKills

You can enable the underlying icons cli usage using skills

```bash
npx add-skill better-auth/better-icons
```

### MCP Server (AI Agents)

Configure the MCP server to enable icon tools in your AI coding agents.

```bash
npx better-icons setup
```

This interactively configures the MCP server for:
- **Cursor**
- **Claude Code**
- **OpenCode**
- **Windsurf**
- **VS Code (Copilot)**
- **Google Antigravity**

Or [configure manually](#manual-installation).

### CLI (Direct Usage)

Use the CLI to search and retrieve icons directly from your terminal.

```bash
# Search for icons
npx better-icons search arrow
npx better-icons search home --prefix lucide --limit 10

# Get icon SVG (outputs to stdout)
npx better-icons get lucide:home > icon.svg
npx better-icons get mdi:account --color '#333' --size 24

# JSON output for scripting
npx better-icons search settings --json | jq '.icons[:5]'
npx better-icons get heroicons:check --json
```

## Why?

Icons are a common pain point in AI-assisted coding. Models often struggle to know which icons are available, generate correct SVG code, maintain consistent styles, and organize icons properly. Inline SVGs also consume unnecessary tokens.

## Features

- **200,000+ Icons** - Search across 150+ icon collections (Lucide, Heroicons, Material Design, etc.)
- **Auto-Learning** - Remembers which icon collections you use and prioritizes them in future searches
- **Project Sync** - Icons are written directly to your icons file (`.tsx`, `.ts`, `.js`) instead of pasting SVG into chat (saves tokens!)
- **Batch Retrieval** - Get multiple icons at once
- **Similar Icons** - Find the same icon across different collections and styles
- **Recent Icons** - Quick access to icons you've used before
- **Multi-Framework** - React, Vue, Svelte, Solid, and raw SVG exports

## Manual Installation

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "better-icons": {
      "command": "npx",
      "args": ["-y", "better-icons"]
    }
  }
}
```

### Claude Code (CLI)

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "better-icons": {
      "command": "npx",
      "args": ["-y", "better-icons"]
    }
  }
}
```

### Google Antigravity

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "better-icons": {
      "command": "npx",
      "args": ["-y", "better-icons"]
    }
  }
}
```

## MCP Tools

The following tools are available when using the MCP server with AI agents.

### `search_icons`

Search for icons across 150+ icon collections.

```
Search for "arrow" icons
Search for "home" icons in the lucide collection
```

**Parameters:**
- `query` (required): Search query (e.g., 'arrow', 'home', 'user')
- `limit` (optional): Maximum results (1-999, default: 32)
- `prefix` (optional): Filter by collection (e.g., 'mdi', 'lucide')
- `category` (optional): Filter by category

### `get_icon`

Get the SVG code for a specific icon with multiple usage formats.

```
Get the SVG for mdi:home
Get a URL for mdi:home
Get lucide:arrow-right with size 24
```

**Parameters:**
- `icon_id` (required): Icon ID in format 'prefix:name' (e.g., 'mdi:home')
- `color` (optional): Icon color (e.g., '#ff0000', 'currentColor')
- `size` (optional): Icon size in pixels
- `format` (optional): 'svg' (default) or 'url'

**Returns:**
- Raw SVG code
- React/JSX component code
- Iconify component usage
- Direct SVG URL (when `format: "url"`)

### `list_collections`

List available icon collections/libraries.

```
List all icon collections
Search for "material" collections
```

**Parameters:**
- `category` (optional): Filter by category
- `search` (optional): Search collections by name

### `recommend_icons`

Get icon recommendations for a specific use case.

```
What icon should I use for a settings button?
Recommend icons for user authentication
```

**Parameters:**
- `use_case` (required): Describe what you need
- `style` (optional): 'solid', 'outline', or 'any'
- `limit` (optional): Number of recommendations (1-20)

### `get_icon_preferences`

View your learned icon collection preferences with usage statistics.

```
Show my icon preferences
What icon collections do I use most?
```

### `clear_icon_preferences`

Reset all learned icon preferences to start fresh.

```
Clear my icon preferences
Reset icon preferences
```

### `find_similar_icons`

Find similar icons or variations of a given icon across different collections and styles.

```
Find icons similar to lucide:home
What other arrow icons are there like mdi:arrow-right?
```

**Parameters:**
- `icon_id` (required): Icon ID to find variations of
- `limit` (optional): Maximum number of similar icons (1-50, default: 10)

### `get_icons`

Get multiple icons at once (batch retrieval). More efficient than multiple `get_icon` calls.

```
Get these icons: lucide:home, lucide:settings, lucide:user
```

**Parameters:**
- `icon_ids` (required): Array of icon IDs (max 20)
- `color` (optional): Color for all icons
- `size` (optional): Size in pixels for all icons

### `get_recent_icons`

View your recently used icons for quick reuse.

```
Show my recent icons
What icons have I used recently?
```

**Parameters:**
- `limit` (optional): Number of recent icons to show (1-50, default: 20)

### `sync_icon`

Get an icon AND automatically add it to your project's icons file. The recommended way to add icons.

```
Sync the lucide:home icon to my project
Add a settings icon to my icons file
```

**Parameters:**
- `icons_file` (required): Absolute path to the icons file
- `framework` (required): 'react', 'vue', 'svelte', 'solid', or 'svg'
- `icon_id` (required): Icon ID in format 'prefix:name'
- `component_name` (optional): Custom component name
- `color` (optional): Icon color
- `size` (optional): Icon size in pixels

**Returns:**
- Confirmation that icon was added (or already exists)
- Import statement to use
- Usage example

### `scan_project_icons`

Scan an icons file to see what icons are already available.

```
What icons are already in my project?
Scan my icons file
```

**Parameters:**
- `icons_file` (required): Absolute path to the icons file

## Popular Icon Collections

| Prefix | Name | Style | Icons |
|--------|------|-------|-------|
| `mdi` | Material Design Icons | Solid | 7,000+ |
| `lucide` | Lucide Icons | Outline | 1,500+ |
| `heroicons` | Heroicons | Both | 300+ |
| `tabler` | Tabler Icons | Outline | 5,000+ |
| `ph` | Phosphor Icons | Multiple | 9,000+ |
| `ri` | Remix Icons | Both | 2,800+ |
| `fa6-solid` | Font Awesome 6 | Solid | 2,000+ |
| `simple-icons` | Simple Icons | Logos | 3,000+ |

## CLI Reference

### Search Icons

Search across 150+ icon collections.

```bash
better-icons search <query> [options]
```

| Option | Description |
|--------|-------------|
| `-p, --prefix <prefix>` | Filter by collection (e.g., `lucide`, `mdi`) |
| `-l, --limit <number>` | Maximum results (default: 32) |
| `--json` | Output as JSON for scripting |

### Get Icon

Retrieve a single icon's SVG code.

```bash
better-icons get <icon-id> [options]
```

| Option | Description |
|--------|-------------|
| `-c, --color <color>` | Icon color (e.g., `#ff0000`, `currentColor`) |
| `-s, --size <pixels>` | Icon size in pixels |
| `--json` | Output as JSON with metadata |

The icon ID format is `prefix:name` (e.g., `lucide:home`, `mdi:arrow-right`).

### Setup Commands

```bash
better-icons setup              # Interactive setup wizard
better-icons setup -y           # Auto-confirm (global scope)
better-icons setup -s project   # Setup for current project only
better-icons config             # Show manual config instructions
```

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `-a, --agent <agents...>` | Specify agents (cursor, claude-code, opencode, windsurf, vscode, antigravity) |
| `-s, --scope <scope>` | Config scope: `global` (default) or `project` |

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run dev

# Build
bun run build
```

## License

MIT
