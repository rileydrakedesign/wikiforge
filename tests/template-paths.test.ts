import { describe, expect, it } from "vitest";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const TEMPLATES_DIR = path.join(REPO_ROOT, "templates");

async function exists(relPath: string): Promise<boolean> {
  try {
    await access(path.join(TEMPLATES_DIR, relPath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

describe("Template path registry", () => {
  it("every SKILLS[i].workflowTemplate exists on disk", async () => {
    const skillsModule = await import("../src/generator/skills.js");
    // SKILLS is module-private; we go through the exported getEnabledSkills
    // by feeding it a config that enables every agent so every conditional skill turns on.
    const fullConfig = {
      version: 1 as const,
      project: { name: "test", domain: "", description: "", created: "2026-01-01" },
      knowledge: {
        source_types: ["documents", "articles", "media", "code", "data"] as const,
        organization: "entity-first" as const,
        scale: "medium" as const,
      },
      agents: {
        tool: "claude-code" as const,
        enabled: [
          "ingestion",
          "query",
          "lint",
          "research",
          "debate",
          "synthesis",
          "librarian",
          "analysis",
        ] as const,
        party_mode: true,
      },
      workflows: {
        ingestion_style: "autonomous" as const,
        outputs: ["markdown", "marp", "pdf", "matplotlib", "obsidian"] as const,
        tools: ["search", "qmd", "ingest", "stats", "graph", "watch", "diff"] as const,
      },
      wiki: {
        frontmatter: true,
        citation_format: "inline" as const,
        cross_ref_style: "wikilink" as const,
      },
    };
    const skills = skillsModule.getEnabledSkills(
      // structural copy avoids readonly-array friction
      JSON.parse(JSON.stringify(fullConfig)),
    );
    expect(skills.length, "at least one skill should be enabled").toBeGreaterThan(0);
    for (const skill of skills) {
      const ok = await exists(skill.workflowTemplate);
      expect(ok, `${skill.slug}: ${skill.workflowTemplate} not found`).toBe(true);
    }
  });

  it("templates/skills/SKILL.md.hbs exists (skill entry point)", async () => {
    expect(await exists("skills/SKILL.md.hbs")).toBe(true);
  });

  it("templates/agents/SKILL.md.hbs exists (agent entry point)", async () => {
    expect(await exists("agents/SKILL.md.hbs")).toBe(true);
  });

  it("every agent type has a persona file at templates/agents/personas/<type>.md", async () => {
    const agentTypes = [
      "ingestion",
      "query",
      "lint",
      "research",
      "debate",
      "synthesis",
      "librarian",
      "analysis",
    ];
    for (const t of agentTypes) {
      expect(await exists(`agents/personas/${t}.md`), `persona ${t}`).toBe(true);
    }
  });
});
