import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AgentConfig } from "./types.js";
import { PACKAGE_NAME } from "./constants.js";

export function getAgentConfigs(): AgentConfig[] {
  const home = homedir();
  const cwd = process.cwd();

  return [
    {
      name: "cursor",
      displayName: "Cursor",
      configPath: join(home, ".cursor", "mcp.json"),
      projectConfigPath: join(cwd, ".cursor", "mcp.json"),
      detected: existsSync(join(home, ".cursor")),
    },
    {
      name: "claude-code",
      displayName: "Claude Code",
      configPath: join(home, ".claude", "settings.json"),
      projectConfigPath: join(cwd, ".mcp.json"),
      detected: existsSync(join(home, ".claude")),
    },
    {
      name: "opencode",
      displayName: "OpenCode",
      configPath: join(home, ".opencode", "mcp.json"),
      projectConfigPath: join(cwd, "opencode.json"),
      detected: existsSync(join(home, ".opencode")),
    },
    {
      name: "windsurf",
      displayName: "Windsurf",
      configPath: join(home, ".windsurf", "mcp.json"),
      projectConfigPath: join(cwd, ".windsurf", "mcp.json"),
      detected: existsSync(join(home, ".windsurf")),
    },
    {
      name: "vscode",
      displayName: "VS Code (Copilot)",
      configPath: join(home, ".vscode", "mcp.json"),
      projectConfigPath: join(cwd, ".vscode", "mcp.json"),
      detected: existsSync(join(home, ".vscode")),
    },
  ];
}

export function getMcpServerConfig() {
  return {
    "better-icons": {
      command: "npx",
      args: ["-y", PACKAGE_NAME],
    },
  };
}

export function getOpenCodeMcpConfig() {
  return {
    "better-icons": {
      type: "local" as const,
      command: ["npx", "-y", PACKAGE_NAME],
      enabled: true,
    },
  };
}
