export interface IconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

export interface IconSet {
  icons?: Record<string, IconData>;
  aliases?: Record<string, { parent: string }>;
  width?: number;
  height?: number;
}

/**
 * Resolve icon alias to the actual icon name.
 * Handles multi-level aliases (A → B → C).
 */
export function resolveIconAlias(iconSet: IconSet, name: string, maxDepth = 10): string {
  let current = name;
  let depth = 0;
  
  while (iconSet.aliases?.[current] && depth < maxDepth) {
    current = iconSet.aliases[current]?.parent ?? current;
    depth++;
  }

  
  return current;
}

// SVG elements that can have fill applied
const SVG_SHAPE_ELEMENTS = ["path", "circle", "rect", "polygon", "polyline", "line", "ellipse"];

/**
 * Add fill color to SVG elements that don't already have fill or stroke.
 * Handles all common SVG shape elements, not just path.
 */
function applyFillToBody(body: string, color: string): string {
  let result = body;
  
  for (const element of SVG_SHAPE_ELEMENTS) {
    // Match opening tags for this element that don't already have fill= or stroke=
    // Use a more precise regex that captures the full opening tag
    const tagRegex = new RegExp(`<${element}(?![^>]*(?:fill=|stroke=))([^>]*?)(/?)>`, "g");
    result = result.replace(tagRegex, `<${element} fill="${color}"$1$2>`);
  }
  
  return result;
}

export function buildSvg(
  iconData: IconData,
  defaults: { width?: number; height?: number },
  options?: { size?: number; color?: string }
): string {
  const width = iconData.width || defaults.width || 24;
  const height = iconData.height || defaults.height || 24;
  const viewBox = `${iconData.left || 0} ${iconData.top || 0} ${width} ${height}`;
  const svgSize = options?.size 
    ? `width="${options.size}" height="${options.size}"` 
    : `width="1em" height="1em"`;
  
  const color = options?.color || "currentColor";
  const body = applyFillToBody(iconData.body, color);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" ${svgSize} viewBox="${viewBox}">${body}</svg>`;
}

/**
 * Extract prefix from icon ID safely
 */
function getIconPrefix(iconId: string): string {
  const prefix = iconId.split(":")[0];
  return prefix ?? "";
}

export function sortByPreferredCollections(
  icons: string[], 
  style: "solid" | "outline" | "any",
  learnedPreferences: string[] = []
): string[] {
  const stylePreferred = style === "solid" 
    ? ["mdi", "fa-solid"] 
    : style === "outline" 
      ? ["lucide", "tabler", "ph"] 
      : ["lucide", "mdi", "heroicons"];
  
  // Learned preferences take priority, then style-based defaults
  const preferred = [...new Set([...learnedPreferences, ...stylePreferred])];
  
  return [...icons].sort((a, b) => {
    const prefixA = getIconPrefix(a);
    const prefixB = getIconPrefix(b);
    const pA = preferred.indexOf(prefixA);
    const pB = preferred.indexOf(prefixB);
    
    // Both in preferred list - sort by preference order
    if (pA >= 0 && pB >= 0) return pA - pB;
    // Only A in preferred list
    if (pA >= 0 && pB < 0) return -1;
    // Only B in preferred list
    if (pB >= 0 && pA < 0) return 1;
    return 0;
  });
}

export function sortByLearnedPreferences(
  icons: string[],
  learnedPreferences: string[]
): string[] {
  if (learnedPreferences.length === 0) return icons;
  
  return [...icons].sort((a, b) => {
    const prefixA = getIconPrefix(a);
    const prefixB = getIconPrefix(b);
    const pA = learnedPreferences.indexOf(prefixA);
    const pB = learnedPreferences.indexOf(prefixB);
    
    // Both in preferred list - sort by preference order
    if (pA >= 0 && pB >= 0) return pA - pB;
    // Only A in preferred list
    if (pA >= 0 && pB < 0) return -1;
    // Only B in preferred list
    if (pB >= 0 && pA < 0) return 1;
    return 0;
  });
}
