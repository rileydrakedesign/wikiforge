import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { DEFAULT_CONFIG } from "../config/defaults.js";
import type { WikiForgeConfig } from "../config/schema.js";

/**
 * Load a WikiForge config from a YAML file. Older configs may be missing
 * fields introduced after they were written; fill those from DEFAULT_CONFIG
 * so the rest of the pipeline can assume the full schema is populated.
 */
export async function loadConfigFromFile(
  filePath: string,
): Promise<WikiForgeConfig> {
  const raw = await readFile(filePath, "utf-8");
  const parsed = YAML.parse(raw) as Partial<WikiForgeConfig>;

  if (!parsed.version || parsed.version !== 1) {
    throw new Error(
      `Unsupported config version: ${parsed.version}. Expected 1.`,
    );
  }

  return {
    ...parsed,
    maturity: { ...DEFAULT_CONFIG.maturity, ...(parsed.maturity ?? {}) },
  } as WikiForgeConfig;
}
