import {
  input,
  select,
  checkbox,
  confirm,
} from "@inquirer/prompts";
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

/**
 * Run the full guided questionnaire and return a complete config.
 */
export async function runQuestionnaire(): Promise<WikiForgeConfig> {
  // Phase 1: Project Identity
  const projectName = await input({
    message: "Project name:",
    default: DEFAULT_CONFIG.project.name,
  });

  const domain = await input({
    message: "Research domain/topic:",
    default: 'e.g., "Agentic AI Systems", "Renaissance Art"',
  });

  const description = await input({
    message: "One-line description:",
    default: `A knowledge base for tracking developments in ${domain}`,
  });

  const initGit = await confirm({
    message: "Initialize git repo?",
    default: true,
  });

  // Phase 2: Knowledge Architecture
  const sourceTypes = await checkbox<SourceType>({
    message: "Source types you'll be working with:",
    choices: [
      { value: "articles", name: "Articles & blog posts", checked: true },
      { value: "papers", name: "Academic papers (PDF)", checked: true },
      { value: "books", name: "Books / book chapters" },
      { value: "podcasts", name: "Podcasts / audio transcripts" },
      { value: "videos", name: "Video transcripts (YouTube, lectures)" },
      { value: "code_repos", name: "Code repositories" },
      { value: "data_files", name: "Data files (CSV, JSON)" },
      { value: "images", name: "Images / diagrams" },
      { value: "meeting_notes", name: "Meeting notes / transcripts" },
      { value: "social_media", name: "Social media threads" },
    ],
  });

  const organization = await select<WikiOrganization>({
    message: "Wiki organization style:",
    choices: [
      {
        value: "entity-first",
        name: "Entity-first (people, orgs, concepts get their own pages)",
      },
      {
        value: "topic-first",
        name: "Topic-first (broad topics with sub-sections)",
      },
      {
        value: "chronological",
        name: "Chronological (timeline-driven, date-indexed)",
      },
      {
        value: "thesis-driven",
        name: "Thesis-driven (claims, evidence, counter-evidence)",
      },
      { value: "custom", name: "Custom (define your own categories later)" },
    ],
  });

  const scale = await select<ProjectScale>({
    message: "Expected scale:",
    choices: [
      { value: "small", name: "Small (< 50 sources, personal project)" },
      { value: "medium", name: "Medium (50-200 sources, serious research)" },
      { value: "large", name: "Large (200+ sources, long-running project)" },
    ],
  });

  // Phase 3: Agent Configuration
  const agentTool = await select<AgentTool>({
    message: "Primary LLM agent tool:",
    choices: [
      { value: "claude-code", name: "Claude Code (generates CLAUDE.md)" },
      { value: "cursor", name: "Cursor / Windsurf (generates .cursorrules)" },
      { value: "codex", name: "OpenAI Codex (generates AGENTS.md)" },
      { value: "generic", name: "Generic (generates all schema files)" },
    ],
  });

  const agents = await checkbox<AgentType>({
    message: "Research agents to include:",
    choices: [
      {
        value: "ingestion",
        name: "Ingestion Agent — reads sources, updates wiki",
        checked: true,
      },
      {
        value: "query",
        name: "Query Agent — answers questions from wiki",
        checked: true,
      },
      {
        value: "lint",
        name: "Lint Agent — health-checks wiki consistency",
        checked: true,
      },
      {
        value: "research",
        name: "Research Agent — finds new sources via web search",
      },
      {
        value: "analysis",
        name: "Analysis Agent — generates comparisons, charts, tables",
      },
      {
        value: "debate",
        name: "Debate Agent — adversarial review of wiki claims",
      },
      {
        value: "synthesis",
        name: "Synthesis Agent — creates output artifacts",
      },
      {
        value: "librarian",
        name: "Librarian Agent — manages index, taxonomy",
      },
    ],
  });

  const partyMode = await confirm({
    message: "Enable Party Mode? (multiple agents collaborate in one session)",
    default: false,
  });

  // Phase 4: Workflow Preferences
  const ingestionStyle = await select<IngestionStyle>({
    message: "Ingestion workflow:",
    choices: [
      {
        value: "deliberate",
        name: "Deliberate (one source at a time, human-in-the-loop review)",
      },
      {
        value: "batch",
        name: "Batch (process multiple sources, review after)",
      },
      {
        value: "autonomous",
        name: "Autonomous (ingest and update with minimal supervision)",
      },
    ],
  });

  const outputs = await checkbox<OutputFormat>({
    message: "Output formats to support:",
    choices: [
      { value: "markdown", name: "Markdown pages", checked: true },
      { value: "marp", name: "Marp slide decks" },
      { value: "matplotlib", name: "Matplotlib/chart generation" },
      { value: "pdf", name: "PDF reports" },
      {
        value: "obsidian",
        name: "Obsidian-optimized (wiki links, graph view, dataview)",
      },
    ],
  });

  const tools = await checkbox<ToolOption>({
    message: "Include CLI helper tools?",
    choices: [
      {
        value: "search",
        name: "Search script (grep/ripgrep based wiki search)",
        checked: true,
      },
      { value: "qmd", name: "qmd integration (hybrid BM25/vector search)" },
      { value: "ingest", name: "Ingest script (batch file processor)" },
      { value: "stats", name: "Stats script (wiki health dashboard)" },
    ],
  });

  const config: WikiForgeConfig = {
    version: 1,
    project: {
      name: projectName,
      domain,
      description,
      created: new Date().toISOString().split("T")[0],
    },
    knowledge: {
      source_types: sourceTypes,
      organization,
      scale,
    },
    agents: {
      tool: agentTool,
      enabled: agents,
      party_mode: partyMode,
    },
    workflows: {
      ingestion_style: ingestionStyle,
      outputs,
      tools,
    },
    wiki: {
      frontmatter: true,
      citation_format: "inline",
      cross_ref_style: outputs.includes("obsidian")
        ? "wikilink"
        : "markdown-link",
    },
  };

  return { ...config, _initGit: initGit } as WikiForgeConfig & {
    _initGit: boolean;
  };
}
