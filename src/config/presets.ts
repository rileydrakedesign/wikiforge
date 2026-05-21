import type { WikiForgeConfig } from "./schema.js";

export interface Preset {
  name: string;
  description: string;
  filename: string;
}

export const AVAILABLE_PRESETS: Preset[] = [
  {
    name: "Academic Research",
    description:
      "Papers, citations, thesis-driven organization with academic citation format",
    filename: "academic-research.yaml",
  },
  {
    name: "Book Companion",
    description:
      "Chapter-by-chapter ingestion with chronological organization",
    filename: "book-companion.yaml",
  },
  {
    name: "Competitive Analysis",
    description:
      "Entity-first organization focused on companies, products, and market analysis",
    filename: "competitive-analysis.yaml",
  },
  {
    name: "Personal Knowledge",
    description:
      "General-purpose wiki with articles, Obsidian-optimized output",
    filename: "personal-knowledge.yaml",
  },
  {
    name: "Autonomous Wiki",
    description:
      "Autonomous mode — agents chain automatically to discover, ingest, cross-reference, and maintain the wiki",
    filename: "autonomous-wiki.yaml",
  },
];
