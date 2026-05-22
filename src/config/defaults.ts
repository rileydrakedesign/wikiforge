import type { WikiForgeConfig } from "./schema.js";

export const DEFAULT_CONFIG: WikiForgeConfig = {
  version: 1,
  project: {
    name: "my-wiki",
    domain: "",
    description: "",
    created: new Date().toISOString().split("T")[0],
  },
  knowledge: {
    source_types: ["articles", "documents"],
    organization: "entity-first",
    scale: "small",
  },
  agents: {
    tool: "claude-code",
    enabled: ["ingestion", "query", "lint"],
    party_mode: false,
  },
  workflows: {
    ingestion_style: "deliberate",
    outputs: ["markdown"],
    tools: ["search"],
  },
  wiki: {
    frontmatter: true,
    citation_format: "inline",
    cross_ref_style: "wikilink",
  },
  maturity: {
    research_sources_min: 3,
    review_pages_min: 5,
    synthesis_pages_min: 3,
    decay_threshold_days: 90,
  },
};
