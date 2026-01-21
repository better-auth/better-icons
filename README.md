# Better Icons

An MCP (Model Context Protocol) server for searching and retrieving icons from 200+ icon libraries powered by [Iconify](https://iconify.design/) - the same data source behind [icones.js.org](https://icones.js.org).

## Why?

When doing AI-assisted coding, icons are often a pain point. AI models struggle to:
- Know what icons are available
- Provide correct SVG code
- Suggest appropriate icons for UI elements

This MCP server solves that by giving AI models direct access to search and retrieve icons from the massive Iconify collection (200,000+ icons!).

## Quick Setup

```bash
npx better-icons setup
```

This will interactively configure the MCP server for:
- **Cursor**
- **Claude Code**
- **OpenCode**
- **Windsurf**
- **VS Code (Copilot)**

## Add AI Skills (Optional)

Teach your AI assistant best practices for using better-icons:

```bash
npx skills add better-auth/better-icons
```

This ensures AI assistants will:
- ✅ Use the `better-icons` MCP instead of installing icon packages
- ✅ For React, create a single `icons.tsx` file with all icons
- ✅ Reuse existing icons before adding new ones
- ✅ Follow consistent naming conventions

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

## Tools

### `search_icons`

Search for icons across 200+ icon libraries.

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
Get lucide:arrow-right with size 24
```

**Parameters:**
- `icon_id` (required): Icon ID in format 'prefix:name' (e.g., 'mdi:home')
- `color` (optional): Icon color (e.g., '#ff0000', 'currentColor')
- `size` (optional): Icon size in pixels

**Returns:**
- Raw SVG code
- React/JSX component code
- Iconify component usage

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

## CLI Commands

```bash
npx better-icons              # Run the MCP server (for tool configs)
npx better-icons setup        # Interactive setup wizard
npx better-icons setup -y     # Setup with auto-confirm (global)
npx better-icons setup -s project  # Setup for current project only
npx better-icons config       # Show manual config instructions
npx better-icons --help       # Show help
```

### Options

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `-a, --agent <agents...>` | Specify agents (cursor, claude-code, opencode, windsurf, vscode) |
| `-s, --scope <scope>` | Config scope: `global` (default) or `project` |

### Scope

- **Global**: Configures MCP server for all projects (stored in home directory)
- **Project**: Configures MCP server for current project only (stored in project root)

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
