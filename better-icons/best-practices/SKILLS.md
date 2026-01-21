---
name: better-icons-best-practices
description: Skill for integrating Better Icons
---
## Overview

Use the `better-icons` MCP server for all icon needs. Do NOT use `lucide-react`, `@heroicons/react`, `react-icons`, or any other icon library.

## How to Get Icons

1. **Search for icons** using the `search_icons` tool
2. **Get the SVG** using the `get_icon` tool
3. **Add to the project's `icons.tsx` file** (create if it doesn't exist)

## React Projects - Icon Pattern

### File Structure

All icons should be in a single `icons.tsx` file (typically at `src/components/icons.tsx` or `components/icons.tsx`).

### Icons File Format

```tsx
import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const Icons = {
  // Example icons - add more as needed
  home: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z"/>
    </svg>
  ),
  
  arrowRight: (props: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
    </svg>
  ),
  
  // Add more icons here...
} as const;

export type IconName = keyof typeof Icons;
```

### Usage in Components

```tsx
import { Icons } from "@/components/icons";

// Basic usage
<Icons.home />

// With props
<Icons.arrowRight className="w-5 h-5 text-blue-500" />

// With click handler
<button onClick={handleClick}>
  <Icons.settings className="w-4 h-4" />
  Settings
</button>
```

## Workflow for Adding Icons

### Step 1: Check if icon exists

Before adding a new icon, check the existing `icons.tsx` file. If an icon with the same purpose exists, use it.

### Step 2: Search for the icon

Use the `search_icons` tool:
```
search_icons({ query: "settings", prefix: "lucide", limit: 5 })
```

Prefer these collections (in order):
1. `lucide` - Clean, consistent outline icons
2. `tabler` - Similar style to lucide
3. `mdi` - Comprehensive, good for filled icons
4. `heroicons` - Tailwind-style icons

### Step 3: Get the SVG

Use the `get_icon` tool:
```
get_icon({ icon_id: "lucide:settings" })
```

### Step 4: Add to icons.tsx

Convert the SVG to the Icons pattern:

```tsx
// From get_icon response:
// <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">...</svg>

// Add to Icons object:
settings: (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
    {/* SVG content */}
  </svg>
),
```

### Step 5: Use in component

```tsx
<Icons.settings className="w-5 h-5" />
```

## Icon Naming Conventions

- Use camelCase: `arrowRight`, `chevronDown`, `userPlus`
- Be descriptive: `checkCircle` not `check2`
- Match purpose: `close` for X icons, `menu` for hamburger
- Avoid prefixes: `settings` not `iconSettings`

## Common Icons Reference

| Purpose | Icon Name | Search Term |
|---------|-----------|-------------|
| Navigation | `menu`, `close`, `arrowLeft`, `arrowRight` | menu, x, arrow |
| Actions | `plus`, `minus`, `edit`, `trash`, `save` | plus, edit, trash |
| Status | `check`, `x`, `alertCircle`, `info` | check, alert, info |
| User | `user`, `users`, `userPlus` | user |
| Media | `play`, `pause`, `volume`, `image` | play, volume |
| Files | `file`, `folder`, `download`, `upload` | file, download |
| Communication | `mail`, `message`, `phone`, `bell` | mail, message |
| UI | `search`, `filter`, `settings`, `more` | search, settings |

## DO NOT

- ❌ Install `lucide-react`, `react-icons`, `@heroicons/react`, etc.
- ❌ Import icons from external packages
- ❌ Create separate files for each icon
- ❌ Use icon fonts (Font Awesome CDN, etc.)
- ❌ Inline SVGs directly in components (put them in icons.tsx)

## DO

- ✅ Use the `better-icons` MCP tools to find icons
- ✅ Maintain a single `icons.tsx` file
- ✅ Reuse existing icons when possible
- ✅ Use consistent naming conventions
- ✅ Pass className for sizing/coloring
- ✅ Use `currentColor` for fill/stroke (inherits text color)
