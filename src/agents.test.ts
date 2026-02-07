import { test, expect, describe } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { getAgentConfigs, getMcpServerConfig, getOpenCodeMcpConfig } from "./agents.js";

describe("getAgentConfigs", () => {
  test("returns array of agent configs", () => {
    const configs = getAgentConfigs();
    expect(Array.isArray(configs)).toBe(true);
    expect(configs.length).toBeGreaterThan(0);
  });

  test("includes expected agents", () => {
    const configs = getAgentConfigs();
    const names = configs.map((c) => c.name);
    
    expect(names).toContain("cursor");
    expect(names).toContain("claude-code");
    expect(names).toContain("windsurf");
    expect(names).toContain("vscode");
    expect(names).toContain("opencode");
    expect(names).toContain("antigravity");
  });

  test("each config has required properties", () => {
    const configs = getAgentConfigs();
    
    for (const config of configs) {
      expect(config).toHaveProperty("name");
      expect(config).toHaveProperty("displayName");
      expect(config).toHaveProperty("configPath");
      expect(config).toHaveProperty("projectConfigPath");
      expect(config).toHaveProperty("detected");
      expect(typeof config.name).toBe("string");
      expect(typeof config.displayName).toBe("string");
      expect(typeof config.configPath).toBe("string");
      expect(typeof config.projectConfigPath).toBe("string");
      expect(typeof config.detected).toBe("boolean");
    }
  });

  test("cursor config path is correct", () => {
    const configs = getAgentConfigs();
    const cursor = configs.find((c) => c.name === "cursor");
    
    expect(cursor).toBeDefined();
    expect(cursor!.configPath).toBe(join(homedir(), ".cursor", "mcp.json"));
  });

  test("claude-code config path is valid", () => {
    const configs = getAgentConfigs();
    const claude = configs.find((c) => c.name === "claude-code");
    const home = homedir();
    
    expect(claude).toBeDefined();
    // Config path should be either ~/.claude.json (native) or ~/.claude/settings.json (npm)
    const validPaths = [
      join(home, ".claude.json"),
      join(home, ".claude", "settings.json"),
    ];
    expect(validPaths).toContain(claude!.configPath);
  });

  test("opencode config path is correct", () => {
    const configs = getAgentConfigs();
    const opencode = configs.find((c) => c.name === "opencode");
    
    expect(opencode).toBeDefined();
    expect(opencode!.configPath).toBe(join(homedir(), ".config", "opencode", "opencode.json"));
  });
});

describe("getMcpServerConfig", () => {
  test("returns correct server config structure", () => {
    const config = getMcpServerConfig();
    
    expect(config).toHaveProperty("better-icons");
    expect(config["better-icons"]).toHaveProperty("command");
    expect(config["better-icons"]).toHaveProperty("args");
  });

  test("uses npx command", () => {
    const config = getMcpServerConfig();
    
    expect(config["better-icons"].command).toBe("npx");
  });

  test("includes -y flag and package name in args", () => {
    const config = getMcpServerConfig();
    
    expect(config["better-icons"].args).toContain("-y");
    expect(config["better-icons"].args).toContain("better-icons");
  });
});

describe("getOpenCodeMcpConfig", () => {
  test("returns correct server config structure", () => {
    const config = getOpenCodeMcpConfig();
    
    expect(config).toHaveProperty("better-icons");
    expect(config["better-icons"]).toHaveProperty("type");
    expect(config["better-icons"]).toHaveProperty("command");
    expect(config["better-icons"]).toHaveProperty("enabled");
  });

  test("uses local type", () => {
    const config = getOpenCodeMcpConfig();
    
    expect(config["better-icons"].type).toBe("local");
  });

  test("is enabled by default", () => {
    const config = getOpenCodeMcpConfig();
    
    expect(config["better-icons"].enabled).toBe(true);
  });

  test("command is an array with npx, -y flag and package name", () => {
    const config = getOpenCodeMcpConfig();
    
    expect(Array.isArray(config["better-icons"].command)).toBe(true);
    expect(config["better-icons"].command).toContain("npx");
    expect(config["better-icons"].command).toContain("-y");
    expect(config["better-icons"].command).toContain("better-icons");
  });

  test("command array has correct order", () => {
    const config = getOpenCodeMcpConfig();
    
    expect(config["better-icons"].command[0]).toBe("npx");
    expect(config["better-icons"].command[1]).toBe("-y");
    expect(config["better-icons"].command[2]).toBe("better-icons");
  });
});
