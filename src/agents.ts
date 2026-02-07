import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { AgentConfig } from "./types.js";
import { PACKAGE_NAME } from "./constants.js";

/**
 * Get the Claude Code config path.
 * Native installer uses ~/.claude.json, npm version uses ~/.claude/settings.json
 */
function getClaudeCodeConfigPath(home: string): string {
  const nativeConfigPath = join(home, ".claude.json");
  const npmConfigPath = join(home, ".claude", "settings.json");
  
  // Prefer native installer config if it exists
  if (existsSync(nativeConfigPath)) {
    return nativeConfigPath;
  }
  
  return npmConfigPath;
}

/**
 * Check if Claude Code is installed (either native or npm version)
 */
function isClaudeCodeDetected(home: string): boolean {
  return existsSync(join(home, ".claude.json")) || existsSync(join(home, ".claude"));
}

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
      configPath: getClaudeCodeConfigPath(home),
      projectConfigPath: join(cwd, ".mcp.json"),
      detected: isClaudeCodeDetected(home),
    },
    {
      name: "opencode",
      displayName: "OpenCode",
      configPath: join(home, ".config", "opencode", "opencode.json"),
      projectConfigPath: join(cwd, "opencode.json"),
      detected: existsSync(join(home, ".config", "opencode")),
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
    {
      name: "antigravity",
      displayName: "Google Antigravity",
      configPath: join(home, ".gemini", "antigravity", "mcp_config.json"),
      projectConfigPath: join(cwd, "mcp_config.json"),
      detected: existsSync(join(home, ".gemini", "antigravity")),
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
