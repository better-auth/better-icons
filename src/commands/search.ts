import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import chalk from "chalk";
import { ICONIFY_API } from "../constants.js";
import { resolveIconAlias, buildSvg, type IconSet } from "../icon-utils.js";
import type { IconifySearchResult } from "../types.js";

interface SearchOptions {
  prefix?: string;
  limit?: string;
  json?: boolean;
  download?: string | boolean;
  color?: string;
  size?: string;
}

export async function searchCommand(
  query: string,
  options: SearchOptions,
): Promise<void> {
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

    if (options.json && !options.download) {
      console.log(JSON.stringify({ icons: data.icons, total: data.total }));
      return;
    }

    if (data.icons.length === 0) {
      console.log(chalk.yellow("No icons found."));
      return;
    }

    if (options.download) {
      await downloadIcons(data.icons, options);
      return;
    }

    console.log(
      chalk.bold(`Found ${data.total} icons (showing ${data.icons.length}):\n`),
    );
    for (const icon of data.icons) {
      const [prefix, name] = icon.split(":");
      if (!prefix || !name) continue;
      const url = `${ICONIFY_API}/${prefix}/${name}.svg?height=48`;
      const link = `\x1b]8;;${url}\x07[→]\x1b]8;;\x07`;
      console.log(`  ${chalk.cyan(prefix)}:${chalk.white(name)} ${link}`);
    }
    console.log(
      chalk.dim(`\nUse -d to download all: better-icons search "${query}" -d`),
    );
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to search: ${error instanceof Error ? error.message : error}`,
      ),
    );
    process.exit(1);
  }
}

async function downloadIcons(
  icons: string[],
  options: SearchOptions,
): Promise<void> {
  const outDir = resolve(
    typeof options.download === "string" ? options.download : "./icons",
  );

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(
    chalk.bold(
      `Downloading ${icons.length} icons to ${chalk.cyan(outDir)}...\n`,
    ),
  );

  const grouped = new Map<string, string[]>();
  for (const icon of icons) {
    const [prefix, name] = icon.split(":");
    if (!prefix || !name) continue;
    if (!grouped.has(prefix)) grouped.set(prefix, []);
    grouped.get(prefix)!.push(name);
  }

  const size = options.size ? parseInt(options.size, 10) : undefined;
  let saved = 0;
  let failed = 0;

  for (const [prefix, names] of grouped) {
    try {
      const url = `${ICONIFY_API}/${prefix}.json?icons=${names.join(",")}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(
          chalk.red(
            `  Failed to fetch ${prefix} collection: ${res.statusText}`,
          ),
        );
        failed += names.length;
        continue;
      }

      const iconSet = (await res.json()) as IconSet;

      for (const name of names) {
        const resolvedName = resolveIconAlias(iconSet, name);
        const iconData = iconSet.icons?.[resolvedName];

        if (!iconData) {
          console.log(`  ${chalk.red("✗")} ${prefix}:${name} (not found)`);
          failed++;
          continue;
        }

        const svg = buildSvg(
          iconData,
          { width: iconSet.width, height: iconSet.height },
          { size, color: options.color },
        );

        const filename = `${prefix}--${name}.svg`;
        writeFileSync(join(outDir, filename), svg);
        console.log(`  ${chalk.green("✓")} ${prefix}:${name}`);
        saved++;
      }
    } catch (err) {
      console.error(
        chalk.red(
          `  Failed to fetch ${prefix}: ${err instanceof Error ? err.message : err}`,
        ),
      );
      failed += names.length;
    }
  }

  console.log(
    `\n${chalk.green(`${saved} saved`)}${failed > 0 ? chalk.red(`, ${failed} failed`) : ""}`,
  );
}
