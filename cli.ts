#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as readline from "node:readline";

const PACKAGE_NAME = "better-icons";

interface McpConfig {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
}

interface EditorConfig {
  name: string;
  configPath: string;
  detected: boolean;
}

function getEditorConfigs(): EditorConfig[] {
  const home = homedir();
  const isMac = process.platform === "darwin";
  const isWindows = process.platform === "win32";

  const configs: EditorConfig[] = [
    {
      name: "Cursor",
      configPath: join(home, ".cursor", "mcp.json"),
      detected: existsSync(join(home, ".cursor")),
    },
    {
      name: "Claude Desktop",
      configPath: isMac
        ? join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
        : isWindows
          ? join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
          : join(home, ".config", "claude", "claude_desktop_config.json"),
      detected: isMac
        ? existsSync(join(home, "Library", "Application Support", "Claude"))
        : isWindows
          ? existsSync(join(home, "AppData", "Roaming", "Claude"))
          : existsSync(join(home, ".config", "claude")),
    },
    {
      name: "VS Code (Copilot)",
      configPath: join(home, ".vscode", "mcp.json"),
      detected: existsSync(join(home, ".vscode")),
    },
    {
      name: "Windsurf",
      configPath: join(home, ".windsurf", "mcp.json"),
      detected: existsSync(join(home, ".windsurf")),
    },
  ];

  return configs;
}

function readJsonFile(path: string): McpConfig {
  try {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // File doesn't exist or is invalid JSON
  }
  return {};
}

function writeJsonFile(path: string, data: McpConfig): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function getMcpServerConfig(): McpConfig["mcpServers"] {
  return {
    "better-icons": {
      command: "npx",
      args: ["-y", PACKAGE_NAME],
    },
  };
}

// Interactive checkbox selector
async function multiSelect(
  items: { label: string; value: string; checked: boolean }[]
): Promise<string[]> {
  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set(items.filter(i => i.checked).map(i => i.value));

    const render = () => {
      // Move cursor up to redraw
      if (cursor > 0 || items.length > 0) {
        process.stdout.write(`\x1b[${items.length + 2}A`);
      }
      
      console.log("\x1b[36m?\x1b[0m Select tools to configure \x1b[2m(space to toggle, enter to confirm)\x1b[0m\n");
      
      items.forEach((item, i) => {
        const isSelected = selected.has(item.value);
        const isCursor = i === cursor;
        const checkbox = isSelected ? "\x1b[36m◉\x1b[0m" : "○";
        const pointer = isCursor ? "\x1b[36m❯\x1b[0m" : " ";
        const label = isCursor ? `\x1b[36m${item.label}\x1b[0m` : item.label;
        console.log(`${pointer} ${checkbox} ${label}`);
      });
    };

    // Initial render
    console.log("\n".repeat(items.length + 1));
    render();

    // Set up raw mode for key input
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    const onKeypress = (key: string) => {
      // Handle Ctrl+C
      if (key === "\x03") {
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener("data", onKeypress);
        console.log("\n\n👋 Setup cancelled.\n");
        resolve([]);
        return;
      }

      // Handle arrow keys
      if (key === "\x1b[A" || key === "k") {
        // Up
        cursor = cursor > 0 ? cursor - 1 : items.length - 1;
        render();
      } else if (key === "\x1b[B" || key === "j") {
        // Down
        cursor = cursor < items.length - 1 ? cursor + 1 : 0;
        render();
      } else if (key === " ") {
        // Space - toggle
        const item = items[cursor];
        if (item) {
          if (selected.has(item.value)) {
            selected.delete(item.value);
          } else {
            selected.add(item.value);
          }
          render();
        }
      } else if (key === "a") {
        // Select all
        items.forEach(i => selected.add(i.value));
        render();
      } else if (key === "n") {
        // Select none
        selected.clear();
        render();
      } else if (key === "\r" || key === "\n") {
        // Enter - confirm
        process.stdin.setRawMode?.(false);
        process.stdin.removeListener("data", onKeypress);
        console.log("\n");
        resolve(Array.from(selected));
      }
    };

    process.stdin.on("data", onKeypress);
  });
}

