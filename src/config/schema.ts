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

export type ToolOption = "search" | "qmd" | "ingest" | "stats";

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

export interface WikiForgeConfig {
  version: 1;
  project: ProjectConfig;
  knowledge: KnowledgeConfig;
  agents: AgentsConfig;
  workflows: WorkflowsConfig;
  wiki: WikiConfig;
}
