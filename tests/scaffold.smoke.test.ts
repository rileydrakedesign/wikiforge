import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { AVAILABLE_PRESETS } from "../src/config/presets.js";
import type { WikiForgeConfig } from "../src/config/schema.js";

import { createDirectoryStructure } from "../src/generator/scaffold.js";
import { generateRuntimeConfig } from "../src/generator/config.js";
import { generateSchema } from "../src/generator/schema.js";
import { generateAgents } from "../src/generator/agents.js";
import { generateSkills } from "../src/generator/skills.js";
import { generateCoreSkills } from "../src/generator/core-skills.js";
import { generateLaunchers } from "../src/generator/launchers.js";
import {
  generatePageTemplates,
  generateWikiFiles,
} from "../src/generator/templates.js";
import { generateTools } from "../src/generator/tools.js";
import { generateReadme } from "../src/generator/readme.js";
import { generateManifests } from "../src/generator/manifests.js";
import { writeFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const PRESETS_DIR = path.join(REPO_ROOT, "presets");

async function scaffoldTo(rootDir: string, config: WikiForgeConfig): Promise<void> {
  await createDirectoryStructure(rootDir, config);
  await generateRuntimeConfig(rootDir, config);
  await generateSchema(rootDir, config);
  await generateAgents(rootDir, config);
  await generateSkills(rootDir, config);
  await generateCoreSkills(rootDir, config);
  await generateLaunchers(rootDir, config);
  await generatePageTemplates(rootDir, config);
  await generateWikiFiles(rootDir, config);
  await generateTools(rootDir, config);
  await generateReadme(rootDir, config);
  await writeFile(
    path.join(rootDir, "wikiforge.yaml"),
    YAML.stringify(config),
    "utf-8",
  );
  await generateManifests(rootDir, config);
}

async function assertNonEmptyFile(filePath: string, label: string): Promise<void> {
  const st = await stat(filePath);
  expect(st.isFile(), `${label} should be a file`).toBe(true);
  expect(st.size, `${label} should be non-empty`).toBeGreaterThan(0);
}

async function assertDir(dirPath: string, label: string): Promise<void> {
  const st = await stat(dirPath);
  expect(st.isDirectory(), `${label} should be a directory`).toBe(true);
}

describe("Scaffold smoke test", () => {
  let workRoot: string;

  beforeAll(async () => {
    workRoot = await mkdtemp(path.join(tmpdir(), "wforge-smoke-"));
  });

  afterAll(async () => {
    if (workRoot) {
      await rm(workRoot, { recursive: true, force: true });
    }
  });

  it("scaffolds DEFAULT_CONFIG without errors and produces the expected skeleton", async () => {
    const rootDir = path.join(workRoot, "default");
    await scaffoldTo(rootDir, DEFAULT_CONFIG);

    // Common artifacts every scaffold produces
    await assertDir(path.join(rootDir, "raw"), "raw/");
    await assertDir(path.join(rootDir, "wiki/entities"), "wiki/entities/");
    await assertDir(path.join(rootDir, "wiki/concepts"), "wiki/concepts/");
    await assertDir(path.join(rootDir, "wiki/sources"), "wiki/sources/");
    await assertDir(path.join(rootDir, "wiki/comparisons"), "wiki/comparisons/");
    await assertDir(path.join(rootDir, ".forge/agents"), ".forge/agents/");
    await assertDir(path.join(rootDir, ".forge/skills"), ".forge/skills/");
    await assertDir(path.join(rootDir, ".forge/_config"), ".forge/_config/");
    await assertDir(path.join(rootDir, ".forge/core/wforge-help"), "help skill dir");

    await assertNonEmptyFile(path.join(rootDir, "CLAUDE.md"), "CLAUDE.md");
    await assertNonEmptyFile(path.join(rootDir, "README.md"), "README.md");
    await assertNonEmptyFile(path.join(rootDir, "wikiforge.yaml"), "wikiforge.yaml");
    await assertNonEmptyFile(
      path.join(rootDir, ".forge/config.yaml"),
      ".forge/config.yaml",
    );
    await assertNonEmptyFile(path.join(rootDir, "wiki/index.md"), "wiki/index.md");
    await assertNonEmptyFile(path.join(rootDir, "wiki/log.md"), "wiki/log.md");
    await assertNonEmptyFile(path.join(rootDir, "wiki/overview.md"), "wiki/overview.md");
  });

  for (const preset of AVAILABLE_PRESETS) {
    it(`scaffolds preset "${preset.name}" (${preset.filename}) without errors`, async () => {
      const rawYaml = await readFile(
        path.join(PRESETS_DIR, preset.filename),
        "utf-8",
      );
      const cfg = YAML.parse(rawYaml) as WikiForgeConfig;
      // Presets ship with empty project.created; tests need a stable value.
      cfg.project.created = cfg.project.created || "2026-05-21";
      // Slug the project name so collisions across iterations don't happen.
      const safeName = preset.filename.replace(/\.yaml$/, "");
      const rootDir = path.join(workRoot, `preset-${safeName}`);

      await scaffoldTo(rootDir, cfg);

      await assertNonEmptyFile(
        path.join(rootDir, "wikiforge.yaml"),
        `${preset.filename}: wikiforge.yaml`,
      );
      await assertNonEmptyFile(
        path.join(rootDir, ".forge/config.yaml"),
        `${preset.filename}: .forge/config.yaml`,
      );

      const schemaName =
        cfg.agents.tool === "cursor"
          ? ".cursorrules"
          : cfg.agents.tool === "codex"
            ? "AGENTS.md"
            : "CLAUDE.md";
      await assertNonEmptyFile(
        path.join(rootDir, schemaName),
        `${preset.filename}: ${schemaName}`,
      );

      // Every enabled agent gets a SKILL.md
      for (const agentType of cfg.agents.enabled) {
        const agentDir = path.join(
          rootDir,
          ".forge/agents",
          `wforge-agent-${agentType}`,
        );
        await assertDir(agentDir, `${preset.filename}: agent ${agentType}`);
        await assertNonEmptyFile(
          path.join(agentDir, "SKILL.md"),
          `${preset.filename}: agent ${agentType} SKILL.md`,
        );
      }
    });
  }
});
