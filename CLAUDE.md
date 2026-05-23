# WikiForge

CLI tool that scaffolds an **LLM Wiki** — a compounding, agent-maintained knowledge base — through an interactive terminal questionnaire. Combines Karpathy's LLM Wiki pattern (raw → wiki → schema) with BMAD Method-style structured agents and workflows.

## Primary Objective

WikiForge is a **generative scaffold** for the LLM Wiki methodology. The core idea from Karpathy's LLM Wiki: instead of RAG (re-deriving knowledge per query), the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files compiled from raw sources. The wiki is a compounding artifact: cross-references are pre-built, contradictions are flagged, synthesis reflects everything ingested. The human curates sources and asks questions; the LLM does the bookkeeping.

WikiForge's job is to take this abstract pattern and generate a fully working implementation — directory structure, agent personas, workflows, templates, tooling — tailored to the user's domain and preferences, in ~60 seconds via an interactive CLI.

## Architecture

Three-layer knowledge architecture (from LLM Wiki):
- **Raw sources** (`raw/`) — immutable source documents (articles, papers, transcripts, images, data). LLM reads but never modifies.
- **The wiki** (`wiki/`) — LLM-generated markdown pages (entities, concepts, source summaries, comparisons, overview). LLM owns this layer entirely.
- **The schema** (`CLAUDE.md` / `.cursorrules` / `AGENTS.md`) — configuration telling the LLM how the wiki is structured and what workflows to follow.

WikiForge generates all three layers plus the agent orchestration system (`.forge/` directory).

## Core Loops (LLM Wiki invariants)

Three loops are what make a generated repo a compounding wiki rather than a notes folder. Every change to WikiForge should preserve them:

1. **Index-first navigation.** Agents read `wiki/index.md` first to find candidate pages; they drill into specific pages only after the index narrows the set.

2. **Answers compound back into the wiki.** Novel synthesis produced by `query-wiki` is filed back via `file-answer` — comparisons into `wiki/comparisons/`, analyses into `wiki/concepts/`. This is what makes queries compound, not evaporate.

3. **Operations log in parseable form.** Every ingest, query, lint, and maintenance action appends to `wiki/log.md` with the prefix `## [ISO-timestamp] operation | title`. The regular prefix makes the log greppable without extra tooling.

## Tech Stack

- **Language**: TypeScript (ES2022, Node16 modules)
- **Build**: `tsc` to `dist/`, source maps + declarations enabled
- **Test**: Vitest
- **CLI framework**: Commander (args), @inquirer/prompts (interactive prompts)
- **Rendering**: Handlebars templates (`.hbs` files in `templates/`)
- **Styling**: Chalk (terminal colors), Ora (spinners)
- **Config**: YAML (wikiforge.yaml)
- **Distribution**: npm — `npx wforge init`

## Project Structure

```
src/
  index.ts              # CLI entry point (Commander setup, command routing)
  cli/
    questionnaire.ts    # Full guided setup flow (Phases 0-5)
    quick-start.ts      # Minimal-questions flow
    from-config.ts      # Generate from existing wikiforge.yaml
  generator/
    scaffold.ts         # Directory creation (BMAD-aligned structure)
    schema.ts           # CLAUDE.md / .cursorrules / AGENTS.md generation
    agents.ts           # Agent SKILL.md directory generation
    skills.ts           # Skill SKILL.md + workflow.md generation (phase-organized)
    config.ts           # Runtime config.yaml generation
    core-skills.ts      # Help + party-mode core skill generation
    launchers.ts        # IDE launcher stub generation
    manifests.ts        # Manifest CSV/YAML generation
    templates.ts        # Page template generation
    tools.ts            # Helper script generation (search, pdf-to-md, etc.)
    readme.ts           # README generation
  config/
    schema.ts           # WikiForgeConfig type definitions
    defaults.ts         # Default config values
    presets.ts          # Community template preset loading
  utils/
    fs.ts               # File system helpers
    render.ts           # Handlebars template rendering engine + helpers
    git.ts              # Git initialization

templates/              # Handlebars template files (.hbs)
  agents/
    SKILL.md.hbs        # Unified agent SKILL.md template
    personas/           # Per-agent persona text (8 .md files)
  skills/
    SKILL.md.hbs        # Skill entry point template
    workflows/          # Per-skill workflow templates (15 .workflow.md.hbs files)
  core/                 # Core skill templates (help, party-mode)
  config/               # Config and manifest templates
  launchers/            # IDE launcher templates
  schema/               # Schema file templates (claude-code.md.hbs, etc.)
  pages/                # Wiki page templates (entity, concept, source summary)
  tools/                # Helper script templates
  wiki/                 # Initial wiki file templates (index, log, overview)

presets/                # Community preset YAML files
  academic-research.yaml
  book-companion.yaml
  competitive-analysis.yaml
  personal-knowledge.yaml
```

