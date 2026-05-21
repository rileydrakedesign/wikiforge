import * as p from "@clack/prompts";
import type {
  AgentTool,
  WikiForgeConfig,
} from "../config/schema.js";
import { DEFAULT_CONFIG } from "../config/defaults.js";
import { handleCancel } from "./ui.js";

/**
 * Quick start mode — minimal questions, sensible defaults.
 */
export async function runQuickStart(): Promise<WikiForgeConfig> {
  p.log.info("Quick start — just a few questions, sensible defaults for the rest.");

  const projectName = await p.text({
    message: "Project name:",
    placeholder: DEFAULT_CONFIG.project.name,
    defaultValue: DEFAULT_CONFIG.project.name,
  });
  handleCancel(projectName);

  const domain = await p.text({
    message: "Domain / topic:",
    placeholder: 'e.g., "Agentic AI", "Our team playbook", "Renaissance art"',
  });
  handleCancel(domain);

  const agentTool = await p.select({
    message: "Primary LLM agent tool:",
    options: [
      { value: "claude-code" as AgentTool, label: "Claude Code", hint: "recommended" },
      { value: "cursor" as AgentTool, label: "Cursor / Windsurf" },
      { value: "codex" as AgentTool, label: "OpenAI Codex" },
      { value: "generic" as AgentTool, label: "Generic" },
    ],
  });
  handleCancel(agentTool);

  return {
    ...DEFAULT_CONFIG,
    project: {
      ...DEFAULT_CONFIG.project,
      name: String(projectName),
      domain: String(domain),
      description: `A knowledge base for tracking developments in ${String(domain)}`,
      created: new Date().toISOString().split("T")[0],
    },
    agents: {
      ...DEFAULT_CONFIG.agents,
      tool: agentTool as AgentTool,
    },
  };
}
