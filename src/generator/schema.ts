import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";
import { AGENT_META } from "./agents.js";

/** Map agent tool selection to the schema filename */
const SCHEMA_FILES: Record<string, string> = {
  "claude-code": "CLAUDE.md",
  cursor: ".cursorrules",
  codex: "AGENTS.md",
  generic: "CLAUDE.md",
};

/**
 * Generate the primary schema/instruction file (CLAUDE.md, .cursorrules, etc.)
 */
export async function generateSchema(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const filename = SCHEMA_FILES[config.agents.tool] ?? "CLAUDE.md";
  const templateFile = `schema/${config.agents.tool === "generic" ? "claude-code" : config.agents.tool}.md.hbs`;

  const content = await renderTemplate(templateFile, {
    config,
    agentMeta: AGENT_META,
    hasQmd: config.workflows.tools.includes("qmd"),
    hasObsidian: config.workflows.outputs.includes("obsidian"),
    hasMarp: config.workflows.outputs.includes("marp"),
  });

  await writeFileWithDirs(path.join(rootDir, filename), content);

  // If generic, also generate the other schema files
  if (config.agents.tool === "generic") {
    for (const [tool, file] of Object.entries(SCHEMA_FILES)) {
      if (tool === "generic" || tool === "claude-code") continue;
      const tmpl = `schema/${tool}.md.hbs`;
      const out = await renderTemplate(tmpl, {
        config,
        agentMeta: AGENT_META,
      });
      await writeFileWithDirs(path.join(rootDir, file), out);
    }
  }
}
