import { input, select } from "@inquirer/prompts";
import type {
  AgentTool,
  WikiForgeConfig,
} from "../config/schema.js";
import { DEFAULT_CONFIG } from "../config/defaults.js";

/**
 * Quick start mode — minimal questions, sensible defaults.
 */
export async function runQuickStart(): Promise<WikiForgeConfig> {
  const projectName = await input({
    message: "Project name:",
    default: DEFAULT_CONFIG.project.name,
  });

  const domain = await input({
    message: "Research domain/topic:",
  });

  const agentTool = await select<AgentTool>({
    message: "Primary LLM agent tool:",
    choices: [
      { value: "claude-code", name: "Claude Code" },
      { value: "cursor", name: "Cursor / Windsurf" },
      { value: "codex", name: "OpenAI Codex" },
      { value: "generic", name: "Generic" },
    ],
  });

  return {
    ...DEFAULT_CONFIG,
    project: {
      ...DEFAULT_CONFIG.project,
      name: projectName,
      domain,
      description: `A knowledge base for tracking developments in ${domain}`,
      created: new Date().toISOString().split("T")[0],
    },
    agents: {
      ...DEFAULT_CONFIG.agents,
      tool: agentTool,
    },
  };
}
