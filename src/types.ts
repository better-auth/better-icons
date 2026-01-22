export interface McpConfig {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  mcp?: Record<string, {
    type: "local" | "remote";
    command?: string[];
    url?: string;
    enabled?: boolean;
    environment?: Record<string, string>;
    timeout?: number;
  }>;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  configPath: string;
  projectConfigPath: string;
  detected: boolean;
}

export type ConfigScope = "global" | "project";

export interface InstallResult {
  agent: string;
  success: boolean;
  path: string;
  error?: string;
}

export interface IconifySearchResult {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  collections: Record<string, number>;
}

export interface IconifyCollection {
  name: string;
  total: number;
  author?: { name: string; url?: string };
  license?: { title: string; spdx?: string; url?: string };
  samples?: string[];
  height?: number | number[];
  category?: string;
  palette?: boolean;
}
