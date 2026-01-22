import { test, expect, describe } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { getAgentConfigs, getMcpServerConfig } from "./agents.js";

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

  test("claude-code config path is correct", () => {
    const configs = getAgentConfigs();
    const claude = configs.find((c) => c.name === "claude-code");
    
    expect(claude).toBeDefined();
    expect(claude!.configPath).toBe(join(homedir(), ".claude", "settings.json"));
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
