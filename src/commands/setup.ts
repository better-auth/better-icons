import { existsSync } from "node:fs";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { getAgentConfigs, getMcpServerConfig, getOpenCodeMcpConfig } from "../agents.js";
import { shortenPath, readJsonFile, writeJsonFile } from "../utils.js";
import type { AgentConfig, InstallResult, ConfigScope } from "../types.js";

const LOGO = `
  ${chalk.bold.white("██████╗ ███████╗████████╗████████╗███████╗██████╗ ")}
  ${chalk.bold.white("██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗")}
  ${chalk.bold.white("██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝ ")}
  ${chalk.bold.white("██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗")}
  ${chalk.bold.white("██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║")}
  ${chalk.bold.white("╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝")}

  ${chalk.bold.white("██╗ ██████╗ ██████╗ ███╗   ██╗███████╗")}
  ${chalk.bold.white("██║██╔════╝██╔═══██╗████╗  ██║██╔════╝")}
  ${chalk.bold.white("██║██║     ██║   ██║██╔██╗ ██║███████╗")}
  ${chalk.bold.white("██║██║     ██║   ██║██║╚██╗██║╚════██║")}
  ${chalk.bold.white("██║╚██████╗╚██████╔╝██║ ╚████║███████║")}
  ${chalk.bold.white("╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝")}

  ${chalk.dim("200,000+ icons from 150+ icon libraries")}
`;

interface SetupOptions {
  yes?: boolean;
  agent?: string[];
  scope?: ConfigScope;
}

export async function setupCommand(options: SetupOptions) {
  console.log(LOGO);
  p.intro(chalk.bgCyan.black(" setup "));

  const agents = getAgentConfigs();
  const detectedAgents = agents.filter((a) => a.detected);

  // Scope selection
  let scope: ConfigScope;

  if (options.scope) {
    if (options.scope !== "global" && options.scope !== "project") {
      p.log.error(`Invalid scope: ${options.scope}`);
      p.log.info("Valid scopes: global, project");
      process.exit(1);
    }
    scope = options.scope;
  } else if (options.yes) {
    scope = "global";
  } else {
    const selectedScope = await p.select({
      message: "Select configuration scope",
      options: [
        { value: "global", label: "Global", hint: "Available in all projects" },
        { value: "project", label: "Project", hint: "Only for current project" },
      ],
    });

    if (p.isCancel(selectedScope)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }

    scope = selectedScope as ConfigScope;
  }

  // Agent selection
  let targetAgents: AgentConfig[];

  if (options.agent && options.agent.length > 0) {
    const validNames = agents.map((a) => a.name);
    const invalid = options.agent.filter((a) => !validNames.includes(a));
    
    if (invalid.length > 0) {
      p.log.error(`Invalid agents: ${invalid.join(", ")}`);
      p.log.info(`Valid agents: ${validNames.join(", ")}`);
      process.exit(1);
    }

    if (scope === "project" && options.agent.includes("antigravity")) {
      p.log.error("MCP servers in Antigravity can only be added globally");
      p.log.info("Use -s global or remove the -a antigravity flag");
      process.exit(1);
    }
    
    targetAgents = agents.filter((a) => options.agent!.includes(a.name));
  } else if (options.yes) {
    // For project scope with -y, only select first detected agent
    if (scope === "project") {
      const firstAgent = detectedAgents[0] || agents[0];
      targetAgents = firstAgent ? [firstAgent] : [];
    } else {
      targetAgents = detectedAgents.length > 0 ? detectedAgents : agents;
    }
    p.log.info(`Installing to: ${targetAgents.map((a) => chalk.cyan(a.displayName)).join(", ")}`);
  } else {
    const agentChoices = agents.map((a) => ({
      value: a.name,
      label: a.displayName,
      hint: a.detected ? chalk.green("detected") : chalk.dim("not detected"),
    }));

    // For project scope, only pre-select first detected agent
    const initialValues = scope === "project"
      ? (detectedAgents[0] ? [detectedAgents[0].name] : [agents[0]?.name].filter(Boolean))
      : detectedAgents.map((a) => a.name);

    // For project scope, do not give Google Antigravity as an option
    const agentOptions = scope === "project"
      ? (agentChoices.filter((a) => a.value != "antigravity"))
      : agentChoices;

    const selected = await p.multiselect({
      message: "Select agents to configure",
      options: agentOptions,
      initialValues,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }

    targetAgents = agents.filter((a) => (selected as string[]).includes(a.name));
  }

  if (targetAgents.length === 0) {
    p.log.warn("No agents selected");
    p.outro(chalk.yellow("Setup cancelled"));
    process.exit(0);
  }

  // Get config path based on scope
  const getConfigPath = (agent: AgentConfig) => 
    scope === "project" ? agent.projectConfigPath : agent.configPath;

  // Installation summary
  const summaryLines = targetAgents.map((a) => {
    const configPath = getConfigPath(a);
    const shortPath = shortenPath(configPath);
    const exists = existsSync(configPath);
    const status = exists ? chalk.yellow("(will update)") : chalk.green("(will create)");
    return `  ${chalk.cyan(a.displayName)} → ${chalk.dim(shortPath)} ${status}`;
  });

  const scopeLabel = scope === "project" ? "Project" : "Global";
  p.note(summaryLines.join("\n"), `Installation Summary (${scopeLabel})`);

  // Confirmation
  if (!options.yes) {
    const confirmed = await p.confirm({
      message: "Proceed with installation?",
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
  }

  // Install
  const spinner = p.spinner();
  spinner.start("Configuring MCP server...");

  const results: InstallResult[] = [];
  const serverConfig = getMcpServerConfig();
  const openCodeConfig = getOpenCodeMcpConfig();

  for (const agent of targetAgents) {
    const configPath = getConfigPath(agent);
    try {
      const config = readJsonFile(configPath);
      
      if (agent.name === "opencode") {
        config.mcp = { ...config.mcp, ...openCodeConfig };
      } else {
        config.mcpServers = { ...config.mcpServers, ...serverConfig };
      }
      
      writeJsonFile(configPath, config);
      results.push({ agent: agent.displayName, success: true, path: configPath });
    } catch (error) {
      results.push({
        agent: agent.displayName,
        success: false,
        path: configPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  spinner.stop("Configuration complete");

  // Results
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    const resultLines = successful.map((r) => 
      `  ${chalk.green("✓")} ${r.agent} → ${chalk.dim(shortenPath(r.path))}`
    );
    p.note(resultLines.join("\n"), chalk.green(`Configured ${successful.length} agent(s)`));
  }

  if (failed.length > 0) {
    p.log.error(chalk.red(`Failed to configure ${failed.length} agent(s)`));
    for (const r of failed) {
      p.log.message(`  ${chalk.red("✗")} ${r.agent}: ${chalk.dim(r.error)}`);
    }
  }

  p.note(
    `${chalk.dim("Try asking your AI:")}\n  ${chalk.cyan('"Search for arrow icons"')}\n  ${chalk.cyan('"Get the SVG for lucide:home"')}`,
    "Next Steps"
  );

  p.outro(chalk.green("Restart your editor to load the MCP server"));
}
