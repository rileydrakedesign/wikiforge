import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";

interface ObsidianFile {
  /** Path inside .obsidian/, e.g. "app.json" or "themes/foo.css". */
  outPath: string;
  /** Template path inside templates/. */
  template: string;
}

const OBSIDIAN_FILES: ObsidianFile[] = [
  { outPath: "app.json", template: "obsidian/app.json.hbs" },
  { outPath: "graph.json", template: "obsidian/graph.json.hbs" },
  { outPath: "hotkeys.json", template: "obsidian/hotkeys.json.hbs" },
  {
    outPath: "community-plugins.json",
    template: "obsidian/community-plugins.json.hbs",
  },
  { outPath: "core-plugins.json", template: "obsidian/core-plugins.json.hbs" },
];

/**
 * Generate an opt-in .obsidian/ vault config for the scaffolded wiki.
 *
 * Karpathy's LLM Wiki gist treats Obsidian as the canonical browser for the
 * wiki: "Obsidian is the IDE; the LLM is the programmer; the wiki is the
 * codebase." This makes that experience first-class by default when the user
 * picked Obsidian as an output format.
 *
 * The shipped defaults are intentionally minimal — link format, attachment
 * folder pointed at `raw/assets/` (per the gist), graph view color-coded by
 * wiki subdirectory, and a sensible set of core plugins enabled. Everything
 * else is the user's call.
 */
export async function generateObsidianConfig(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  if (!config.workflows.outputs.includes("obsidian")) return;

  const obsidianDir = path.join(rootDir, ".obsidian");
  for (const file of OBSIDIAN_FILES) {
    const content = await renderTemplate(file.template, { config });
    await writeFileWithDirs(path.join(obsidianDir, file.outPath), content);
  }
}
