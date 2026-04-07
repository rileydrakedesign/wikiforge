import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";

/**
 * Generate .forge/config.yaml — runtime config with variables
 * that agents and skills reference during operation.
 */
export async function generateRuntimeConfig(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const content = await renderTemplate("config/config.yaml.hbs", { config });
  await writeFileWithDirs(path.join(rootDir, ".forge", "config.yaml"), content);
}
