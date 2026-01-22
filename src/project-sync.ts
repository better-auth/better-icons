import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename } from "node:path";
import type { IconFramework } from "./memory.js";

export interface IconComponent {
  name: string;
  iconId: string;
  svg: string;
}

/**
 * Convert icon ID to a valid component/export name
 * e.g., "lucide:arrow-right" → "ArrowRightIcon"
 */
export function iconIdToComponentName(iconId: string): string {
  const [, name] = iconId.split(":");
  if (!name) return "Icon";
  
  // Convert kebab-case to PascalCase and add Icon suffix
  const pascalCase = name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  
  return pascalCase + "Icon";
}

/**
 * Generate component code based on framework
 */
export function generateIconComponent(
  componentName: string,
  svg: string,
  iconId: string,
  framework: IconFramework
): string {
  // Clean up SVG - remove XML declaration if present
  const cleanSvg = svg.replace(/<\?xml[^>]*\?>/g, "").trim();
  
  switch (framework) {
    case "react":
      return generateReactComponent(componentName, cleanSvg, iconId);
    case "vue":
      return generateVueComponent(componentName, cleanSvg, iconId);
    case "svelte":
      return generateSvelteComponent(componentName, cleanSvg, iconId);
    case "solid":
      return generateSolidComponent(componentName, cleanSvg, iconId);
    case "svg":
    default:
      return generateSvgExport(componentName, cleanSvg, iconId);
  }
}

function generateReactComponent(name: string, svg: string, iconId: string): string {
  // Convert SVG attributes to React-compatible (class → className, etc.)
  const reactSvg = svg
    .replace(/class=/g, "className=")
    .replace(/clip-path=/g, "clipPath=")
    .replace(/fill-rule=/g, "fillRule=")
    .replace(/stroke-width=/g, "strokeWidth=")
    .replace(/stroke-linecap=/g, "strokeLinecap=")
    .replace(/stroke-linejoin=/g, "strokeLinejoin=");
  
  return `// ${iconId}
export const ${name} = (props: React.SVGProps<SVGSVGElement>) => (
  ${reactSvg.replace("<svg", "<svg {...props}")}
);`;
}

function generateVueComponent(name: string, svg: string, iconId: string): string {
  // Escape backticks in SVG content for template literal
  const escapedSvg = svg.replace(/`/g, "\\`").replace("<svg", '<svg v-bind="$attrs"');
  return `// ${iconId}
export const ${name} = {
  name: "${name}",
  inheritAttrs: false,
  template: \`${escapedSvg}\`,
};`;
}

/**
 * Generate Svelte-compatible icon export.
 * Since Svelte components need separate .svelte files, we export the SVG as a string
 * that can be used with {@html} directive, or as a simple functional approach.
 */
function generateSvelteComponent(name: string, svg: string, iconId: string): string {
  // For Svelte, export the raw SVG string - can be used with {@html IconName}
  // Also provide a props-accepting version that replaces class
  const escapedSvg = svg.replace(/`/g, "\\`");
  return `// ${iconId}
// Use with: {@html ${name}} or {@html ${name}WithClass("my-class")}
export const ${name} = \`${escapedSvg}\`;
export const ${name}WithClass = (className: string) => \`${escapedSvg.replace("<svg", '<svg class="' + '${className}"')}\`;`;
}

function generateSolidComponent(name: string, svg: string, iconId: string): string {
  return `// ${iconId}
export const ${name} = (props: JSX.IntrinsicElements["svg"]) => (
  ${svg.replace("<svg", "<svg {...props}")}
);`;
}

function generateSvgExport(name: string, svg: string, iconId: string): string {
  return `// ${iconId}
export const ${name} = \`${svg}\`;`;
}

/**
 * Parse an existing icons file to extract icon names and IDs
 */
export function parseExistingIcons(filePath: string): Map<string, string> {
  const icons = new Map<string, string>();
  
  if (!existsSync(filePath)) {
    return icons;
  }
  
  try {
    const content = readFileSync(filePath, "utf-8");
    
    // Match patterns like "// lucide:home" or "// mdi:account" followed by export
    // More flexible: allows multiple newlines/whitespace between comment and export
    // Icon ID pattern: prefix can have letters/numbers/hyphens, name can have letters/numbers/hyphens/dots
    const iconPattern = /\/\/\s*([\w-]+:[\w\d.-]+)\s*\n\s*(?:\/\/[^\n]*\n\s*)*export\s+(?:const|function)\s+(\w+)/g;
    let match;
    
    while ((match = iconPattern.exec(content)) !== null) {
      const iconId = match[1];
      const componentName = match[2];
      if (iconId && componentName) {
        icons.set(iconId, componentName);
      }
    }
    
    // Also match Vue-style comments (for .vue files)
    const vuePattern = /<!--\s*([\w-]+:[\w\d.-]+)\s*-->/g;
    while ((match = vuePattern.exec(content)) !== null) {
      const iconId = match[1];
      if (!iconId) continue;
      
      // Try to find the export name after it
      const afterComment = content.slice(match.index);
      const exportMatch = afterComment.match(/export\s+(?:const|function)\s+(\w+)/);
      if (exportMatch?.[1]) {
        icons.set(iconId, exportMatch[1]);
      }
    }
  } catch {
    // File read error, return empty map
  }
  
  return icons;
}

/**
 * Get the file header based on framework
 */
export function getFileHeader(framework: IconFramework): string {
  switch (framework) {
    case "react":
      return `// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

import type React from "react";

`;
    case "solid":
      return `// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

import type { JSX } from "solid-js";

`;
    case "vue":
      return `// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

`;
    case "svelte":
      return `// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons
// Usage: {@html IconName} or {@html IconNameWithClass("my-class")}

`;
    case "svg":
    default:
      return `// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

`;
  }
}

/**
 * Add an icon to the icons file
 * Returns the component name used
 */
export function addIconToFile(
  filePath: string,
  iconId: string,
  svg: string,
  framework: IconFramework,
  customName?: string
): { componentName: string; alreadyExists: boolean; existingName?: string } {
  const existingIcons = parseExistingIcons(filePath);
  
  // Check if icon already exists
  if (existingIcons.has(iconId)) {
    return {
      componentName: existingIcons.get(iconId)!,
      alreadyExists: true,
      existingName: existingIcons.get(iconId),
    };
  }
  
  const componentName = customName || iconIdToComponentName(iconId);
  const componentCode = generateIconComponent(componentName, svg, iconId, framework);
  
  // Ensure directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // Read existing content or create new file
  let content = "";
  if (existsSync(filePath)) {
    content = readFileSync(filePath, "utf-8");
  } else {
    content = getFileHeader(framework);
  }
  
  // Append the new icon
  content = content.trimEnd() + "\n\n" + componentCode + "\n";
  
  writeFileSync(filePath, content, "utf-8");
  
  return { componentName, alreadyExists: false };
}

/**
 * Get the import statement for an icon
 */
export function getImportStatement(
  filePath: string,
  componentName: string,
  framework: IconFramework
): string {
  // Get relative path hint (user will need to adjust based on their project structure)
  const fileName = basename(filePath).replace(/\.[^.]+$/, "");
  
  switch (framework) {
    case "svelte":
      // Svelte icons are exported as strings, use named import
      return `import { ${componentName} } from './${fileName}';`;
    case "vue":
      return `import { ${componentName} } from './${fileName}';`;
    default:
      return `import { ${componentName} } from './${fileName}';`;
  }
}