async function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function runInteractiveSetup(): Promise<void> {
  const editors = getEditorConfigs();

  console.log("\n📦 \x1b[1mBetter Icons MCP Server Setup\x1b[0m\n");
  console.log("This will configure the Better Icons MCP server for your AI coding tools.\n");

  // Build items for selector
  const items = editors.map((e) => ({
    label: `${e.name}${e.detected ? " \x1b[32m(detected)\x1b[0m" : " \x1b[2m(not detected)\x1b[0m"}`,
    value: e.name,
    checked: e.detected, // Pre-select detected editors
  }));

  const selectedNames = await multiSelect(items);

  if (selectedNames.length === 0) {
    showManualInstructions();
    return;
  }

  const selected = editors.filter((e) => selectedNames.includes(e.name));

  console.log("🔧 Configuring...\n");

  let configured = 0;
  for (const editor of selected) {
    const config = readJsonFile(editor.configPath);
    const serverConfig = getMcpServerConfig();

    if (config.mcpServers?.["better-icons"]) {
      const overwrite = await confirm(
        `   ⚠️  ${editor.name} already has better-icons configured. Overwrite?`
      );
      if (!overwrite) {
        console.log(`   ⏭️  Skipped ${editor.name}\n`);
        continue;
      }
    }

    config.mcpServers = {
      ...config.mcpServers,
      ...serverConfig,
    };

    writeJsonFile(editor.configPath, config);
    console.log(`   ✅ \x1b[32mConfigured ${editor.name}\x1b[0m`);
    console.log(`      \x1b[2m${editor.configPath}\x1b[0m\n`);
    configured++;
  }

  if (configured > 0) {
    console.log(`🎉 \x1b[1mDone! Configured ${configured} tool(s).\x1b[0m`);
    console.log("\n💡 \x1b[33mRestart your editor\x1b[0m to load the MCP server.");
    console.log("\n🔍 Try asking your AI: \x1b[36m\"Search for arrow icons\"\x1b[0m\n");
  } else {
    console.log("No tools were configured.\n");
    showManualInstructions();
  }
}

function showManualInstructions(): void {
  console.log("📖 \x1b[1mManual Configuration\x1b[0m\n");
  console.log("Add this to your MCP config file:\n");
  console.log("\x1b[2m" + JSON.stringify({
    mcpServers: getMcpServerConfig(),
  }, null, 2) + "\x1b[0m");
  console.log("\n\x1b[1mConfig file locations:\x1b[0m");
  console.log("  • Cursor: ~/.cursor/mcp.json");
  console.log("  • Claude Desktop (macOS): ~/Library/Application Support/Claude/claude_desktop_config.json");
  console.log("  • Claude Desktop (Windows): %APPDATA%\\Claude\\claude_desktop_config.json");
  console.log("  • VS Code: ~/.vscode/mcp.json");
  console.log("  • Windsurf: ~/.windsurf/mcp.json\n");
}

