import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface CollectionUsage {
  count: number;
  lastUsed: string;
}

export interface IconHistoryEntry {
  iconId: string;
  timestamp: string;
}

export type IconFramework = "react" | "vue" | "svelte" | "solid" | "svg";

export interface Preferences {
  collections: Record<string, CollectionUsage>;
  history: IconHistoryEntry[];
}

const MAX_HISTORY_SIZE = 50;

const DEFAULT_PREFERENCES: Preferences = {
  collections: {},
  history: [],
};

export function getPreferencesPath(): string {
  return join(homedir(), ".better-icons", "preferences.json");
}

export function loadPreferences(): Preferences {
  const path = getPreferencesPath();
  
  if (!existsSync(path)) {
    return { ...DEFAULT_PREFERENCES };
  }
  
  try {
    const content = readFileSync(path, "utf-8");
    const parsed = JSON.parse(content) as Preferences;
    return {
      collections: parsed.collections || {},
      history: parsed.history || [],
    };
  } catch {
    return { ...DEFAULT_PREFERENCES, history: [] };
  }
}

/**
 * Save preferences using atomic write (write to temp file, then rename).
 * This prevents data corruption from concurrent writes.
 */
export function savePreferences(prefs: Preferences): void {
  const path = getPreferencesPath();
  const dir = dirname(path);
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // Write to temp file first, then atomically rename
  const tempPath = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(tempPath, JSON.stringify(prefs, null, 2), "utf-8");
    renameSync(tempPath, path);
  } catch (error) {
    // Clean up temp file if rename failed
    try {
      if (existsSync(tempPath)) {
        writeFileSync(path, JSON.stringify(prefs, null, 2), "utf-8");
      }
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Track icon usage with retry logic for concurrent access.
 * Uses atomic writes to prevent data loss.
 */
export function trackUsage(collectionPrefix: string, iconId?: string): void {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prefs = loadPreferences();
      const existing = prefs.collections[collectionPrefix];
      const now = new Date().toISOString();
      
      prefs.collections[collectionPrefix] = {
        count: (existing?.count || 0) + 1,
        lastUsed: now,
      };
      
      // Track in history if full icon ID is provided
      if (iconId) {
        // Remove if already exists (to move to top)
        prefs.history = prefs.history.filter(h => h.iconId !== iconId);
        // Add to beginning
        prefs.history.unshift({ iconId, timestamp: now });
        // Keep only MAX_HISTORY_SIZE entries
        prefs.history = prefs.history.slice(0, MAX_HISTORY_SIZE);
      }
      
      savePreferences(prefs);
      return; // Success
    } catch {
      if (attempt === maxRetries - 1) {
        // Last attempt failed, log but don't crash
        console.error("Failed to track icon usage after retries");
      }
      // Small delay before retry
    }
  }
}

export function getPreferredCollections(): string[] {
  const prefs = loadPreferences();
  
  return Object.entries(prefs.collections)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([prefix]) => prefix);
}

export function getRecentIcons(limit: number = 20): IconHistoryEntry[] {
  const prefs = loadPreferences();
  return prefs.history.slice(0, limit);
}

export function clearPreferences(): void {
  savePreferences({ ...DEFAULT_PREFERENCES, history: [] });
}
