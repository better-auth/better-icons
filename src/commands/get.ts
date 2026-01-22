import chalk from "chalk";
import { ICONIFY_API } from "../constants.js";
import { resolveIconAlias, buildSvg, type IconSet } from "../icon-utils.js";

interface GetOptions {
  color?: string;
  size?: string;
  json?: boolean;
}

export async function getCommand(iconId: string, options: GetOptions): Promise<void> {
  const [prefix, name] = iconId.split(":");
  if (!prefix || !name) {
    console.error(chalk.red("Invalid icon ID. Use 'prefix:name' format (e.g., 'lucide:home')"));
    process.exit(1);
  }

  try {
    const response = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
    if (!response.ok) {
      console.error(chalk.red(`Error: ${response.statusText}`));
      process.exit(1);
    }

    const iconSet = (await response.json()) as IconSet;
    const resolvedName = resolveIconAlias(iconSet, name);
    const iconData = iconSet.icons?.[resolvedName];

    if (!iconData) {
      console.error(chalk.red(`Icon '${iconId}' not found`));
      process.exit(1);
    }

    const size = options.size ? parseInt(options.size, 10) : undefined;
    const svg = buildSvg(iconData, { width: iconSet.width, height: iconSet.height }, { size, color: options.color });
    const width = iconData.width || iconSet.width || 24;
    const height = iconData.height || iconSet.height || 24;

    if (options.json) {
      console.log(JSON.stringify({ id: iconId, svg, width, height }));
      return;
    }

    // Output raw SVG for piping
    console.log(svg);
  } catch (error) {
    console.error(chalk.red(`Failed to get icon: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}
