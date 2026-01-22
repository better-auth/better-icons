import chalk from "chalk";
import { ICONIFY_API } from "../constants.js";
import type { IconifySearchResult } from "../types.js";

interface SearchOptions {
  prefix?: string;
  limit?: string;
  json?: boolean;
}

export async function searchCommand(query: string, options: SearchOptions): Promise<void> {
  const limit = options.limit ? parseInt(options.limit, 10) : 32;
  const params = new URLSearchParams({ query, limit: limit.toString() });
  if (options.prefix) params.set("prefix", options.prefix);

  try {
    const response = await fetch(`${ICONIFY_API}/search?${params}`);
    if (!response.ok) {
      console.error(chalk.red(`Error: ${response.statusText}`));
      process.exit(1);
    }

    const data = (await response.json()) as IconifySearchResult;

    if (options.json) {
      console.log(JSON.stringify({ icons: data.icons, total: data.total }));
      return;
    }

    console.log(chalk.bold(`Found ${data.total} icons (showing ${data.icons.length}):\n`));
    for (const icon of data.icons) {
      const [prefix, name] = icon.split(":");
      console.log(`  ${chalk.cyan(prefix)}:${chalk.white(name)}`);
    }
    console.log(chalk.dim(`\nUse 'better-icons get <icon-id>' to retrieve SVG`));
  } catch (error) {
    console.error(chalk.red(`Failed to search: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}