## Generated Repository Structure (BMAD-Aligned)

```
my-research-wiki/
├── CLAUDE.md                          # Schema file (or .cursorrules / AGENTS.md)
├── wikiforge.yaml                     # Boot config (re-generate with wforge; revise live via wforge-revise-schema)
├── .claude/skills/                    # IDE launchers (thin stubs)
│   ├── wforge-agent-ingestion.md      # → .forge/agents/wforge-agent-ingestion/
│   ├── wforge-ingest-source.md        # → .forge/skills/1-acquisition/...
│   ├── wforge-help.md                 # → .forge/core/wforge-help/
│   └── ...
├── .forge/
│   ├── config.yaml                    # Runtime config (variables for agents/skills)
│   ├── _config/                       # Manifests
│   │   ├── manifest.yaml              # Installation metadata
│   │   ├── skill-manifest.csv         # All skills catalog
│   │   ├── agent-manifest.csv         # All agents catalog
│   │   ├── wforge-help.csv            # Help routing catalog
│   │   └── files-manifest.csv         # File hashes for update detection
│   ├── agents/                        # Agent personas (SKILL.md per agent)
│   │   ├── wforge-agent-ingestion/SKILL.md
│   │   ├── wforge-agent-query/SKILL.md
│   │   └── ...
│   ├── skills/                        # Workflows organized by lifecycle phase
│   │   ├── 1-acquisition/
│   │   │   ├── wforge-ingest-source/  # SKILL.md + workflow.md
│   │   │   └── wforge-web-research/
│   │   ├── 2-compilation/
│   │   ├── 3-analysis/
│   │   ├── 4-synthesis/
│   │   └── maintenance/
│   ├── core/                          # Core skills
│   │   ├── wforge-help/SKILL.md
│   │   └── wforge-party-mode/SKILL.md
│   ├── templates/                     # Page templates
│   └── tools/                         # CLI helper scripts
├── wiki/                              # LLM-maintained knowledge
├── raw/                               # Immutable sources
└── outputs/                           # Generated deliverables
```

## Key Concepts

### Agent System (BMAD-inspired)
Generated repos include specialized agent personas in `.forge/agents/`:
- **Ingestion Agent (Iris)** — reads sources, extracts knowledge, updates wiki
- **Query Agent (Quinn)** — answers questions from wiki with citations
- **Lint Agent (Linus)** — health-checks wiki consistency
- **Research Agent (Rex)** — finds new sources via web search
- **Debate Agent (Diana)** — adversarial review of wiki claims
- **Synthesis Agent (Sophie)** — compiles output artifacts
- **Librarian Agent (Leo)** — manages index, taxonomy, cross-references
- **Analysis Agent (Axel)** — generates charts, comparisons

### Workflow Lifecycle
Workflows map to research phases:
1. **Acquisition** — ingest-source, batch-ingest, web-research
2. **Compilation** — update-entities, update-concepts, cross-reference
3. **Analysis** — query-wiki, generate-comparison, adversarial-review
4. **Synthesis** — compile-output, generate-slides, export-report
5. **Maintenance** — lint-wiki, reindex, stats

### Ingestion Pipeline
The most critical operation. Two halves:
1. **Mechanical** (scriptable): format detection -> format-specific converter -> frontmatter generation -> `raw/{type}/{slug}.md`
2. **Intelligent** (LLM): Ingestion Agent reads converted markdown -> extracts entities/concepts -> creates/updates wiki pages -> updates index + log

### CLI Questionnaire Phases
0. Welcome & mode selection (Guided / Quick Start / From Template / From Config)
1. Project identity (name, domain, description)
2. Knowledge architecture (source types, organization style, scale)
3. Agent configuration (LLM tool, which agents, party mode)
4. Workflow preferences (ingestion style, output formats, CLI tools)
5. Confirmation & generation

## Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Watch mode compilation
npm run start          # Run the CLI
npm run test           # Run tests (vitest)
npm run test:watch     # Watch mode tests
npm run lint           # Type-check without emit
```

## Conventions

- All source in `src/`, compiled to `dist/`
- Templates use Handlebars (`.hbs` extension) in `templates/`
- Config files use YAML
- Generated repos use markdown with YAML frontmatter throughout
- Wiki cross-references support both wikilink (`[[page]]`) and standard markdown link formats depending on user preference
- Content hashing (SHA-256) for provenance tracking on ingested sources
- `log.md` is append-only with parseable prefix format: `## [ISO-timestamp] operation | title`
