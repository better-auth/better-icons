#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ICONIFY_API = "https://api.iconify.design";

// Types
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

// Create MCP server
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
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    
    if (prefix) params.set("prefix", prefix);
    if (category) params.set("category", category);

    const response = await fetch(`${ICONIFY_API}/search?${params}`);
    
    if (!response.ok) {
      return {
        content: [{ type: "text" as const, text: `Error searching icons: ${response.statusText}` }],
        isError: true,
      };
    }

    const data = (await response.json()) as IconifySearchResult;
    
    const iconList = data.icons.map((icon) => {
      const [prefix, name] = icon.split(":");
      return { id: icon, prefix, name };
    });

    const collectionsInfo = Object.entries(data.collections)
      .map(([name, info]) => `${name}: ${typeof info === 'number' ? info : (info as { count?: number }).count ?? '?'}`)
      .join(", ");

    return {
      content: [
        {
          type: "text" as const,
          text: `Found ${data.total} icons (showing ${iconList.length})

**Collections matched:** ${collectionsInfo || "none"}

**Icons:**
${iconList.map((i) => `- \`${i.id}\` (prefix: ${i.prefix}, name: ${i.name})`).join("\n")}

Use \`get_icon\` with any icon ID to get the SVG code.`,
        },
      ],
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
      size: z.number().optional().describe("Icon size in pixels (applies to both width and height)"),
    },
  },
  async ({ icon_id, color, size }) => {
    const [prefix, name] = icon_id.split(":");
    
    if (!prefix || !name) {
      return {
        content: [{ type: "text" as const, text: "Invalid icon ID format. Use 'prefix:name' format (e.g., 'mdi:home')" }],
        isError: true,
      };
    }

    // Get icon data
    const dataResponse = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
    
    if (!dataResponse.ok) {
      return {
        content: [{ type: "text" as const, text: `Error fetching icon data: ${dataResponse.statusText}` }],
        isError: true,
      };
    }

    const iconSet = (await dataResponse.json()) as IconSet;
    
    // Handle aliases - resolve to parent icon if this is an alias
    let resolvedName = name;
    if (iconSet.aliases?.[name]) {
      resolvedName = iconSet.aliases[name].parent;
    }
    
    const iconData: IconData | undefined = iconSet.icons?.[resolvedName];
    
    if (!iconData) {
      return {
        content: [{ type: "text" as const, text: `Icon '${icon_id}' not found` }],
        isError: true,
      };
    }

    // Build SVG
    const width = iconData.width || iconSet.width || 24;
    const height = iconData.height || iconSet.height || 24;
    const viewBox = `${iconData.left || 0} ${iconData.top || 0} ${width} ${height}`;
    
    const svgSize = size ? `width="${size}" height="${size}"` : `width="1em" height="1em"`;
    const fillColor = color || "currentColor";
    
    // Process body to apply color
    let body = iconData.body;
    if (!body.includes("fill=") && !body.includes("stroke=")) {
      body = body.replace(/<path/g, `<path fill="${fillColor}"`);
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${svgSize} viewBox="${viewBox}">${body}</svg>`;

    // Also provide various usage formats
    const reactComponent = `<svg xmlns="http://www.w3.org/2000/svg" ${size ? `width={${size}} height={${size}}` : 'width="1em" height="1em"'} viewBox="${viewBox}">${body.replace(/class=/g, 'className=')}</svg>`;

    return {
      content: [
        {
          type: "text" as const,
          text: `# Icon: ${icon_id}

**Dimensions:** ${width}x${height}

## SVG Code

\`\`\`svg
${svg}
\`\`\`

## React/JSX Usage

\`\`\`jsx
${reactComponent}
\`\`\`

## As Data URI

\`\`\`
data:image/svg+xml,${encodeURIComponent(svg)}
\`\`\`

## CSS Background

\`\`\`css
background-image: url("data:image/svg+xml,${encodeURIComponent(svg)}");
\`\`\`

## Iconify Usage (if using @iconify/react)

\`\`\`jsx
import { Icon } from '@iconify/react';
<Icon icon="${icon_id}" />
\`\`\``,
        },
      ],
    };
  }
);

