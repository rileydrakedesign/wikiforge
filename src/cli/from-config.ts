import { readFile } from "node:fs/promises";
import YAML from "yaml";
import type { WikiForgeConfig } from "../config/schema.js";

/**
 * Load a WikiForge config from a YAML file.
 */
export async function loadConfigFromFile(
  filePath: string,
): Promise<WikiForgeConfig> {
  const raw = await readFile(filePath, "utf-8");
  const config = YAML.parse(raw) as WikiForgeConfig;

  if (!config.version || config.version !== 1) {
    throw new Error(
      `Unsupported config version: ${config.version}. Expected 1.`,
    );
  }

  return config;
}
