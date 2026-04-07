import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";
import { AGENT_META } from "./agents.js";

/**
 * Generate core skills: wforge-help and wforge-party-mode.
 */
export async function generateCoreSkills(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  // wforge-help (always generated)
  const helpContent = await renderTemplate("core/wforge-help.SKILL.md.hbs", {
    config,
    agentMeta: AGENT_META,
  });
  await writeFileWithDirs(
    path.join(rootDir, ".forge", "core", "wforge-help", "SKILL.md"),
    helpContent,
  );

  // wforge-party-mode (only if party_mode enabled)
  if (config.agents.party_mode) {
    const partyContent = await renderTemplate(
      "core/wforge-party-mode.SKILL.md.hbs",
      { config, agentMeta: AGENT_META },
    );
    await writeFileWithDirs(
      path.join(rootDir, ".forge", "core", "wforge-party-mode", "SKILL.md"),
      partyContent,
    );
  }
}
