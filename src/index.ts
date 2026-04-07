#!/usr/bin/env node

import { Command } from "commander";
import { select } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import YAML from "yaml";
import { writeFile } from "node:fs/promises";

import { runQuestionnaire } from "./cli/questionnaire.js";
import { runQuickStart } from "./cli/quick-start.js";
import { loadConfigFromFile } from "./cli/from-config.js";
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
import { initGitRepo, initialCommit } from "./utils/git.js";
import type { WikiForgeConfig } from "./config/schema.js";

const VERSION = "0.1.0";

async function generate(
  config: WikiForgeConfig,
  options: { git?: boolean } = {},
): Promise<void> {
  const rootDir = path.resolve(config.project.name);
  const spinner = ora("Scaffolding repository...").start();

  try {
    // 1. Create directory structure
    spinner.text = "Creating directory structure...";
    await createDirectoryStructure(rootDir, config);
    spinner.succeed("Created directory structure");

    // 2. Generate runtime config (.forge/config.yaml)
    spinner.start("Generating runtime config...");
    await generateRuntimeConfig(rootDir, config);
    spinner.succeed("Generated .forge/config.yaml");

    // 3. Generate schema file (CLAUDE.md etc.)
    spinner.start("Generating schema file...");
    await generateSchema(rootDir, config);
    spinner.succeed(
      `Generated ${config.agents.tool === "cursor" ? ".cursorrules" : config.agents.tool === "codex" ? "AGENTS.md" : "CLAUDE.md"}`,
    );

    // 4. Generate agent SKILL.md directories
    spinner.start("Creating agent personas...");
    await generateAgents(rootDir, config);
    spinner.succeed(
      `Created ${config.agents.enabled.length} agent personas`,
    );

    // 5. Generate skill directories (SKILL.md + workflow.md)
    spinner.start("Setting up skills...");
    await generateSkills(rootDir, config);
    spinner.succeed("Set up skill definitions");

    // 6. Generate core skills (help + party-mode)
    spinner.start("Creating core skills...");
    await generateCoreSkills(rootDir, config);
    spinner.succeed("Created core skills");

    // 7. Generate IDE launchers
    spinner.start("Setting up IDE launchers...");
    await generateLaunchers(rootDir, config);
    spinner.succeed("Created IDE launcher stubs");

    // 8. Generate page templates
    spinner.start("Generating page templates...");
    await generatePageTemplates(rootDir, config);
    spinner.succeed("Generated page templates");

    // 9. Generate initial wiki files
    spinner.start("Creating wiki files...");
    await generateWikiFiles(rootDir, config);
    spinner.succeed("Generated index.md, log.md, and overview.md");

    // 10. Generate helper tools
    spinner.start("Setting up CLI tools...");
    await generateTools(rootDir, config);
    spinner.succeed("Created helper tools");

    // 11. Generate README
    spinner.start("Generating README...");
    await generateReadme(rootDir, config);
    spinner.succeed("Created README.md");

    // 12. Save frozen config
    spinner.start("Saving configuration...");
    const yamlContent = YAML.stringify(config);
    await writeFile(
      path.join(rootDir, "wikiforge.yaml"),
      yamlContent,
      "utf-8",
    );
    spinner.succeed("Saved wikiforge.yaml");

    // 13. Generate manifests (MUST be last — hashes all files)
    spinner.start("Generating manifests...");
    await generateManifests(rootDir, config);
    spinner.succeed("Generated manifests");

    // 14. Git init
    if (options.git !== false) {
      spinner.start("Initializing git repo...");
      await initGitRepo(rootDir);
      await initialCommit(rootDir);
      spinner.succeed("Initialized git repo");
    }

    console.log(
      `\n${chalk.green("Your research agent repository is ready!")}\n`,
    );
    console.log(`   ${chalk.cyan("cd")} ${config.project.name}`);
    console.log(
      `   ${chalk.cyan("claude")}  ${chalk.dim("# or cursor, codex, etc.")}\n`,
    );
    console.log(
      `   Start with: ${chalk.yellow('"Ingest this article: <paste URL or file path>"')}\n`,
    );
  } catch (err) {
    spinner.fail("Failed to scaffold repository");
    throw err;
  }
}

const program = new Command();

program
  .name("wforge")
  .description(
    "Scaffold an LLM-powered research agent repository",
  )
  .version(VERSION);

program
  .command("init")
  .description("Create a new research wiki project")
  .option("-c, --config <path>", "Generate from a YAML config file")
  .option("--preset <name>", "Use a community preset")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--no-git", "Skip git initialization")
  .action(async (opts) => {
    console.log(
      chalk.bold(
        "\n╔══════════════════════════════════════════════════════╗",
      ),
    );
    console.log(
      chalk.bold(
        "║  WikiForge v0.1                                      ║",
      ),
    );
    console.log(
      chalk.bold(
        "║  Scaffold an LLM-powered research agent repository   ║",
      ),
    );
    console.log(
      chalk.bold(
        "╚══════════════════════════════════════════════════════╝\n",
      ),
    );

    let config: WikiForgeConfig;

    if (opts.config) {
      config = await loadConfigFromFile(opts.config);
    } else {
      const mode = await select({
        message: "Select mode:",
        choices: [
          {
            value: "guided",
            name: "🧭 Guided Setup (recommended — full questionnaire)",
          },
          {
            value: "quick",
            name: "⚡ Quick Start (sensible defaults, minimal questions)",
          },
          {
            value: "config",
            name: "📄 From Config (wikiforge.yaml)",
          },
        ],
      });

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
