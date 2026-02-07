#!/usr/bin/env node
import { program } from "commander";
import { VERSION } from "./constants.js";
import { setupCommand, configCommand, searchCommand, getCommand } from "./commands/index.js";
import { runServer } from "./server.js";

program
  .name("better-icons")
  .description("MCP server for searching icons from 200+ libraries")
  .version(VERSION);

program
  .command("setup")
  .description("Configure MCP server for your coding agents")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-a, --agent <agents...>", "Specify agents (cursor, claude-code, opencode, windsurf, vscode, antigravity)")
  .option("-s, --scope <scope>", "Config scope: global or project (default: global)")
  .action(setupCommand);

program
  .command("config")
  .description("Show manual configuration instructions")
  .action(configCommand);

program
  .command("search <query>")
  .description("Search for icons across 200+ libraries")
  .option("-p, --prefix <prefix>", "Filter by collection prefix (e.g., lucide, mdi)")
  .option("-l, --limit <number>", "Max results (default: 32)")
  .option("--json", "Output as JSON for scripting")
  .action(searchCommand);

program
  .command("get <icon-id>")
  .description("Get a single icon SVG (outputs to stdout)")
  .option("-c, --color <color>", "Icon color (e.g., '#ff0000', 'currentColor')")
  .option("-s, --size <pixels>", "Icon size in pixels")
  .option("--json", "Output as JSON with metadata")
  .action(getCommand);

program
  .command("serve", { hidden: true })
  .description("Run the MCP server")
  .action(runServer);

// Default action: run server (for MCP client calls)
program.action(async () => {
  await runServer();
});

program.parse();