const SKILLS_CONTENT = `---
name: better-icons-best-practices
description: Skill for integrating Better Icons
---
## Overview

Use the \`better-icons\` MCP server for all icon needs. Do NOT use \`lucide-react\`, \`@heroicons/react\`, \`react-icons\`, or any other icon library.

## How to Get Icons

1. **Search for icons** using the \`search_icons\` tool
2. **Get the SVG** using the \`get_icon\` tool
3. **Add to the project's \`icons.tsx\` file** (create if it doesn't exist)

## React Projects - Icon Pattern

### File Structure

All icons should be in a single \`icons.tsx\` file (typically at \`src/components/icons.tsx\` or \`components/icons.tsx\`).

### Icons File Format

\`\`\`tsx
import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Icons = {
  // Example icons - add more as needed
  home: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>
    </svg>
  ),
  
  arrowRight: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
    </svg>
  ),
  
  // Add more icons here...
} as const;

export type IconName = keyof typeof Icons;
\`\`\`

### Usage in Components

\`\`\`tsx
import { Icons } from "@/components/icons";

// Basic usage
<Icons.home />

// With props
<Icons.arrowRight className="w-5 h-5 text-blue-500" />

// With click handler
<button onClick={handleClick}>
  <Icons.settings className="w-4 h-4" />
  Settings
</button>
\`\`\`

## Workflow for Adding Icons

### Step 1: Check if icon exists

Before adding a new icon, check the existing \`icons.tsx\` file. If an icon with the same purpose exists, use it.

### Step 2: Search for the icon

Use the \`search_icons\` tool:
\`\`\`
search_icons({ query: "settings", prefix: "lucide", limit: 5 })
\`\`\`

Prefer these collections (in order):
1. \`lucide\` - Clean, consistent outline icons
2. \`tabler\` - Similar style to lucide
3. \`mdi\` - Comprehensive, good for filled icons
4. \`heroicons\` - Tailwind-style icons

### Step 3: Get the SVG

Use the \`get_icon\` tool:
\`\`\`
get_icon({ icon_id: "lucide:settings" })
\`\`\`

### Step 4: Add to icons.tsx

Convert the SVG to the Icons pattern:

\`\`\`tsx
// From get_icon response:
// <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">...</svg>

// Add to Icons object:
settings: (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
    {/* SVG content */}
  </svg>
),
\`\`\`

### Step 5: Use in component

\`\`\`tsx
<Icons.settings className="w-5 h-5" />
\`\`\`

## Icon Naming Conventions

- Use camelCase: \`arrowRight\`, \`chevronDown\`, \`userPlus\`
- Be descriptive: \`checkCircle\` not \`check2\`
- Match purpose: \`close\` for X icons, \`menu\` for hamburger
- Avoid prefixes: \`settings\` not \`iconSettings\`

## Common Icons Reference

| Purpose | Icon Name | Search Term |
|---------|-----------|-------------|
| Navigation | \`menu\`, \`close\`, \`arrowLeft\`, \`arrowRight\` | menu, x, arrow |
| Actions | \`plus\`, \`minus\`, \`edit\`, \`trash\`, \`save\` | plus, edit, trash |
| Status | \`check\`, \`x\`, \`alertCircle\`, \`info\` | check, alert, info |
| User | \`user\`, \`users\`, \`userPlus\` | user |
| Media | \`play\`, \`pause\`, \`volume\`, \`image\` | play, volume |
| Files | \`file\`, \`folder\`, \`download\`, \`upload\` | file, download |
| Communication | \`mail\`, \`message\`, \`phone\`, \`bell\` | mail, message |
| UI | \`search\`, \`filter\`, \`settings\`, \`more\` | search, settings |

## DO NOT

- ❌ Install \`lucide-react\`, \`react-icons\`, \`@heroicons/react\`, etc.
- ❌ Import icons from external packages
- ❌ Create separate files for each icon
- ❌ Use icon fonts (Font Awesome CDN, etc.)
- ❌ Inline SVGs directly in components (put them in icons.tsx)

## DO

- ✅ Use the \`better-icons\` MCP tools to find icons
- ✅ Maintain a single \`icons.tsx\` file
- ✅ Reuse existing icons when possible
- ✅ Use consistent naming conventions
- ✅ Pass className for sizing/coloring
- ✅ Use \`currentColor\` for fill/stroke (inherits text color)
`;

interface RulesConfig {
  name: string;
  path: string;
  detected: boolean;
}

