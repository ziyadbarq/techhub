/**
 * Seed Presets Manager
 *
 * Handles loading, saving, and managing user-defined seed presets.
 */

import fs from "fs/promises";
import path from "path";
import type { SeedModule } from "./seed-dependencies";
import { BUILTIN_PRESETS, type SeedPreset } from "./seed-dependencies";

const PRESETS_FILE = path.join(__dirname, "seed-presets.json");

interface PresetsFile {
  presets: SeedPreset[];
}

/**
 * Load all presets (built-in + user-defined)
 */
export async function loadAllPresets(): Promise<SeedPreset[]> {
  const userPresets = await loadUserPresets();
  return [...BUILTIN_PRESETS, ...userPresets];
}

/**
 * Load user-defined presets from file
 */
export async function loadUserPresets(): Promise<SeedPreset[]> {
  try {
    const content = await fs.readFile(PRESETS_FILE, "utf-8");
    const data: PresetsFile = JSON.parse(content);
    return data.presets || [];
  } catch (_error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Save a new user preset
 */
export async function savePreset(
  name: string,
  description: string,
  modules: SeedModule[],
): Promise<void> {
  // Check if name conflicts with built-in preset
  if (BUILTIN_PRESETS.some((p) => p.name === name)) {
    throw new Error(
      `Cannot override built-in preset '${name}'. Please choose a different name.`,
    );
  }

  const userPresets = await loadUserPresets();

  // Check if preset already exists
  const existingIndex = userPresets.findIndex((p) => p.name === name);

  const newPreset: SeedPreset = { name, description, modules };

  if (existingIndex >= 0) {
    // Update existing preset
    userPresets[existingIndex] = newPreset;
  } else {
    // Add new preset
    userPresets.push(newPreset);
  }

  // Write back to file
  const data: PresetsFile = { presets: userPresets };
  await fs.writeFile(PRESETS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Delete a user preset
 */
export async function deletePreset(name: string): Promise<void> {
  // Cannot delete built-in presets
  if (BUILTIN_PRESETS.some((p) => p.name === name)) {
    throw new Error(`Cannot delete built-in preset '${name}'`);
  }

  const userPresets = await loadUserPresets();
  const filtered = userPresets.filter((p) => p.name !== name);

  if (filtered.length === userPresets.length) {
    throw new Error(`Preset '${name}' not found`);
  }

  const data: PresetsFile = { presets: filtered };
  await fs.writeFile(PRESETS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Get a preset by name (checks both built-in and user-defined)
 */
export async function getPreset(name: string): Promise<SeedPreset | null> {
  // Check built-in presets first
  const builtIn = BUILTIN_PRESETS.find((p) => p.name === name);
  if (builtIn) return builtIn;

  // Check user presets
  const userPresets = await loadUserPresets();
  return userPresets.find((p) => p.name === name) || null;
}

/**
 * List all preset names (for autocomplete/suggestions)
 */
export async function listPresetNames(): Promise<string[]> {
  const allPresets = await loadAllPresets();
  return allPresets.map((p) => p.name);
}

/**
 * Check if a preset name is valid (not empty, no special chars)
 */
export function isValidPresetName(name: string): boolean {
  return /^[a-z0-9-_]+$/i.test(name) && name.length > 0 && name.length <= 50;
}
