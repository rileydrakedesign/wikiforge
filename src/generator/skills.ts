import path from "node:path";
import type { WikiForgeConfig, WikiPhase } from "../config/schema.js";
import { renderTemplate } from "../utils/render.js";
import { writeFileWithDirs } from "../utils/fs.js";

export interface SkillDef {
  slug: string;
  name: string;
  description: string;
  phase: WikiPhase;
  workflowTemplate: string;
  condition: (config: WikiForgeConfig) => boolean;
}

const SKILLS: SkillDef[] = [
  // 1-acquisition
  {
    slug: "wforge-ingest-source",
    name: "Ingest Source",
    description: "Ingest a single source into the wiki",
    phase: "1-acquisition",
    workflowTemplate: "skills/workflows/ingest-source.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("ingestion"),
  },
  {
    slug: "wforge-batch-ingest",
    name: "Batch Ingest",
    description: "Process multiple sources in a batch",
    phase: "1-acquisition",
    workflowTemplate: "skills/workflows/batch-ingest.workflow.md.hbs",
    condition: (c) =>
      c.agents.enabled.includes("ingestion") &&
      (c.workflows.ingestion_style === "batch" ||
        c.workflows.ingestion_style === "autonomous"),
  },
  {
    slug: "wforge-web-research",
    name: "Web Research",
    description: "Find new sources via web search to fill knowledge gaps",
    phase: "1-acquisition",
    workflowTemplate: "skills/workflows/web-research.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("research"),
  },

  // 2-compilation
  {
    slug: "wforge-update-entities",
    name: "Update Entities",
    description: "Create or update entity pages from ingested sources",
    phase: "2-compilation",
    workflowTemplate: "skills/workflows/update-entities.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("ingestion"),
  },
  {
    slug: "wforge-update-concepts",
    name: "Update Concepts",
    description: "Create or update concept pages from ingested sources",
    phase: "2-compilation",
    workflowTemplate: "skills/workflows/update-concepts.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("ingestion"),
  },
  {
    slug: "wforge-cross-reference",
    name: "Cross-Reference",
    description: "Build and verify cross-references between wiki pages",
    phase: "2-compilation",
    workflowTemplate: "skills/workflows/cross-reference.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("librarian"),
  },
  {
    slug: "wforge-update-overview",
    name: "Update Overview",
    description: "Refresh wiki/overview.md to reflect current themes, open questions, and synthesis",
    phase: "2-compilation",
    workflowTemplate: "skills/workflows/update-overview.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("ingestion"),
  },
  {
    slug: "wforge-file-answer",
    name: "File Answer",
    description: "Promote a query answer or session synthesis into a permanent wiki page",
    phase: "2-compilation",
    workflowTemplate: "skills/workflows/file-answer.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("query"),
  },

  // 3-analysis
  {
    slug: "wforge-query-wiki",
    name: "Query Wiki",
    description: "Answer questions by searching and synthesizing wiki content",
    phase: "3-analysis",
    workflowTemplate: "skills/workflows/query-wiki.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("query"),
  },
  {
    slug: "wforge-generate-comparison",
    name: "Generate Comparison",
    description: "Build structured comparison tables between entities or concepts",
    phase: "3-analysis",
    workflowTemplate: "skills/workflows/generate-comparison.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("analysis"),
  },
  {
    slug: "wforge-adversarial-review",
    name: "Adversarial Review",
    description: "Challenge wiki claims with evidence-based counter-arguments",
    phase: "3-analysis",
    workflowTemplate: "skills/workflows/adversarial-review.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("debate"),
  },

  // 4-synthesis
  {
    slug: "wforge-compile-output",
    name: "Compile Output",
    description: "Compile wiki content into deliverable documents",
    phase: "4-synthesis",
    workflowTemplate: "skills/workflows/compile-output.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("synthesis"),
  },
  {
    slug: "wforge-generate-slides",
    name: "Generate Slides",
    description: "Create Marp slide decks from wiki content",
    phase: "4-synthesis",
    workflowTemplate: "skills/workflows/generate-slides.workflow.md.hbs",
    condition: (c) =>
      c.agents.enabled.includes("synthesis") &&
      c.workflows.outputs.includes("marp"),
  },
  {
    slug: "wforge-export-report",
    name: "Export Report",
    description: "Export wiki content as a structured PDF or markdown report",
    phase: "4-synthesis",
    workflowTemplate: "skills/workflows/export-report.workflow.md.hbs",
    condition: (c) =>
      c.agents.enabled.includes("synthesis") &&
      c.workflows.outputs.includes("pdf"),
  },
  {
    slug: "wforge-periodic-digest",
    name: "Periodic Digest",
    description: "Produce a wiki-backed digest of what changed over a window (typically weekly)",
    phase: "4-synthesis",
    workflowTemplate: "skills/workflows/periodic-digest.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("synthesis"),
  },

  // maintenance
  {
    slug: "wforge-lint-wiki",
    name: "Lint Wiki",
    description: "Health-check wiki for contradictions, orphans, and stale content",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/lint-wiki.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("lint"),
  },
  {
    slug: "wforge-reindex",
    name: "Reindex",
    description: "Rebuild the wiki index and verify taxonomy",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/reindex.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("librarian"),
  },
  {
    slug: "wforge-stats",
    name: "Stats",
    description: "Generate wiki health statistics and dashboard",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/stats.workflow.md.hbs",
    condition: (c) => c.workflows.tools.includes("stats"),
  },
  {
    slug: "wforge-resolve-contradiction",
    name: "Resolve Contradiction",
    description: "Reconcile a flagged contradiction via annotation, supersession, split, or reconciliation",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/resolve-contradiction.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("lint"),
  },
  {
    slug: "wforge-supersede-claim",
    name: "Supersede Claim",
    description: "Explicitly archive an older page in favor of a newer one and redirect cross-references",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/supersede-claim.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("librarian"),
  },
  {
    slug: "wforge-deduplicate",
    name: "Deduplicate",
    description: "Find and merge duplicate sources and pages using content_hash and title similarity",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/deduplicate.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("librarian"),
  },
  {
    slug: "wforge-decay-and-verify",
    name: "Decay and Verify",
    description: "Re-verify aging claims against current sources and update confidence",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/decay-and-verify.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("lint"),
  },
  {
    slug: "wforge-revise-schema",
    name: "Revise Schema",
    description: "Propose a schema (CLAUDE.md/AGENTS.md/.cursorrules) revision based on observed wiki usage and friction",
    phase: "maintenance",
    workflowTemplate: "skills/workflows/revise-schema.workflow.md.hbs",
    condition: (c) => c.agents.enabled.includes("lint"),
  },
];

/**
 * Get the list of skills enabled by the current config.
 */
export function getEnabledSkills(config: WikiForgeConfig): SkillDef[] {
  return SKILLS.filter((s) => s.condition(config));
}

/**
 * Generate skill directories with SKILL.md + workflow.md for all enabled skills.
 */
export async function generateSkills(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const enabledSkills = getEnabledSkills(config);

  for (const skill of enabledSkills) {
    const skillDir = path.join(
      rootDir,
      ".forge",
      "skills",
      skill.phase,
      skill.slug,
    );

    // Generate SKILL.md (entry point)
    const skillMd = await renderTemplate("skills/SKILL.md.hbs", {
      skill,
      config,
    });
    await writeFileWithDirs(path.join(skillDir, "SKILL.md"), skillMd);

    // Generate workflow.md (actual workflow steps)
    const workflowMd = await renderTemplate(skill.workflowTemplate, {
      skill,
      config,
    });
    await writeFileWithDirs(path.join(skillDir, "workflow.md"), workflowMd);
  }
}
