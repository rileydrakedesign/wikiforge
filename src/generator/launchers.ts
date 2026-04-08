import path from "node:path";
import type { AgentTool, WikiForgeConfig } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";
import { AGENT_META } from "./agents.js";
import { getEnabledSkills } from "./skills.js";

const LAUNCHER_DIRS: Record<AgentTool, string> = {
  "claude-code": ".claude/skills",
  cursor: ".cursor/skills",
  codex: ".codex/skills",
  generic: ".claude/skills",
};

/**
 * Generate IDE launcher stubs matching BMAD's directory format:
 * .claude/skills/{skill-name}/SKILL.md
 *
 * Each launcher is a thin SKILL.md that instructs the LLM to load
 * the full agent/skill definition from .forge/.
 */
export async function generateLaunchers(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const launcherDir = LAUNCHER_DIRS[config.agents.tool];

  // Agent launchers
  for (const agentType of config.agents.enabled) {
    const meta = AGENT_META[agentType];
    const content = await renderTemplate("launchers/agent-launcher.md.hbs", {
      agent: meta,
      config,
    });
    await writeFileWithDirs(
      path.join(rootDir, launcherDir, meta.slug, "SKILL.md"),
      content,
    );
  }

  // Skill launchers
  const enabledSkills = getEnabledSkills(config);
  for (const skill of enabledSkills) {
    const content = await renderTemplate("launchers/skill-launcher.md.hbs", {
      skill,
      config,
    });
    await writeFileWithDirs(
      path.join(rootDir, launcherDir, skill.slug, "SKILL.md"),
      content,
    );
  }

  // Core skill launchers — wforge-help
  const helpContent = await renderTemplate("launchers/skill-launcher.md.hbs", {
    skill: {
      slug: "wforge-help",
      name: "WikiForge Help",
      description:
        "Navigate the wiki system — see available agents, skills, and recommended next actions",
      phase: "core",
    },
    config,
  });
  await writeFileWithDirs(
    path.join(rootDir, launcherDir, "wforge-help", "SKILL.md"),
    helpContent,
  );

  // Core skill launchers — wforge-party-mode
  if (config.agents.party_mode) {
    const partyContent = await renderTemplate(
      "launchers/skill-launcher.md.hbs",
      {
        skill: {
          slug: "wforge-party-mode",
          name: "Party Mode",
          description:
            "Multi-agent roundtable — spawn multiple agents for collaborative analysis",
          phase: "core",
        },
        config,
      },
    );
    await writeFileWithDirs(
      path.join(rootDir, launcherDir, "wforge-party-mode", "SKILL.md"),
      partyContent,
    );
  }
}
