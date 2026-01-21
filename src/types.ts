export interface McpConfig {
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
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
