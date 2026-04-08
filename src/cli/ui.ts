import chalk from "chalk";
import * as p from "@clack/prompts";

const VERSION = "0.1.0";

/**
 * Display the WikiForge ASCII art banner and welcome message.
 */
export function showBanner(): void {
  console.log();
  p.intro(chalk.bgCyan.black(" WikiForge "));

  console.log(
    chalk.cyan(`
  ╭─v${VERSION}───────────────────────────────────────────────────╮
  │  ██╗    ██╗██╗██╗  ██╗██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗  │
  │  ██║    ██║██║██║ ██╔╝██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝  │
  │  ██║ █╗ ██║██║█████╔╝ ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗    │
  │  ██║███╗██║██║██╔═██╗ ██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝    │
  │  ╚███╔███╔╝██║██║  ╚██╗██║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗  │
  │   ╚══╝╚══╝ ╚═╝╚═╝   ╚═╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝  │
  │           Scaffold LLM-Powered Research Agents                │
  ╰───────────────────────────────────────────────────────────────╯`),
  );
}

/**
 * Display the welcome info section after the banner.
 */
export function showWelcome(): void {
  p.note(
    `WikiForge generates a fully working LLM Wiki implementation —
directory structure, agent personas, workflows, templates, and tooling —
tailored to your domain and preferences.

Based on Karpathy's LLM Wiki pattern:
  Raw sources  ->  Wiki (LLM-maintained)  ->  Schema (config)

The LLM incrementally builds a persistent, interlinked wiki
instead of re-deriving knowledge per query.`,
    "Welcome to WikiForge",
  );
}

/**
 * Display the generation completion summary.
 */
export function showComplete(projectName: string, agentTool: string): void {
  const toolCmd =
    agentTool === "cursor"
      ? "cursor"
      : agentTool === "codex"
        ? "codex"
        : "claude";

  p.note(
    `${chalk.green("Your research agent repository is ready!")}

  ${chalk.cyan("cd")} ${projectName}
  ${chalk.cyan(toolCmd)}  ${chalk.dim("# or cursor, codex, etc.")}

  Start with:
  ${chalk.yellow('"Ingest this article: <paste URL or file path>"')}`,
    "Next Steps",
  );

  p.outro(chalk.green("Happy researching!"));
}

/**
 * Handle user cancellation from any clack prompt.
 */
export function handleCancel(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
}