// Tool: List Collections
server.registerTool(
  "list_collections",
  {
    description: "List available icon collections/libraries. Useful for discovering what icon sets are available.",
    inputSchema: {
      category: z.string().optional().describe("Filter by category (e.g., 'General', 'Emoji', 'Thematic')"),
      search: z.string().optional().describe("Search collections by name"),
    },
  },
  async ({ category, search }) => {
    const response = await fetch(`${ICONIFY_API}/collections`);
    
    if (!response.ok) {
      return {
        content: [{ type: "text" as const, text: `Error fetching collections: ${response.statusText}` }],
        isError: true,
      };
    }

    const collections = (await response.json()) as Record<string, IconifyCollection>;
    
    let filtered = Object.entries(collections);
    
    if (category) {
      filtered = filtered.filter(([_, col]) => 
        col.category?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(([prefix, col]) => 
        prefix.toLowerCase().includes(searchLower) || 
        col.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by total icons descending
    filtered.sort((a, b) => b[1].total - a[1].total);
    
    // Limit to top 50 for readability
    const top = filtered.slice(0, 50);
    
    const collectionList = top.map(([prefix, col]) => {
      const license = col.license?.spdx || col.license?.title || "Unknown";
      return `- **${prefix}** - ${col.name} (${col.total} icons) [${license}]${col.category ? ` - ${col.category}` : ""}`;
    }).join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `# Icon Collections

Found ${filtered.length} collections${category ? ` in category "${category}"` : ""}${search ? ` matching "${search}"` : ""} (showing top 50)

${collectionList}

**Popular collections:**
- \`mdi\` - Material Design Icons (comprehensive general-purpose)
- \`lucide\` - Lucide Icons (clean, modern)
- \`heroicons\` - Heroicons (Tailwind CSS)
- \`tabler\` - Tabler Icons (stroke-based)
- \`ph\` - Phosphor Icons (flexible weights)
- \`ri\` - Remix Icons (neutral style)

Use the prefix with \`search_icons\` to filter results.`,
        },
      ],
    };
  }
);

// Tool: Get Icon by Category/Style
server.registerTool(
  "recommend_icons",
  {
    description: "Get icon recommendations for a specific use case or UI element.",
    inputSchema: {
      use_case: z.string().describe("Describe what you need the icon for (e.g., 'navigation menu', 'success message', 'user profile', 'settings button')"),
      style: z.enum(["solid", "outline", "any"]).default("any").describe("Preferred icon style"),
      limit: z.number().min(1).max(20).default(10).describe("Number of recommendations"),
    },
  },
  async ({ use_case, style = "any", limit = 10 }) => {
    // Map use cases to search terms
    const searchTerms: Record<string, string[]> = {
      navigation: ["menu", "hamburger", "bars"],
      success: ["check", "checkmark", "success", "done"],
      error: ["error", "alert", "warning", "exclamation"],
      user: ["user", "person", "account", "profile"],
      settings: ["settings", "cog", "gear", "preferences"],
      search: ["search", "magnify", "find"],
      home: ["home", "house"],
      close: ["close", "x", "times", "cross"],
      add: ["add", "plus", "new"],
      delete: ["delete", "trash", "remove", "bin"],
      edit: ["edit", "pencil", "pen", "write"],
      save: ["save", "disk", "floppy"],
      download: ["download", "arrow-down"],
      upload: ["upload", "arrow-up"],
      share: ["share", "send"],
      like: ["heart", "like", "favorite", "love"],
      notification: ["bell", "notification", "alert"],
      email: ["email", "mail", "envelope"],
      calendar: ["calendar", "date", "schedule"],
      time: ["clock", "time", "watch"],
      location: ["location", "map", "pin", "marker"],
      phone: ["phone", "call", "telephone"],
      chat: ["chat", "message", "comment", "bubble"],
      lock: ["lock", "security", "password"],
      unlock: ["unlock", "open"],
    };

    // Find matching search terms or use the use_case directly
    const useCaseLower = use_case.toLowerCase();
    let searchQuery = use_case;
    
    for (const [key, terms] of Object.entries(searchTerms)) {
      if (useCaseLower.includes(key)) {
        searchQuery = terms[0]!;
        break;
      }
    }

    // Prefer collections based on style
    const styleCollections: Record<string, string[]> = {
      solid: ["mdi", "fa-solid", "material-symbols"],
      outline: ["lucide", "heroicons-outline", "tabler", "ph"],
      any: ["lucide", "mdi", "heroicons", "tabler"],
    };

    const preferredCollections = styleCollections[style] ?? styleCollections.any!;
    
    // Search with preferred collection first
    const params = new URLSearchParams({
      query: searchQuery,
      limit: (limit * 2).toString(), // Get more to filter
    });

    const response = await fetch(`${ICONIFY_API}/search?${params}`);
    
    if (!response.ok) {
      return {
        content: [{ type: "text" as const, text: `Error searching icons: ${response.statusText}` }],
        isError: true,
      };
    }

    const data = (await response.json()) as IconifySearchResult;
    
    // Sort results: preferred collections first
    const sortedIcons = data.icons.sort((a, b) => {
      const prefixA = a.split(":")[0]!;
      const prefixB = b.split(":")[0]!;
      const indexA = preferredCollections.indexOf(prefixA);
      const indexB = preferredCollections.indexOf(prefixB);
      
      if (indexA >= 0 && indexB < 0) return -1;
      if (indexB >= 0 && indexA < 0) return 1;
      if (indexA >= 0 && indexB >= 0) return indexA - indexB;
      return 0;
    }).slice(0, limit);

    const recommendations = sortedIcons.map((icon) => {
      const [prefix] = icon.split(":");
      return `- \`${icon}\` (${prefix})`;
    }).join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `# Icon Recommendations for "${use_case}"

**Search term used:** ${searchQuery}
**Style preference:** ${style}

## Recommended Icons

${recommendations}

Use \`get_icon\` with any of these IDs to get the SVG code.

**Tip:** For consistent styling in your project, stick to one icon collection (e.g., all \`lucide\` or all \`mdi\`).`,
        },
      ],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Better Icons MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
