import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";
import { AGENT_META } from "./agents.js";

/**
 * Generate the project README.md.
 */
export async function generateReadme(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const content = await renderTemplate("readme.md.hbs", {
    config,
    agentMeta: AGENT_META,
  });
  await writeFileWithDirs(path.join(rootDir, "README.md"), content);
}
