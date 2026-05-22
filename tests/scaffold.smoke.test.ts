import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

import { DEFAULT_CONFIG } from "../src/config/defaults.js";
import { AVAILABLE_PRESETS } from "../src/config/presets.js";
import { loadConfigFromFile } from "../src/cli/from-config.js";
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
import { generateObsidianConfig } from "../src/generator/obsidian.js";
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
  await generateObsidianConfig(rootDir, config);
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
      // Go through the actual loader so missing fields (e.g. maturity in
      // older preset files) get backfilled from DEFAULT_CONFIG the same way
      // the production CLI does it.
      const cfg = await loadConfigFromFile(
        path.join(PRESETS_DIR, preset.filename),
      );
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

      // .obsidian/ vault config when obsidian output is selected
      if (cfg.workflows.outputs.includes("obsidian")) {
        await assertNonEmptyFile(
          path.join(rootDir, ".obsidian/app.json"),
          `${preset.filename}: .obsidian/app.json`,
        );
        await assertNonEmptyFile(
          path.join(rootDir, ".obsidian/graph.json"),
          `${preset.filename}: .obsidian/graph.json`,
        );
        await assertNonEmptyFile(
          path.join(rootDir, ".obsidian/core-plugins.json"),
          `${preset.filename}: .obsidian/core-plugins.json`,
        );
      }
    });
  }
});

describe("Cohesion invariants (REMAINING-WORK.md gaps 1-5)", () => {
  // Single shared scaffold: every agent enabled, autonomous style, marp output,
  // so every lifecycle-aware workflow gets rendered and can be asserted on.
  const cfg: WikiForgeConfig = {
    ...DEFAULT_CONFIG,
    project: {
      ...DEFAULT_CONFIG.project,
      name: "cohesion-fixture",
      created: "2026-05-21",
    },
    knowledge: {
      ...DEFAULT_CONFIG.knowledge,
      source_types: ["articles", "documents", "media"],
    },
    agents: {
      ...DEFAULT_CONFIG.agents,
      enabled: [
        "ingestion",
        "query",
        "lint",
        "research",
        "debate",
        "synthesis",
        "librarian",
        "analysis",
      ],
    },
    workflows: {
      ...DEFAULT_CONFIG.workflows,
      ingestion_style: "autonomous",
      outputs: ["markdown", "marp", "pdf"],
    },
  };

  let rootDir: string;
  let workRoot: string;

  beforeAll(async () => {
    workRoot = await mkdtemp(path.join(tmpdir(), "wforge-cohesion-"));
    rootDir = path.join(workRoot, "fixture");
    await scaffoldTo(rootDir, cfg);
  });

  afterAll(async () => {
    if (workRoot) {
      await rm(workRoot, { recursive: true, force: true });
    }
  });

  // Gap 1: ingest workflow must not emit stale frontmatter that lint will
  // then auto-normalize on every cycle.
  it("ingest-source workflow does not emit `status: processed` or `confidence: high`", async () => {
    const workflow = await readFile(
      path.join(
        rootDir,
        ".forge/skills/1-acquisition/wforge-ingest-source/workflow.md",
      ),
      "utf-8",
    );
    expect(workflow).not.toContain("status: processed");
    expect(workflow).not.toContain("confidence: high");
  });

  // Gap 2: every analysis/synthesis workflow must filter superseded/archived
  // pages so downstream deliverables don't silently include them.
  const lifecycleFilteredWorkflows: Array<{ phase: string; slug: string }> = [
    { phase: "3-analysis", slug: "wforge-generate-comparison" },
    { phase: "3-analysis", slug: "wforge-adversarial-review" },
    { phase: "4-synthesis", slug: "wforge-compile-output" },
    { phase: "4-synthesis", slug: "wforge-export-report" },
    { phase: "4-synthesis", slug: "wforge-generate-slides" },
  ];

  for (const { phase, slug } of lifecycleFilteredWorkflows) {
    it(`${slug} workflow applies the lifecycle filter`, async () => {
      const workflow = await readFile(
        path.join(rootDir, ".forge/skills", phase, slug, "workflow.md"),
        "utf-8",
      );
      expect(workflow).toContain("Apply lifecycle filter to wiki sources");
      expect(workflow).toContain("status: superseded");
      expect(workflow).toContain("status: archived");
    });
  }

  // Gap 3: persona text must not contradict the agent's own principles.
  it("lint SKILL.md persona acknowledges the auto-fix posture", async () => {
    const skillMd = await readFile(
      path.join(rootDir, ".forge/agents/wforge-agent-lint/SKILL.md"),
      "utf-8",
    );
    expect(skillMd.toLowerCase()).toContain("audit");
    // accept "auto-fix", "auto-fixes", or "fixes" as evidence of posture
    expect(skillMd).toMatch(/auto-?fix|fixes/i);
  });

  it("research SKILL.md persona uses 'provenance', not 'credibility'", async () => {
    const skillMd = await readFile(
      path.join(rootDir, ".forge/agents/wforge-agent-research/SKILL.md"),
      "utf-8",
    );
    expect(skillMd).toContain("provenance");
    // The persona one-liner is what changed; the agent's principles already
    // use "provenance" consistently, so the whole SKILL.md should be clean.
    expect(skillMd).not.toContain("credibility");
  });

  // Gap 5: autonomous web-research chain must reach the lifecycle skills.
  it("web-research autonomous chain extends to decay-and-verify and deduplicate", async () => {
    const workflow = await readFile(
      path.join(
        rootDir,
        ".forge/skills/1-acquisition/wforge-web-research/workflow.md",
      ),
      "utf-8",
    );
    expect(workflow).toContain("wforge-decay-and-verify");
    expect(workflow).toContain("wforge-deduplicate");
    expect(workflow).toContain("(decay-and-verify if aged)");
    expect(workflow).toContain("(deduplicate if needed)");
  });

  // Step 0: the new config knob must reach the rendered config.yaml.
  it("rendered .forge/config.yaml exposes decay_threshold_days under maturity", async () => {
    const yaml = await readFile(
      path.join(rootDir, ".forge/config.yaml"),
      "utf-8",
    );
    expect(yaml).toMatch(/decay_threshold_days:\s*\d+/);
  });

  // Step 6: schema doc must list the full lifecycle status vocab including stub.
  it("CLAUDE.md lifecycle status vocab includes 'stub'", async () => {
    const claudeMd = await readFile(path.join(rootDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toMatch(/`current`.*`superseded`.*`archived`.*`stub`/s);
  });
});