function getRulesConfigs(): RulesConfig[] {
  const cwd = process.cwd();
  
  const configs: RulesConfig[] = [
    {
      name: "Cursor",
      path: join(cwd, ".cursor", "rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".cursor")) || existsSync(join(cwd, ".cursorrules")),
    },
    {
      name: "Claude Code",
      path: join(cwd, ".claude", "rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".claude")),
    },
    {
      name: "Windsurf",
      path: join(cwd, ".windsurf", "rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".windsurf")),
    },
    {
      name: "OpenCode",
      path: join(cwd, ".opencode", "rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".opencode")),
    },
    {
      name: "GitHub Copilot",
      path: join(cwd, ".github", "copilot-instructions.md"),
      detected: existsSync(join(cwd, ".github")),
    },
    {
      name: "Cline / Roo",
      path: join(cwd, ".clinerules", "better-icons.md"),
      detected: existsSync(join(cwd, ".clinerules")) || existsSync(join(cwd, ".roo")),
    },
    {
      name: "Aider",
      path: join(cwd, ".aider", "rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".aider")),
    },
    {
      name: "Generic (.rules/)",
      path: join(cwd, ".rules", "better-icons.md"),
      detected: existsSync(join(cwd, ".rules")),
    },
  ];

  return configs;
}

async function installRules(): Promise<void> {
  const configs = getRulesConfigs();

  console.log("\n📖 \x1b[1mBetter Icons - Install AI Rules\x1b[0m\n");
  console.log("This will install rules that teach AI assistants how to use better-icons.\n");

  // Build items for selector
  const items = configs.map((c) => ({
    label: `${c.name}${c.detected ? " \x1b[32m(detected)\x1b[0m" : ""}`,
    value: c.name,
    checked: c.detected,
  }));

  const selectedNames = await multiSelect(items);

  if (selectedNames.length === 0) {
    console.log("👋 No editors selected.\n");
    return;
  }

  const selected = configs.filter((c) => selectedNames.includes(c.name));

  console.log("🔧 Installing rules...\n");

  let installed = 0;
  for (const config of selected) {
    const targetDir = dirname(config.path);
    
    // Check if file exists
    if (existsSync(config.path)) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question(`   ⚠️  ${config.name} rules already exist. Overwrite? (y/N): `, resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== "y") {
        console.log(`   ⏭️  Skipped ${config.name}\n`);
        continue;
      }
    }

    // Create directory if needed
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    writeFileSync(config.path, SKILLS_CONTENT);
    console.log(`   ✅ \x1b[32m${config.name}\x1b[0m`);
    console.log(`      \x1b[2m${config.path}\x1b[0m\n`);
    installed++;
  }

  if (installed > 0) {
    console.log(`🎉 \x1b[1mInstalled rules for ${installed} editor(s)!\x1b[0m`);
    console.log(`
This teaches AI assistants to:
  • Use better-icons MCP for all icons
  • Create a single icons.tsx file
  • Reuse existing icons
  • Never install lucide-react, react-icons, etc.

\x1b[33m💡 Restart your editor to apply the rules.\x1b[0m
`);
  } else {
    console.log("No rules were installed.\n");
  }
}

function showHelp(): void {
  console.log(`
\x1b[1mBetter Icons\x1b[0m - MCP Server for Icon Search

\x1b[1mUsage:\x1b[0m
  npx better-icons          Run the MCP server (used by tool configs)
  npx better-icons setup    Interactive setup wizard  
  npx better-icons rules    Install AI rules to your project
  npx better-icons help     Show this help message

\x1b[1mTools Available:\x1b[0m
  • search_icons      Search 200,000+ icons from 200+ libraries
  • get_icon          Get SVG code for a specific icon
  • list_collections  Browse available icon libraries  
  • recommend_icons   Get icon recommendations for UI use cases

\x1b[1mExamples:\x1b[0m
  After setup, ask your AI assistant:
  • "Search for home icons"
  • "Get the SVG for lucide:arrow-right"
  • "What icon should I use for settings?"

More info: https://github.com/bekacru/better-icons
`);
}

async function runServer(): Promise<void> {
  // Import and run the MCP server inline
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { z } = await import("zod");

  const ICONIFY_API = "https://api.iconify.design";

  interface IconifySearchResult {
    icons: string[];
    total: number;
    limit: number;
    start: number;
    collections: Record<string, number>;
  }

  interface IconifyCollection {
    name: string;
    total: number;
    author?: { name: string; url?: string };
    license?: { title: string; spdx?: string; url?: string };
    samples?: string[];
    height?: number | number[];
    category?: string;
    palette?: boolean;
  }

  interface IconData {
    body: string;
    width?: number;
    height?: number;
    left?: number;
    top?: number;
  }

  interface IconSet {
    icons?: Record<string, IconData>;
    aliases?: Record<string, { parent: string }>;
    width?: number;
    height?: number;
  }

  const server = new McpServer({
    name: "better-icons",
    version: "1.0.0",
  });

  // Tool: Search Icons
  server.registerTool(
    "search_icons",
    {
      description: "Search for icons across 200+ icon libraries powered by Iconify. Returns icon identifiers that can be used with get_icon.",
      inputSchema: {
        query: z.string().describe("Search query (e.g., 'arrow', 'home', 'user', 'check')"),
        limit: z.number().min(1).max(999).default(32).describe("Maximum number of results (1-999, default: 32)"),
        prefix: z.string().optional().describe("Filter by icon collection prefix (e.g., 'mdi', 'lucide', 'heroicons')"),
        category: z.string().optional().describe("Filter by category (e.g., 'General', 'Emoji', 'Thematic')"),
      },
    },
    async ({ query, limit = 32, prefix, category }) => {
      const params = new URLSearchParams({ query, limit: limit.toString() });
      if (prefix) params.set("prefix", prefix);
      if (category) params.set("category", category);

      const response = await fetch(`${ICONIFY_API}/search?${params}`);
      if (!response.ok) {
        return { content: [{ type: "text" as const, text: `Error: ${response.statusText}` }], isError: true };
      }

      const data = (await response.json()) as IconifySearchResult;
      const iconList = data.icons.map((icon) => {
        const [prefix, name] = icon.split(":");
        return { id: icon, prefix, name };
      });

      return {
        content: [{
          type: "text" as const,
          text: `Found ${data.total} icons (showing ${iconList.length})\n\n**Icons:**\n${iconList.map((i) => `- \`${i.id}\``).join("\n")}\n\nUse \`get_icon\` with any icon ID to get the SVG code.`,
        }],
      };
    }
  );

  // Tool: Get Icon
  server.registerTool(
    "get_icon",
    {
      description: "Get the SVG code for a specific icon. Use the icon ID from search_icons results.",
      inputSchema: {
        icon_id: z.string().describe("Icon identifier in format 'prefix:name' (e.g., 'mdi:home', 'lucide:arrow-right')"),
        color: z.string().optional().describe("Icon color (e.g., '#ff0000', 'currentColor')"),
        size: z.number().optional().describe("Icon size in pixels"),
      },
    },
    async ({ icon_id, color, size }) => {
      const [prefix, name] = icon_id.split(":");
      if (!prefix || !name) {
        return { content: [{ type: "text" as const, text: "Invalid icon ID. Use 'prefix:name' format." }], isError: true };
      }

      const dataResponse = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
      if (!dataResponse.ok) {
        return { content: [{ type: "text" as const, text: `Error: ${dataResponse.statusText}` }], isError: true };
      }

      const iconSet = (await dataResponse.json()) as IconSet;
      let resolvedName = name;
      if (iconSet.aliases?.[name]) resolvedName = iconSet.aliases[name].parent;
      
      const iconData = iconSet.icons?.[resolvedName];
      if (!iconData) {
        return { content: [{ type: "text" as const, text: `Icon '${icon_id}' not found` }], isError: true };
      }

      const width = iconData.width || iconSet.width || 24;
      const height = iconData.height || iconSet.height || 24;
      const viewBox = `${iconData.left || 0} ${iconData.top || 0} ${width} ${height}`;
      const svgSize = size ? `width="${size}" height="${size}"` : `width="1em" height="1em"`;
      
      let body = iconData.body;
      if (!body.includes("fill=") && !body.includes("stroke=")) {
        body = body.replace(/<path/g, `<path fill="${color || 'currentColor'}"`);
      }
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${svgSize} viewBox="${viewBox}">${body}</svg>`;

      return {
        content: [{
          type: "text" as const,
          text: `# Icon: ${icon_id}\n\n**Dimensions:** ${width}x${height}\n\n## SVG\n\n\`\`\`svg\n${svg}\n\`\`\`\n\n## React/JSX\n\n\`\`\`jsx\n${svg.replace(/class=/g, 'className=')}\n\`\`\`\n\n## Iconify\n\n\`\`\`jsx\nimport { Icon } from '@iconify/react';\n<Icon icon="${icon_id}" />\n\`\`\``,
        }],
      };
    }
  );

  // Tool: List Collections
  server.registerTool(
    "list_collections",
    {
      description: "List available icon collections/libraries.",
      inputSchema: {
        category: z.string().optional().describe("Filter by category"),
        search: z.string().optional().describe("Search collections by name"),
      },
    },
    async ({ category, search }) => {
      const response = await fetch(`${ICONIFY_API}/collections`);
      if (!response.ok) {
        return { content: [{ type: "text" as const, text: `Error: ${response.statusText}` }], isError: true };
      }

      const collections = (await response.json()) as Record<string, IconifyCollection>;
      let filtered = Object.entries(collections);
      
      if (category) filtered = filtered.filter(([_, c]) => c.category?.toLowerCase().includes(category.toLowerCase()));
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(([p, c]) => p.toLowerCase().includes(s) || c.name.toLowerCase().includes(s));
      }

      filtered.sort((a, b) => b[1].total - a[1].total);
      const top = filtered.slice(0, 50);

      return {
        content: [{
          type: "text" as const,
          text: `# Icon Collections\n\nFound ${filtered.length} collections (showing top 50)\n\n${top.map(([p, c]) => `- **${p}** - ${c.name} (${c.total} icons)`).join("\n")}\n\n**Popular:** mdi, lucide, heroicons, tabler, ph, ri`,
        }],
      };
    }
  );

  // Tool: Recommend Icons
  server.registerTool(
    "recommend_icons",
    {
      description: "Get icon recommendations for a specific use case.",
      inputSchema: {
        use_case: z.string().describe("Describe what you need (e.g., 'navigation menu', 'settings button')"),
        style: z.enum(["solid", "outline", "any"]).default("any").describe("Preferred style"),
        limit: z.number().min(1).max(20).default(10).describe("Number of recommendations"),
      },
    },
    async ({ use_case, style = "any", limit = 10 }) => {
      const terms: Record<string, string> = {
        navigation: "menu", success: "check", error: "alert", user: "user", settings: "cog",
        search: "search", home: "home", close: "x", add: "plus", delete: "trash",
        edit: "pencil", save: "save", download: "download", upload: "upload", share: "share",
        like: "heart", notification: "bell", email: "mail", calendar: "calendar", time: "clock",
        location: "map-pin", phone: "phone", chat: "message", lock: "lock",
      };

      let query = use_case;
      for (const [key, term] of Object.entries(terms)) {
        if (use_case.toLowerCase().includes(key)) { query = term; break; }
      }

      const response = await fetch(`${ICONIFY_API}/search?query=${query}&limit=${limit * 2}`);
      if (!response.ok) {
        return { content: [{ type: "text" as const, text: `Error: ${response.statusText}` }], isError: true };
      }

      const data = (await response.json()) as IconifySearchResult;
      const preferred = style === "solid" ? ["mdi", "fa-solid"] : style === "outline" ? ["lucide", "tabler", "ph"] : ["lucide", "mdi", "heroicons"];
      
      const sorted = data.icons.sort((a, b) => {
        const pA = preferred.indexOf(a.split(":")[0]!);
        const pB = preferred.indexOf(b.split(":")[0]!);
        if (pA >= 0 && pB < 0) return -1;
        if (pB >= 0 && pA < 0) return 1;
        return 0;
      }).slice(0, limit);

      return {
        content: [{
          type: "text" as const,
          text: `# Recommendations for "${use_case}"\n\n${sorted.map((i) => `- \`${i}\``).join("\n")}\n\nUse \`get_icon\` to get SVG code.`,
        }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Better Icons MCP server running");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  // Handle commands
  if (command === "setup" || command === "--setup") {
    await runInteractiveSetup();
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "config") {
    showManualInstructions();
    return;
  }

  if (command === "rules" || command === "skills") {
    await installRules();
    return;
  }
  await runServer();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
