/**
 * WikiForge configuration schema.
 * Defines the shape of wikiforge.yaml and the internal config object
 * produced by the CLI questionnaire.
 */

export type SourceType =
  | "documents"
  | "articles"
  | "media"
  | "code"
  | "data";

export type WikiOrganization =
  | "entity-first"
  | "topic-first"
  | "chronological"
  | "thesis-driven"
  | "custom";

export type ProjectScale = "small" | "medium" | "large";

export type AgentTool = "claude-code" | "cursor" | "codex" | "generic";

export type AgentType =
  | "ingestion"
  | "query"
  | "lint"
  | "research"
  | "debate"
  | "synthesis"
  | "librarian"
  | "analysis";

export type IngestionStyle = "deliberate" | "batch" | "autonomous";

export type OutputFormat =
  | "markdown"
  | "marp"
  | "matplotlib"
  | "pdf"
  | "obsidian";

export type ToolOption =
  | "search"
  | "qmd"
  | "ingest"
  | "stats"
  | "graph"
  | "watch"
  | "diff";

export type CitationFormat = "inline" | "footnote" | "academic";

export type CrossRefStyle = "wikilink" | "markdown-link";

export type WikiPhase =
  | "1-acquisition"
  | "2-compilation"
  | "3-analysis"
  | "4-synthesis"
  | "maintenance";

export interface ProjectConfig {
  name: string;
  domain: string;
  description: string;
  created: string;
}

export interface KnowledgeConfig {
  source_types: SourceType[];
  organization: WikiOrganization;
  scale: ProjectScale;
}

export interface AgentsConfig {
  tool: AgentTool;
  enabled: AgentType[];
  party_mode: boolean;
}

export interface WorkflowsConfig {
  ingestion_style: IngestionStyle;
  outputs: OutputFormat[];
  tools: ToolOption[];
}

export interface WikiConfig {
  frontmatter: boolean;
  citation_format: CitationFormat;
  cross_ref_style: CrossRefStyle;
}

/**
 * Wiki-state maturity thresholds. These tune when autonomous-mode agents
 * are allowed to act without confirmation. They are wiki properties (a function
 * of how much knowledge has accumulated), not workflow knobs.
 */
export interface MaturityConfig {
  /** Min ingested sources before Rex may autonomously identify gaps and fetch. */
  research_sources_min: number;
  /** Min entity/concept pages before Diana may autonomously review claims. */
  review_pages_min: number;
  /** Min wiki pages contributing to a query before Quinn auto-files synthesis. */
  synthesis_pages_min: number;
}

export interface WikiForgeConfig {
  version: 1;
  project: ProjectConfig;
  knowledge: KnowledgeConfig;
  agents: AgentsConfig;
  workflows: WorkflowsConfig;
  wiki: WikiConfig;
  maturity: MaturityConfig;
}
