import path from "node:path";
import { chmod } from "node:fs/promises";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";

interface ToolDef {
  file: string;
  template: string;
  condition: (config: WikiForgeConfig) => boolean;
  executable: boolean;
}

const TOOLS: ToolDef[] = [
  {
    file: "search.sh",
    template: "tools/search.sh.hbs",
    condition: (c) => c.workflows.tools.includes("search"),
    executable: true,
  },
  {
    file: "stats.sh",
    template: "tools/stats.sh.hbs",
    condition: (c) => c.workflows.tools.includes("stats"),
    executable: true,
  },
  {
    file: "setup-qmd.sh",
    template: "tools/setup-qmd.sh.hbs",
    condition: (c) => c.workflows.tools.includes("qmd"),
    executable: true,
  },
  {
    file: "pdf-to-md.py",
    template: "tools/pdf-to-md.py.hbs",
    condition: (c) => c.knowledge.source_types.includes("documents"),
    executable: true,
  },
  {
    file: "transcribe.sh",
    template: "tools/transcribe.sh.hbs",
    condition: (c) => c.knowledge.source_types.includes("media"),
    executable: true,
  },
  {
    file: "clip-template.json",
    template: "tools/clip-template.json.hbs",
    condition: (c) => c.knowledge.source_types.includes("articles"),
    executable: false,
  },
];

/**
 * Generate CLI helper tool scripts.
 */
export async function generateTools(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  for (const tool of TOOLS) {
    if (tool.condition(config)) {
      const content = await renderTemplate(tool.template, { config });
      const filePath = path.join(rootDir, ".forge", "tools", tool.file);
      await writeFileWithDirs(filePath, content);
      if (tool.executable) {
        await chmod(filePath, 0o755);
      }
    }
  }
}
