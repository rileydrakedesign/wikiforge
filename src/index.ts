#!/usr/bin/env node

import { Command } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import path from "node:path";
import YAML from "yaml";
import { writeFile } from "node:fs/promises";

import { runQuestionnaire } from "./cli/questionnaire.js";
import { runQuickStart } from "./cli/quick-start.js";
import { loadConfigFromFile } from "./cli/from-config.js";
import { showBanner, showWelcome, showComplete, handleCancel } from "./cli/ui.js";
import { createDirectoryStructure } from "./generator/scaffold.js";
import { generateSchema } from "./generator/schema.js";
import { generateAgents } from "./generator/agents.js";
import { generateSkills } from "./generator/skills.js";
import { generateRuntimeConfig } from "./generator/config.js";
import { generateCoreSkills } from "./generator/core-skills.js";
import { generateLaunchers } from "./generator/launchers.js";
import {
  generatePageTemplates,
  generateWikiFiles,
} from "./generator/templates.js";
import { generateTools } from "./generator/tools.js";
import { generateReadme } from "./generator/readme.js";
import { generateManifests } from "./generator/manifests.js";
import { generateObsidianConfig } from "./generator/obsidian.js";
import { initGitRepo, initialCommit } from "./utils/git.js";
import type { WikiForgeConfig } from "./config/schema.js";

const VERSION = "0.1.0";

async function generate(
  config: WikiForgeConfig,
  options: { git?: boolean } = {},
): Promise<void> {
  const rootDir = path.resolve(config.project.name);
  const s = p.spinner();

  try {
    // 1. Create directory structure
    s.start("Creating directory structure");
    await createDirectoryStructure(rootDir, config);
    s.stop("Created directory structure");

    // 2. Generate runtime config (.forge/config.yaml)
    s.start("Generating runtime config");
    await generateRuntimeConfig(rootDir, config);
    s.stop("Generated .forge/config.yaml");

    // 3. Generate schema file (CLAUDE.md etc.)
    s.start("Generating schema file");
    await generateSchema(rootDir, config);
    const schemaName =
      config.agents.tool === "cursor"
        ? ".cursorrules"
        : config.agents.tool === "codex"
          ? "AGENTS.md"
          : "CLAUDE.md";
    s.stop(`Generated ${schemaName}`);

    // 4. Generate agent SKILL.md directories
    s.start("Creating agent personas");
    await generateAgents(rootDir, config);
    s.stop(`Created ${config.agents.enabled.length} agent personas`);

    // 5. Generate skill directories (SKILL.md + workflow.md)
    s.start("Setting up skills");
    await generateSkills(rootDir, config);
    s.stop("Set up skill definitions");

    // 6. Generate core skills (help + party-mode)
    s.start("Creating core skills");
    await generateCoreSkills(rootDir, config);
    s.stop("Created core skills");

    // 7. Generate IDE launchers
    s.start("Setting up IDE launchers");
    await generateLaunchers(rootDir, config);
    s.stop("Created IDE launcher stubs");

    // 8. Generate page templates
    s.start("Generating page templates");
    await generatePageTemplates(rootDir, config);
    s.stop("Generated page templates");

    // 9. Generate initial wiki files
    s.start("Creating wiki files");
    await generateWikiFiles(rootDir, config);
    s.stop("Generated index.md, log.md, and overview.md");

    // 10. Generate helper tools
    s.start("Setting up CLI tools");
    await generateTools(rootDir, config);
    s.stop("Created helper tools");

    // 11. Generate README
    s.start("Generating README");
    await generateReadme(rootDir, config);
    s.stop("Created README.md");

    // 11b. Generate .obsidian/ vault config (when obsidian output picked)
    if (config.workflows.outputs.includes("obsidian")) {
      s.start("Generating Obsidian vault config");
      await generateObsidianConfig(rootDir, config);
      s.stop("Created .obsidian/ vault config");
    }

    // 12. Save boot config (regenerable; schema co-evolves at runtime)
    s.start("Saving configuration");
    const yamlContent = YAML.stringify(config);
    await writeFile(
      path.join(rootDir, "wikiforge.yaml"),
      yamlContent,
      "utf-8",
    );
    s.stop("Saved wikiforge.yaml");

    // 13. Generate manifests (MUST be last — hashes all files)
    s.start("Generating manifests");
    await generateManifests(rootDir, config);
    s.stop("Generated manifests");

    // 14. Git init
    if (options.git !== false) {
      s.start("Initializing git repo");
      await initGitRepo(rootDir);
      await initialCommit(rootDir);
      s.stop("Initialized git repo");
    }

    showComplete(config.project.name, config.agents.tool);
  } catch (err) {
    s.stop("Failed to scaffold repository");
    p.log.error(String(err));
    throw err;
  }
}

const program = new Command();

program
  .name("wforge")
  .description(
    "Scaffold an LLM Wiki — a compounding, agent-maintained knowledge base",
  )
  .version(VERSION);

program
  .command("init")
  .description("Create a new LLM Wiki project")
  .option("-c, --config <path>", "Generate from a YAML config file")
  .option("--preset <name>", "Use a community preset")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--no-git", "Skip git initialization")
  .action(async (opts) => {
    showBanner();
    showWelcome();

    let config: WikiForgeConfig;

    if (opts.config) {
      config = await loadConfigFromFile(opts.config);
    } else {
      const mode = await p.select({
        message: "Select setup mode:",
        options: [
          {
            value: "guided",
            label: "Guided Setup",
            hint: "recommended — full questionnaire",
          },
          {
            value: "quick",
            label: "Quick Start",
            hint: "sensible defaults, minimal questions",
          },
          {
            value: "config",
            label: "From Config",
            hint: "load existing wikiforge.yaml",
          },
        ],
      });
      handleCancel(mode);

      if (mode === "guided") {
        config = await runQuestionnaire();
      } else if (mode === "quick") {
        config = await runQuickStart();
      } else {
        const configPath = "wikiforge.yaml";
        config = await loadConfigFromFile(configPath);
      }
    }

    await generate(config, { git: opts.git });
  });

program.parse();
