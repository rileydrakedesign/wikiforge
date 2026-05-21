import { describe, expect, it } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { AVAILABLE_PRESETS } from "../src/config/presets.js";
import type { WikiForgeConfig } from "../src/config/schema.js";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const PRESETS_DIR = path.join(REPO_ROOT, "presets");

function assertValidConfig(config: WikiForgeConfig, source: string): void {
  expect(config.version, `${source}: version`).toBe(1);
  expect(config.project, `${source}: project`).toBeDefined();
  expect(config.project.name, `${source}: project.name`).toBeTruthy();
  expect(config.knowledge, `${source}: knowledge`).toBeDefined();
  expect(
    Array.isArray(config.knowledge.source_types),
    `${source}: knowledge.source_types`,
  ).toBe(true);
  expect(config.knowledge.organization, `${source}: organization`).toBeTruthy();
  expect(config.knowledge.scale, `${source}: scale`).toBeTruthy();
  expect(config.agents, `${source}: agents`).toBeDefined();
  expect(config.agents.tool, `${source}: agents.tool`).toBeTruthy();
  expect(
    Array.isArray(config.agents.enabled),
    `${source}: agents.enabled`,
  ).toBe(true);
  expect(config.workflows, `${source}: workflows`).toBeDefined();
  expect(
    config.workflows.ingestion_style,
    `${source}: ingestion_style`,
  ).toBeTruthy();
  expect(config.wiki, `${source}: wiki`).toBeDefined();
}

describe("Presets", () => {
  it("every entry in AVAILABLE_PRESETS resolves to an existing YAML file", async () => {
    for (const preset of AVAILABLE_PRESETS) {
      const filePath = path.join(PRESETS_DIR, preset.filename);
      const raw = await readFile(filePath, "utf-8");
      expect(raw.length, `${preset.filename} is non-empty`).toBeGreaterThan(0);
    }
  });

  it("every preset YAML parses to a valid WikiForgeConfig", async () => {
    for (const preset of AVAILABLE_PRESETS) {
      const filePath = path.join(PRESETS_DIR, preset.filename);
      const raw = await readFile(filePath, "utf-8");
      const config = YAML.parse(raw) as WikiForgeConfig;
      assertValidConfig(config, preset.filename);
    }
  });

  it("every preset YAML on disk is registered in AVAILABLE_PRESETS", async () => {
    const onDisk = (await readdir(PRESETS_DIR)).filter((f) =>
      f.endsWith(".yaml"),
    );
    const registered = new Set(AVAILABLE_PRESETS.map((p) => p.filename));
    for (const file of onDisk) {
      expect(
        registered.has(file),
        `${file} on disk is not registered in AVAILABLE_PRESETS`,
      ).toBe(true);
    }
  });
});
