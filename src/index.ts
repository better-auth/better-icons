#!/usr/bin/env node
import { program } from "commander";
import { VERSION } from "./constants.js";
import { setupCommand, configCommand } from "./commands/index.js";
import { runServer } from "./server.js";

program
  .name("better-icons")
  .description("MCP server for searching icons from 200+ libraries")
  .version(VERSION);

program
  .command("setup")
  .description("Configure MCP server for your coding agents")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-a, --agent <agents...>", "Specify agents (cursor, claude-code, opencode, windsurf, vscode)")
  .option("-s, --scope <scope>", "Config scope: global or project (default: global)")
  .action(setupCommand);

program
  .command("config")
  .description("Show manual configuration instructions")
  .action(configCommand);

program
  .command("serve", { hidden: true })
  .description("Run the MCP server")
  .action(runServer);

// Default action: run server (for MCP client calls)
program.action(async () => {
  await runServer();
});

program.parse();
