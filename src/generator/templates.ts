import path from "node:path";
import type { WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";

const PAGE_TEMPLATES = [
  { file: "entity-page.md", template: "pages/entity-page.md.hbs" },
  { file: "concept-page.md", template: "pages/concept-page.md.hbs" },
  { file: "source-summary.md", template: "pages/source-summary.md.hbs" },
  {
    file: "comparison-table.md",
    template: "pages/comparison-table.md.hbs",
  },
];

/**
 * Generate page template files in .forge/templates/.
 */
export async function generatePageTemplates(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  for (const tmpl of PAGE_TEMPLATES) {
    const content = await renderTemplate(tmpl.template, { config });
    await writeFileWithDirs(
      path.join(rootDir, ".forge", "templates", tmpl.file),
      content,
    );
  }
}

/**
 * Generate initial wiki files (index.md, log.md, overview.md).
 */
export async function generateWikiFiles(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const wikiFiles = [
    { file: "wiki/index.md", template: "wiki/index.md.hbs" },
    { file: "wiki/log.md", template: "wiki/log.md.hbs" },
    { file: "wiki/overview.md", template: "wiki/overview.md.hbs" },
  ];

  for (const wf of wikiFiles) {
    const content = await renderTemplate(wf.template, { config });
    await writeFileWithDirs(path.join(rootDir, wf.file), content);
  }
}
