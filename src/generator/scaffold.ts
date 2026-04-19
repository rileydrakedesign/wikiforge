import path from "node:path";
import type { AgentTool, WikiForgeConfig } from "../config/schema.js";
import type { WikiPhase } from "../config/schema.js";
import { ensureDir } from "../utils/fs.js";
import { getEnabledSkills } from "./skills.js";

/** Map agent tool to IDE launcher directory */
const LAUNCHER_DIRS: Record<AgentTool, string> = {
  "claude-code": ".claude/skills",
  cursor: ".cursor/skills",
  codex: ".codex/skills",
  generic: ".claude/skills",
};

/**
 * Create the full directory structure for a research wiki project.
 * BMAD-aligned: agents as directories, skills organized by phase,
 * manifest config, IDE launchers.
 */
export async function createDirectoryStructure(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const dirs: string[] = [
    // Raw source directories (always present)
    "raw/assets",
    // Wiki directories
    "wiki/entities",
    "wiki/concepts",
    "wiki/sources",
    "wiki/comparisons",
    // Outputs
    "outputs",
    "outputs/exports",
    // .forge internals
    ".forge/_config",
    ".forge/templates",
    ".forge/tools",
    // Core skills (always)
    ".forge/core/wforge-help",
  ];

  // Source-type-driven raw subdirectories
  if (config.knowledge.source_types.includes("documents")) {
    dirs.push("raw/documents");
  }
  if (config.knowledge.source_types.includes("articles")) {
    dirs.push("raw/articles");
  }
  if (config.knowledge.source_types.includes("media")) {
    dirs.push("raw/media");
    dirs.push("raw/transcripts");
  }
  if (config.knowledge.source_types.includes("code")) {
    dirs.push("raw/code");
  }
  if (config.knowledge.source_types.includes("data")) {
    dirs.push("raw/data");
  }

  // Conditional output subdirectories
  if (config.workflows.outputs.includes("marp")) {
    dirs.push("outputs/slides");
  }
  if (config.workflows.outputs.includes("pdf")) {
    dirs.push("outputs/reports");
  }

  // Party mode core skill
  if (config.agents.party_mode) {
    dirs.push(".forge/core/wforge-party-mode");
  }

  // Agent directories (one per enabled agent)
  for (const agentType of config.agents.enabled) {
    dirs.push(`.forge/agents/wforge-agent-${agentType}`);
  }

  // Skill directories organized by phase
  const enabledSkills = getEnabledSkills(config);
  const phases = new Set<WikiPhase>();
  for (const skill of enabledSkills) {
    phases.add(skill.phase);
    dirs.push(`.forge/skills/${skill.phase}/${skill.slug}`);
  }

  // IDE launcher directory
  const launcherDir = LAUNCHER_DIRS[config.agents.tool];
  dirs.push(launcherDir);

  for (const dir of dirs) {
    await ensureDir(path.join(rootDir, dir));
  }
}
