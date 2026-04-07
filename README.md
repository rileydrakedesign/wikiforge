# WikiForge

Scaffold LLM-powered research agent repositories through an interactive terminal questionnaire.

WikiForge combines [Karpathy's LLM Wiki pattern](https://github.com/karpathy/LLM-wiki) (raw -> wiki -> schema) with BMAD Method-style structured agents and workflows. In ~60 seconds, it generates a fully working research wiki implementation — directory structure, agent personas, workflows, templates, and tooling — tailored to your domain and preferences.

## Why WikiForge?

Instead of RAG (re-deriving knowledge per query), the LLM Wiki approach has the LLM **incrementally build and maintain a persistent wiki** — a structured, interlinked collection of markdown files compiled from raw sources. Cross-references are pre-built, contradictions are flagged, and synthesis reflects everything ingested. The human curates sources and asks questions; the LLM does the bookkeeping.

WikiForge takes this abstract pattern and generates a concrete, ready-to-use implementation.

## Quick Start

```bash
# Run directly with npx
npx wikiforge init

# Or install globally
npm install -g wikiforge
wforge init
```

You'll be guided through a questionnaire to configure your project, then WikiForge generates everything you need.

### Setup Modes

| Mode | Command | Description |
|------|---------|-------------|
| **Guided** | `wforge init` | Full interactive questionnaire (recommended) |
| **Quick Start** | `wforge init --quick` | Minimal questions, sensible defaults |
| **From Config** | `wforge init --config path/to/wikiforge.yaml` | Regenerate from saved config |
| **From Preset** | `wforge init --preset academic-research` | Start from a community template |

## What Gets Generated

```
my-research-wiki/
├── CLAUDE.md                 # Schema file for your LLM tool
├── wikiforge.yaml            # Frozen config (re-run anytime)
├── .forge/
│   ├── agents/               # Agent personas (SKILL.md per agent)
│   ├── skills/               # Workflows organized by lifecycle phase
│   │   ├── 1-acquisition/    # Ingest sources, web research
│   │   ├── 2-compilation/    # Build entity/concept pages
│   │   ├── 3-analysis/       # Query, compare, debate
│   │   ├── 4-synthesis/      # Compile reports, slides
│   │   └── maintenance/      # Lint, reindex, stats
│   ├── core/                 # Help + party-mode skills
│   ├── templates/            # Page templates
│   └── tools/                # CLI helper scripts
├── wiki/                     # LLM-maintained knowledge base
├── raw/                      # Your source documents (immutable)
└── outputs/                  # Generated deliverables
```

## Three-Layer Architecture

| Layer | Directory | Owner | Purpose |
|-------|-----------|-------|---------|
| **Raw** | `raw/` | Human | Immutable source documents — articles, papers, transcripts, data |
| **Wiki** | `wiki/` | LLM | Structured markdown pages — entities, concepts, summaries, comparisons |
| **Schema** | `CLAUDE.md` | Both | Configuration telling the LLM how the wiki works |

## Agent System

WikiForge generates specialized agent personas, each with defined principles, checklists, and capabilities:

| Agent | Role | Description |
|-------|------|-------------|
| **Iris** (Ingestion) | Read & extract | Processes sources, creates/updates wiki pages |
| **Quinn** (Query) | Answer & cite | Answers questions with wiki citations |
| **Linus** (Lint) | Validate | Health-checks wiki consistency and structure |
| **Rex** (Research) | Discover | Finds new sources via web search |
| **Diana** (Debate) | Challenge | Adversarial review of wiki claims |
| **Sophie** (Synthesis) | Compile | Produces output artifacts (reports, slides) |
| **Leo** (Librarian) | Organize | Manages index, taxonomy, cross-references |
| **Axel** (Analysis) | Analyze | Generates comparisons and charts |

Select which agents to include during setup — only Ingestion, Query, and Lint are enabled by default.

## Supported LLM Tools

WikiForge generates the appropriate schema file and launcher stubs for your tool:

- **Claude Code** — `CLAUDE.md` + `.claude/skills/`
- **Cursor** — `.cursorrules` + `.cursor/skills/`
- **Codex** — `AGENTS.md` + `.codex/skills/`
- **Generic** — All schema variants generated

## Community Presets

Start from a pre-configured template:

```bash
wforge init --preset academic-research
wforge init --preset book-companion
wforge init --preset competitive-analysis
wforge init --preset personal-knowledge
```

## Development

```bash
git clone https://github.com/rileydrakedesign/wikiforge.git
cd wikiforge
npm install
npm run build       # Compile TypeScript
npm run dev         # Watch mode
npm run test        # Run tests
npm run lint        # Type-check
```

### Project Structure

```
src/
  index.ts            # CLI entry point
  cli/                # Questionnaire flows
  generator/          # Code generation modules
  config/             # Type definitions & defaults
  utils/              # File system, git, template rendering
templates/            # Handlebars templates (.hbs)
presets/              # Community preset YAML files
```

## Requirements

- Node.js >= 18.0.0

## License

[MIT](LICENSE)
