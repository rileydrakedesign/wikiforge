import path from "node:path";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import YAML from "yaml";
import type { WikiForgeConfig } from "../config/schema.js";
import { writeFileWithDirs } from "../utils/fs.js";
import { AGENT_META } from "./agents.js";
import { getEnabledSkills } from "./skills.js";

/**
 * Recursively collect all file paths under a directory.
 */
async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;
        results.push(...(await collectFiles(fullPath)));
      } else {
        results.push(fullPath);
      }
    }
  } catch {
    // directory may not exist
  }
  return results;
}

/**
 * Hash a file's contents with SHA-256 (first 16 hex chars).
 */
async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Escape a CSV field (wrap in quotes if it contains commas or quotes).
 */
function csvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate all manifest files in .forge/_config/.
 * MUST run after all other generators since it hashes generated files.
 */
export async function generateManifests(
  rootDir: string,
  config: WikiForgeConfig,
): Promise<void> {
  const configDir = path.join(rootDir, ".forge", "_config");

  // 1. manifest.yaml — installation metadata
  const configHash = createHash("sha256")
    .update(JSON.stringify(config))
    .digest("hex")
    .slice(0, 16);

  const manifest = {
    installation: {
      tool: "wikiforge",
      version: "0.1.0",
      date: config.project.created,
      config_hash: configHash,
    },
    project: {
      name: config.project.name,
      domain: config.project.domain,
    },
    agents: {
      tool: config.agents.tool,
      enabled: config.agents.enabled,
      party_mode: config.agents.party_mode,
    },
  };
  await writeFileWithDirs(
    path.join(configDir, "manifest.yaml"),
    YAML.stringify(manifest),
  );

  // 2. skill-manifest.csv
  const enabledSkills = getEnabledSkills(config);
  const skillRows = [
    "slug,name,description,phase,path",
    ...enabledSkills.map((s) =>
      [
        csvField(s.slug),
        csvField(s.name),
        csvField(s.description),
        csvField(s.phase),
        csvField(`.forge/skills/${s.phase}/${s.slug}/SKILL.md`),
      ].join(","),
    ),
  ];
  await writeFileWithDirs(
    path.join(configDir, "skill-manifest.csv"),
    skillRows.join("\n") + "\n",
  );

  // 3. agent-manifest.csv
  const agentRows = [
    "slug,displayName,title,icon,capabilities,persona,path",
    ...config.agents.enabled.map((agentType) => {
      const meta = AGENT_META[agentType];
      const capCodes = meta.capabilities.map((c) => c.code).join("|");
      return [
        csvField(meta.slug),
        csvField(meta.name),
        csvField(meta.title),
        csvField(meta.icon),
        csvField(capCodes),
        csvField(meta.persona),
        csvField(`.forge/agents/${meta.slug}/SKILL.md`),
      ].join(",");
    }),
  ];
  await writeFileWithDirs(
    path.join(configDir, "agent-manifest.csv"),
    agentRows.join("\n") + "\n",
  );

  // 4. wforge-help.csv — help routing catalog
  const helpRows = [
    "slug,display-name,code,description,phase,required",
    ...enabledSkills.map((s) => {
      const required = s.phase === "1-acquisition" ? "true" : "false";
      // Find any agent capability code that maps to this skill
      let code = "";
      for (const agentType of config.agents.enabled) {
        const cap = AGENT_META[agentType].capabilities.find(
          (c) => c.skill === s.slug,
        );
        if (cap) {
          code = cap.code;
          break;
        }
      }
      return [
        csvField(s.slug),
        csvField(s.name),
        csvField(code),
        csvField(s.description),
        csvField(s.phase),
        required,
      ].join(",");
    }),
  ];
  await writeFileWithDirs(
    path.join(configDir, "wforge-help.csv"),
    helpRows.join("\n") + "\n",
  );

  // 5. files-manifest.csv — all generated files with hashes
  const forgeDir = path.join(rootDir, ".forge");
  const allFiles = await collectFiles(forgeDir);
  const fileRows = ["path,hash,type"];
  for (const filePath of allFiles) {
    // Skip the manifest files themselves
    if (filePath.startsWith(configDir)) continue;
    const relPath = path.relative(rootDir, filePath);
    const hash = await hashFile(filePath);
    const ext = path.extname(filePath).slice(1) || "unknown";
    fileRows.push(
      [csvField(relPath), csvField(hash), csvField(ext)].join(","),
    );
  }
  await writeFileWithDirs(
    path.join(configDir, "files-manifest.csv"),
    fileRows.join("\n") + "\n",
  );
}
