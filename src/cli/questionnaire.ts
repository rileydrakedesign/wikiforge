import * as p from "@clack/prompts";
import type {
  WikiForgeConfig,
  SourceType,
  WikiOrganization,
  ProjectScale,
  AgentTool,
  AgentType,
  IngestionStyle,
  OutputFormat,
  ToolOption,
} from "../config/schema.js";
import { DEFAULT_CONFIG } from "../config/defaults.js";
import { handleCancel } from "./ui.js";

/**
 * Run the full guided questionnaire and return a complete config.
 */
export async function runQuestionnaire(): Promise<WikiForgeConfig> {
  // ── Phase 1: Project Identity ──────────────────────────────

  p.log.step("Phase 1: Project Identity");

  const projectName = await p.text({
    message: "Project name:",
    placeholder: DEFAULT_CONFIG.project.name,
    defaultValue: DEFAULT_CONFIG.project.name,
  });
  handleCancel(projectName);

  const domain = await p.text({
    message: "Domain / topic:",
    placeholder: 'e.g., "Agentic AI", "Renaissance art", "Our team playbook", "Q4 launches"',
  });
  handleCancel(domain);

  const description = await p.text({
    message: "One-line description:",
    defaultValue: `A knowledge base for tracking developments in ${String(domain)}`,
    placeholder: `A knowledge base for tracking developments in ${String(domain)}`,
  });
  handleCancel(description);

  const initGit = await p.confirm({
    message: "Initialize git repo?",
  });
  handleCancel(initGit);

  // ── Phase 2: Knowledge Architecture ────────────────────────

  p.log.step("Phase 2: Knowledge Architecture");

  const sourceTypes = await p.multiselect({
    message: "Source types you'll be working with:",
    options: [
      {
        value: "documents" as SourceType,
        label: "Documents",
        hint: "PDFs — papers, books, specs, manuals, reports, transcripts",
      },
      {
        value: "articles" as SourceType,
        label: "Articles",
        hint: "web pages, blog posts, online content",
      },
      {
        value: "media" as SourceType,
        label: "Media",
        hint: "podcasts, videos, meeting recordings ��� anything needing transcription",
      },
      {
        value: "code" as SourceType,
        label: "Code",
        hint: "repositories, codebases, source code",
      },
      {
        value: "data" as SourceType,
        label: "Data",
        hint: "CSV, JSON, spreadsheets, structured datasets",
      },
    ],
    initialValues: ["articles" as SourceType, "documents" as SourceType],
  });
  handleCancel(sourceTypes);

  const organization = await p.select({
    message: "Wiki organization style:",
    options: [
      {
        value: "entity-first" as WikiOrganization,
        label: "Entity-first",
        hint: "people, orgs, concepts get their own pages",
      },
      {
        value: "topic-first" as WikiOrganization,
        label: "Topic-first",
        hint: "broad topics with sub-sections",
      },
      {
        value: "chronological" as WikiOrganization,
        label: "Chronological",
        hint: "timeline-driven, date-indexed",
      },
      {
        value: "thesis-driven" as WikiOrganization,
        label: "Thesis-driven",
        hint: "claims, evidence, counter-evidence",
      },
      {
        value: "custom" as WikiOrganization,
        label: "Custom",
        hint: "define your own categories later",
      },
    ],
  });
  handleCancel(organization);

  const scale = await p.select({
    message: "Expected scale:",
    options: [
      {
        value: "small" as ProjectScale,
        label: "Small",
        hint: "< 50 sources, personal project",
      },
      {
        value: "medium" as ProjectScale,
        label: "Medium",
        hint: "50-200 sources, sustained effort",
      },
      {
        value: "large" as ProjectScale,
        label: "Large",
        hint: "200+ sources, long-running wiki",
      },
    ],
  });
  handleCancel(scale);

  // ── Phase 3: Agent Configuration ───────────────────────────

  p.log.step("Phase 3: Agent Configuration");

  const agentTool = await p.select({
    message: "Primary LLM agent tool:",
    options: [
      {
        value: "claude-code" as AgentTool,
        label: "Claude Code",
        hint: "generates CLAUDE.md",
      },
      {
        value: "cursor" as AgentTool,
        label: "Cursor / Windsurf",
        hint: "generates .cursorrules",
      },
      {
        value: "codex" as AgentTool,
        label: "OpenAI Codex",
        hint: "generates AGENTS.md",
      },
      {
        value: "generic" as AgentTool,
        label: "Generic",
        hint: "generates all schema files",
      },
    ],
  });
  handleCancel(agentTool);

  const agents = await p.multiselect({
    message: "Agents to include:",
    options: [
      {
        value: "ingestion" as AgentType,
        label: "Ingestion Agent (Iris)",
        hint: "reads sources, updates wiki",
      },
      {
        value: "query" as AgentType,
        label: "Query Agent (Quinn)",
        hint: "answers questions from wiki",
      },
      {
        value: "lint" as AgentType,
        label: "Lint Agent (Linus)",
        hint: "health-checks wiki consistency",
      },
      {
        value: "research" as AgentType,
        label: "Research Agent (Rex)",
        hint: "finds new sources via web search",
      },
      {
        value: "analysis" as AgentType,
        label: "Analysis Agent (Axel)",
        hint: "generates comparisons, charts, tables",
      },
      {
        value: "debate" as AgentType,
        label: "Debate Agent (Diana)",
        hint: "adversarial review of wiki claims",
      },
      {
        value: "synthesis" as AgentType,
        label: "Synthesis Agent (Sophie)",
        hint: "creates output artifacts",
      },
      {
        value: "librarian" as AgentType,
        label: "Librarian Agent (Leo)",
        hint: "manages index, taxonomy",
      },
    ],
    initialValues: ["ingestion" as AgentType, "query" as AgentType, "lint" as AgentType],
  });
  handleCancel(agents);

  const partyMode = await p.confirm({
    message:
      "Enable Party Mode? (multiple agents collaborate in one session)",
  });
  handleCancel(partyMode);

  // ── Phase 4: Workflow Preferences ──────────────────────────

  p.log.step("Phase 4: Workflow Preferences");

  const ingestionStyle = await p.select({
    message: "Ingestion workflow:",
    options: [
      {
        value: "deliberate" as IngestionStyle,
        label: "Deliberate",
        hint: "one source at a time, human-in-the-loop review",
      },
      {
        value: "batch" as IngestionStyle,
        label: "Batch",
        hint: "process multiple sources, review after",
      },
      {
        value: "autonomous" as IngestionStyle,
        label: "Autonomous",
        hint: "full ingest cycle — discover, ingest, cross-reference, lint, report",
      },
    ],
  });
  handleCancel(ingestionStyle);

  const outputs = await p.multiselect({
    message: "Output formats to support:",
    options: [
      { value: "markdown" as OutputFormat, label: "Markdown pages" },
      { value: "marp" as OutputFormat, label: "Marp slide decks" },
      { value: "matplotlib" as OutputFormat, label: "Matplotlib/chart generation" },
      { value: "pdf" as OutputFormat, label: "PDF reports" },
      {
        value: "obsidian" as OutputFormat,
        label: "Obsidian-optimized",
        hint: "wiki links, graph view, dataview",
      },
    ],
    initialValues: ["markdown" as OutputFormat],
  });
  handleCancel(outputs);

  const tools = await p.multiselect({
    message: "Include CLI helper tools?",
    options: [
      {
        value: "search" as ToolOption,
        label: "Search script",
        hint: "grep/ripgrep based wiki search",
      },
      {
        value: "qmd" as ToolOption,
        label: "qmd integration",
        hint: "hybrid BM25/vector search",
      },
      {
        value: "ingest" as ToolOption,
        label: "Ingest script",
        hint: "batch file processor",
      },
      {
        value: "stats" as ToolOption,
        label: "Stats script",
        hint: "wiki health dashboard",
      },
      {
        value: "graph" as ToolOption,
        label: "Graph visualization",
        hint: "interactive wiki graph (graph.html)",
      },
      {
        value: "watch" as ToolOption,
        label: "Raw watcher",
        hint: "auto-ingest when files land in raw/",
      },
      {
        value: "diff" as ToolOption,
        label: "Wiki diff",
        hint: "summarize wiki changes since last ingest",
      },
    ],
    initialValues: ["search" as ToolOption],
    required: false,
  });
  handleCancel(tools);

  const config: WikiForgeConfig = {
    version: 1,
    project: {
      name: String(projectName),
      domain: String(domain),
      description: String(description),
      created: new Date().toISOString().split("T")[0],
    },
    knowledge: {
      source_types: sourceTypes as SourceType[],
      organization: organization as WikiOrganization,
      scale: scale as ProjectScale,
    },
    agents: {
      tool: agentTool as AgentTool,
      enabled: agents as AgentType[],
      party_mode: partyMode as boolean,
    },
    workflows: {
      ingestion_style: ingestionStyle as IngestionStyle,
      outputs: outputs as OutputFormat[],
      tools: tools as ToolOption[],
    },
    wiki: {
      frontmatter: true,
      citation_format: "inline",
      cross_ref_style: (outputs as OutputFormat[]).includes("obsidian")
        ? "wikilink"
        : "markdown-link",
    },
    maturity: { ...DEFAULT_CONFIG.maturity },
  };

  return { ...config, _initGit: initGit as boolean } as WikiForgeConfig & {
    _initGit: boolean;
  };
}
