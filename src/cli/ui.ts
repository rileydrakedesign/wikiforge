import chalk from "chalk";
import * as p from "@clack/prompts";

const VERSION = "0.1.0";

/**
 * Display the WikiForge ASCII art banner and welcome message.
 */
export function showBanner(): void {
  console.log();
  p.intro(chalk.bgCyan.black(" WikiForge "));

  // Banner is laid out at exactly 72 columns per line so the border, the
  // ASCII art rows, and the tagline align in any monospace renderer. If you
  // change VERSION's length, regenerate the top-border dash count: total = 72
  // and `╭─v{VERSION}` consumes 2 + VERSION.length chars before the dashes.
  console.log(
    chalk.cyan(`
  ╭─v${VERSION}───────────────────────────────────────────────────────────────╮
  │  ██╗    ██╗██╗██╗  ██╗██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗  │
  │  ██║    ██║██║██║ ██╔╝██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝  │
  │  ██║ █╗ ██║██║█████╔╝ ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗    │
  │  ██║███╗██║██║██╔═██╗ ██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝    │
  │  ╚███╔███╔╝██║██║  ██╗██║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗  │
  │   ╚══╝╚══╝ ╚═╝╚═╝  ╚═╝╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝  │
  │                  Scaffold an LLM Wiki, ready to run                  │
  ╰──────────────────────────────────────────────────────────────────────╯`),
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
    `${chalk.green("Your LLM Wiki is ready!")}

  ${chalk.cyan("cd")} ${projectName}
  ${chalk.cyan(toolCmd)}  ${chalk.dim("# or cursor, codex, etc.")}

  Start with:
  ${chalk.yellow('"Ingest this source: <paste URL or file path>"')}`,
    "Next Steps",
  );

  p.outro(chalk.green("Happy compounding!"));
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
