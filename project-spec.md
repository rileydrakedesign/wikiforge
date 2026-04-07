# WikiForge — Product Specification & Architecture

> A CLI tool that scaffolds LLM-powered research agent repositories through an interactive terminal questionnaire, combining Karpathy's LLM Wiki pattern with BMAD Method-style structured agents and workflows.

---

## 1. Product Vision

### The Problem

Karpathy's LLM Wiki pattern is powerful but abstract — it's an "idea file" that describes *what* to build (raw → wiki → schema), not *how* to set it up. Every user has to manually create directories, write their own CLAUDE.md/AGENTS.md, define agent behaviors, and figure out workflows from scratch. The BMAD Method solves this for software development with structured agents and guided workflows, but no equivalent exists for research and knowledge work.

### The Solution

**WikiForge** (`wforge`) is a CLI tool that walks users through an interactive terminal questionnaire and generates a fully scaffolded research agent repository — complete with specialized agent personas, structured workflows, schema files, and tooling configuration — all tailored to the user's specific research domain, preferred LLM agent, and knowledge management style.

### The Tagline

*"From blank directory to research agent in 60 seconds."*

### Core Insight

Karpathy's LLM Wiki provides the **knowledge architecture** (the *what*).
BMAD Method provides the **agent orchestration pattern** (the *how*).
WikiForge merges both into a **generative scaffold** (the *tool*).

---

## 2. User Personas

### Primary: The Solo Researcher / Builder

- Uses Claude Code, Cursor, Codex, or similar AI agents daily
- Wants to go deep on a topic (AI, finance, biotech, history, etc.)
- Has sources scattered across PDFs, articles, bookmarks, notes
- Doesn't want to spend hours configuring a knowledge system from scratch
- Comfortable with terminal tools and markdown

### Secondary: The Team Knowledge Manager

- Needs a shared wiki fed by multiple contributors
- Wants consistent structure across team research efforts
- Values reproducibility and auditability of knowledge compilation

### Tertiary: The Course/Book Reader

- Working through a book, course, or paper series
- Wants structured chapter-by-chapter or paper-by-paper ingestion
- Values timeline and progression tracking

---

## 3. CLI Experience — The Questionnaire Flow

The CLI runs as an interactive terminal wizard using a progressive disclosure pattern. Users answer questions in phases, and each phase's answers inform the next phase's defaults and options.

### Phase 0: Welcome & Mode Selection

```
╔══════════════════════════════════════════════════════╗
║  🔬 WikiForge v1.0                              ║
║  Scaffold an LLM-powered research agent repository  ║
╚══════════════════════════════════════════════════════╝

? Select mode:
  ❯ 🧭 Guided Setup (recommended — full questionnaire)
    ⚡ Quick Start (sensible defaults, minimal questions)
    📋 From Template (use a community template)
    📄 From Config (wikiforge.yaml)
```

### Phase 1: Project Identity

```
? Project name: (my-research-wiki)
? Research domain/topic: (e.g., "Agentic AI Systems", "Renaissance Art", "Options Trading")
? One-line description: (A knowledge base for tracking developments in...)
? Initialize git repo? (Y/n)
```

### Phase 2: Knowledge Architecture

```
? Source types you'll be working with: (multi-select)
  ◉ Articles & blog posts
  ◉ Academic papers (PDF)
  ◯ Books / book chapters
  ◯ Podcasts / audio transcripts
  ◯ Video transcripts (YouTube, lectures)
  ◯ Code repositories
  ◯ Data files (CSV, JSON)
  ◯ Images / diagrams
  ◯ Meeting notes / transcripts
  ◯ Social media threads

? Wiki organization style:
  ❯ 🏷️  Entity-first (people, orgs, concepts get their own pages)
    📚 Topic-first (broad topics with sub-sections)
    📅 Chronological (timeline-driven, date-indexed)
    🔬 Thesis-driven (claims, evidence, counter-evidence)
    🎯 Custom (define your own categories later)

? Expected scale:
  ❯ Small (< 50 sources, personal project)
    Medium (50-200 sources, serious research)
    Large (200+ sources, long-running project)
```

### Phase 3: Agent Configuration

```
? Primary LLM agent tool:
  ❯ 🤖 Claude Code (generates CLAUDE.md)
    🖱️  Cursor / Windsurf (generates .cursorrules)
    📟 OpenAI Codex (generates AGENTS.md)
    🔧 Generic (generates all schema files)

? Research agents to include: (multi-select)
  ◉ 📥 Ingestion Agent — reads sources, updates wiki
  ◉ 🔍 Query Agent — answers questions from wiki
  ◉ 🔧 Lint Agent — health-checks wiki consistency
  ◯ 🕵️  Research Agent — finds new sources via web search
  ◯ 📊 Analysis Agent — generates comparisons, charts, tables
  ◯ 🗣️  Debate Agent — adversarial review of wiki claims
  ◯ 📝 Synthesis Agent — creates output artifacts (essays, slides, reports)
  ◯ 📋 Librarian Agent — manages index, taxonomy, cross-references

? Enable Party Mode? (multiple agents collaborate in one session)
  ❯ Yes — include party mode configuration
    No — single agent at a time
```

### Phase 4: Workflow Preferences

```
? Ingestion workflow:
  ❯ 🐌 Deliberate (one source at a time, human-in-the-loop review)
    🏃 Batch (process multiple sources, review after)
    🤖 Autonomous (ingest and update with minimal supervision)

? Output formats to support: (multi-select)
  ◉ Markdown pages
  ◯ Marp slide decks
  ◯ Matplotlib/chart generation
  ◯ PDF reports
  ◯ Obsidian-optimized (wiki links, graph view, dataview)

? Include CLI helper tools?
  ◉ Search script (grep/ripgrep based wiki search)
  ◯ qmd integration (hybrid BM25/vector search)
  ◯ Ingest script (batch file processor)
  ◯ Stats script (wiki health dashboard)
```

### Phase 5: Confirmation & Generation

```
📋 WikiForge Configuration Summary
──────────────────────────────────────
Project:       agentic-ai-research
Domain:        Agentic AI Systems
Agent Tool:    Claude Code
Agents:        Ingestion, Query, Lint, Research, Debate
Wiki Style:    Entity-first
Scale:         Medium
Outputs:       Markdown, Marp slides
Tools:         Search script, stats script

? Generate repository? (Y/n)

⠋ Scaffolding repository...
✓ Created directory structure
✓ Generated CLAUDE.md schema
✓ Created 5 agent personas
✓ Set up 8 workflow definitions
✓ Generated index.md and log.md
✓ Initialized git repo
✓ Created README.md

🎉 Your research agent repository is ready!

   cd agentic-ai-research
   claude  # or cursor, codex, etc.

   Start with: "Ingest this article: <paste URL or file path>"
```

---

## 4. Generated Repository Structure

```
my-research-wiki/
├── CLAUDE.md                    # or .cursorrules / AGENTS.md
├── README.md                    # Project overview + quickstart
├── wikiforge.yaml           # Frozen config (re-generate, extend)
│
├── raw/                         # Immutable source documents
│   ├── articles/
│   ├── papers/
│   ├── transcripts/
│   └── assets/                  # Images, data files
│
├── wiki/                        # LLM-maintained knowledge base
│   ├── index.md                 # Master catalog of all pages
│   ├── log.md                   # Append-only operation log
│   ├── overview.md              # High-level synthesis (auto-maintained)
│   ├── entities/                # People, orgs, tools, models
│   ├── concepts/                # Ideas, theories, frameworks
│   ├── sources/                 # Per-source summary pages
│   └── comparisons/             # Generated analysis artifacts
│
├── outputs/                     # Generated deliverables
│   ├── slides/
│   ├── reports/
│   └── exports/
│
├── .forge/                      # WikiForge internals
│   ├── agents/                  # Agent persona definitions
│   │   ├── ingestion-agent.md
│   │   ├── query-agent.md
│   │   ├── lint-agent.md
│   │   ├── research-agent.md
│   │   └── debate-agent.md
│   ├── workflows/               # Structured workflow scripts
│   │   ├── ingest-source.md
│   │   ├── query-wiki.md
│   │   ├── lint-wiki.md
│   │   ├── batch-ingest.md
│   │   ├── generate-comparison.md
│   │   ├── adversarial-review.md
│   │   └── compile-output.md
│   ├── templates/               # Page templates
│   │   ├── entity-page.md
│   │   ├── concept-page.md
│   │   ├── source-summary.md
│   │   └── comparison-table.md
│   └── tools/                   # CLI helper scripts
│       ├── search.sh
│       └── stats.sh
│
└── .gitignore
```

---

## 5. Agent Architecture (BMAD-Inspired)

Each agent is defined as a markdown persona file in `.forge/agents/`. The schema file (CLAUDE.md etc.) acts as the orchestrator, routing user intents to the right agent and workflow — mirroring BMAD's skill-triggered agent system.

### 5.1 Agent Roster

| Agent | Persona | Role | BMAD Analog |
|-------|---------|------|-------------|
| **Ingestion Agent** (Iris) | Meticulous librarian | Reads sources, extracts knowledge, updates wiki pages, maintains cross-references | Developer (Amelia) |
| **Query Agent** (Quinn) | Expert analyst | Reads index, navigates wiki, synthesizes answers with citations | Analyst (Mary) |
| **Lint Agent** (Linus) | Strict editor | Finds contradictions, orphan pages, stale claims, missing cross-refs | QA / Code Review |
| **Research Agent** (Rex) | Curious explorer | Finds new sources via web search, suggests gaps to fill | Analyst (Research) |
| **Debate Agent** (Diana) | Devil's advocate | Challenges wiki claims, runs adversarial review of conclusions | Adversarial Review |
| **Synthesis Agent** (Sophie) | Technical writer | Compiles wiki into output artifacts (slides, reports, essays) | Tech Writer (Paige) |
| **Librarian Agent** (Leo) | Taxonomist | Manages index, resolves naming conflicts, maintains ontology | PM (John) |
| **Analysis Agent** (Axel) | Data scientist | Generates charts, comparisons, quantitative analysis | Architect (Winston) |

### 5.2 Agent Persona File Format

Each agent file follows a consistent structure:

```markdown
# Agent: Ingestion Agent (Iris)

## Identity
You are Iris, the Ingestion Agent. You are a meticulous research librarian
who reads source material carefully and integrates knowledge into the wiki
with precision and thoroughness.

## Responsibilities
- Read new source documents dropped into raw/
- Create source summary pages in wiki/sources/
- Update or create entity pages in wiki/entities/
- Update or create concept pages in wiki/concepts/
- Maintain cross-references between pages
- Update index.md with new entries
- Append operations to log.md

## Workflow Trigger
When the user says "ingest", "process", "add source", or drops a file
into raw/, activate the ingest-source workflow.

## Rules
1. NEVER modify files in raw/ — they are immutable
2. Always cite the source document when adding claims
3. Flag contradictions with existing wiki content explicitly
4. Update the index after every operation
5. Log every action in log.md with timestamp prefix

## Quality Checklist
Before completing an ingestion:
- [ ] Source summary page created
- [ ] All entities mentioned have pages (or are noted as gaps)
- [ ] Key concepts linked to concept pages
- [ ] Cross-references added to related pages
- [ ] Index updated
- [ ] Log entry appended
```

### 5.3 Schema File Design (CLAUDE.md)

The generated schema acts as the master orchestrator:

```markdown
# Research Wiki: [Project Name]

## Project Overview
[Auto-generated from questionnaire answers]

## Directory Structure
[Documented layout with purpose of each directory]

## Agent System
This repository uses specialized agents for different operations.
Agent definitions are in .forge/agents/.

### Available Commands
- `/ingest <source>` — Activate Iris (Ingestion Agent)
- `/query <question>` — Activate Quinn (Query Agent)
- `/lint` — Activate Linus (Lint Agent)
- `/research <topic>` — Activate Rex (Research Agent)
- `/debate <claim>` — Activate Diana (Debate Agent)
- `/synthesize <format>` — Activate Sophie (Synthesis Agent)
- `/reindex` — Activate Leo (Librarian Agent)
- `/analyze <question>` — Activate Axel (Analysis Agent)
- `/help` — Show available commands and current wiki status

### Workflow Routing
When the user requests an action, read the corresponding workflow
file from .forge/workflows/ and follow it step by step.

## Wiki Conventions
[Page format, frontmatter schema, linking conventions, citation format]

## Page Templates
Reference templates in .forge/templates/ when creating new pages.
```

---

## 6. Workflow Definitions (BMAD-Inspired)

### 6.1 Workflow Map

Mirroring BMAD's 4-phase structure, WikiForge organizes workflows into research lifecycle phases:

| Phase | Workflows | Produces |
|-------|-----------|----------|
| **1. Acquisition** | `ingest-source`, `batch-ingest`, `web-research` | Source summaries, raw files |
| **2. Compilation** | `update-entities`, `update-concepts`, `cross-reference` | Wiki pages, links |
| **3. Analysis** | `query-wiki`, `generate-comparison`, `adversarial-review` | Answers, analysis artifacts |
| **4. Synthesis** | `compile-output`, `generate-slides`, `export-report` | Deliverables |
| **Maintenance** | `lint-wiki`, `reindex`, `stats` | Health reports |

### 6.2 Example Workflow: `ingest-source.md`

```markdown
# Workflow: Ingest Source

## Trigger
User says "ingest", "process", "add", or provides a new source.

## Steps

### Step 1: Identify Source
- Determine source type (article, paper, transcript, etc.)
- If URL: fetch and convert to markdown, save to raw/
- If file: verify it exists in raw/
- Extract metadata: title, author, date, URL

### Step 2: Read & Extract
- Read the full source document
- Identify key entities (people, organizations, tools, models)
- Identify key concepts (theories, frameworks, methods)
- Note claims that are novel, surprising, or contradict existing wiki content
- Discuss key takeaways with the user

### Step 3: Create Source Summary
- Create wiki/sources/[slug].md using the source-summary template
- Include: metadata, summary, key takeaways, entities mentioned,
  concepts introduced, notable quotes (attributed)

### Step 4: Update Wiki Pages
- For each entity: update or create wiki/entities/[entity].md
- For each concept: update or create wiki/concepts/[concept].md
- Add cross-references between new and existing pages
- Flag any contradictions with existing content

### Step 5: Update Index & Log
- Add new entries to wiki/index.md under appropriate categories
- Append to wiki/log.md:
  `## [YYYY-MM-DD] ingest | Source Title`

### Step 6: Report
- Summarize what was added/updated
- List pages touched
- Note any contradictions or gaps discovered
- Suggest follow-up questions or sources to investigate
```

---

## 7. Technical Architecture

### 7.1 Language Recommendation: TypeScript (Node.js)

**Rationale:**
- BMAD Method itself uses `npx bmad-method install` — same distribution model
- Rich CLI ecosystem: `inquirer` (prompts), `chalk` (colors), `ora` (spinners), `commander` (args)
- Easy npm publishing: `npx wikiforge init`
- Template rendering with `ejs` or `handlebars`
- JSON/YAML config handling is native
- TypeScript gives type safety for the config schema
- Widest audience overlap with the target users (devs using AI agents)

### 7.2 Package Architecture

```
wikiforge/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── cli/
│   │   ├── questionnaire.ts     # Interactive prompt flow
│   │   ├── quick-start.ts       # Minimal prompt flow
│   │   └── from-config.ts       # YAML-driven generation
│   ├── generator/
│   │   ├── scaffold.ts          # Directory creation
│   │   ├── schema.ts            # CLAUDE.md / .cursorrules generator
│   │   ├── agents.ts            # Agent persona generator
│   │   ├── workflows.ts         # Workflow file generator
│   │   ├── templates.ts         # Page template generator
│   │   ├── tools.ts             # Helper script generator
│   │   └── readme.ts            # README generator
│   ├── config/
│   │   ├── schema.ts            # WikiForge config type definitions
│   │   ├── defaults.ts          # Default configurations
│   │   └── presets.ts           # Community template presets
│   └── utils/
│       ├── fs.ts                # File system helpers
│       ├── git.ts               # Git initialization
│       └── render.ts            # Template rendering engine
├── templates/                   # Handlebars/EJS template files
│   ├── agents/
│   │   ├── ingestion-agent.md.hbs
│   │   ├── query-agent.md.hbs
│   │   └── ...
│   ├── workflows/
│   │   ├── ingest-source.md.hbs
│   │   └── ...
│   ├── schema/
│   │   ├── claude.md.hbs
│   │   ├── cursorrules.hbs
│   │   └── agents.md.hbs
│   └── wiki/
│       ├── index.md.hbs
│       ├── log.md.hbs
│       └── overview.md.hbs
└── presets/                     # Community templates
    ├── academic-research.yaml
    ├── book-companion.yaml
    ├── competitive-analysis.yaml
    └── personal-knowledge.yaml
```

### 7.3 Config Schema (`wikiforge.yaml`)

```yaml
version: 1
project:
  name: "agentic-ai-research"
  domain: "Agentic AI Systems"
  description: "Tracking developments in autonomous AI agent architectures"
  created: "2026-04-06"

knowledge:
  source_types:
    - articles
    - papers
    - code_repos
  organization: entity-first  # entity-first | topic-first | chronological | thesis-driven
  scale: medium               # small | medium | large

agents:
  tool: claude-code           # claude-code | cursor | codex | generic
  enabled:
    - ingestion
    - query
    - lint
    - research
    - debate
  party_mode: true

workflows:
  ingestion_style: deliberate  # deliberate | batch | autonomous
  outputs:
    - markdown
    - marp
  tools:
    - search
    - stats

wiki:
  frontmatter: true
  citation_format: "inline"    # inline | footnote | academic
  cross_ref_style: "wikilink"  # wikilink | markdown-link
```

### 7.4 Distribution

```bash
# Install and run
npx wikiforge init

# Or install globally
npm install -g wikiforge
wforge init

# Non-interactive (CI/templating)
wforge init --config wikiforge.yaml --yes

# From community preset
wforge init --preset academic-research
```

---

## 8. Differentiation & Moat

| Existing Tool | What It Does | What WikiForge Adds |
|---------------|-------------|------------------------|
| Karpathy's LLM Wiki gist | Describes the pattern abstractly | Generates a working implementation |
| BMAD Method | Software development lifecycle | Research knowledge lifecycle |
| llm-wiki-compiler (npm) | Compile-time wiki from sources | Full agent system + workflows |
| Obsidian + LLM plugins | View/edit markdown wikis | Structured agent orchestration layer |
| NotebookLM | RAG-based Q&A over uploads | Persistent, compounding knowledge |

**The gap WikiForge fills**: nobody has built the `create-react-app` equivalent for LLM-powered research repositories. You run one command, answer a few questions, and get a production-ready research workspace with intelligent agents that know how to maintain it.

---

## 9. Roadmap

### v1.0 — MVP
- Interactive CLI questionnaire (full guided flow)
- Quick start mode
- Generate repos for Claude Code, Cursor, Codex
- 4 core agents (Ingestion, Query, Lint, Librarian)
- 5 core workflows
- Search helper script
- npm publishable, `npx` runnable

### v1.5 — Templates & Community
- Community preset system (`wforge init --preset`)
- `wforge add agent <name>` — add agents post-scaffolding
- `wforge add workflow <name>` — add workflows post-scaffolding
- Obsidian-optimized output mode (wiki links, dataview frontmatter)

### v2.0 — Intelligence Layer
- `wforge status` — wiki health dashboard in terminal
- `wforge ingest <url>` — CLI-driven source ingestion
- qmd / semantic search integration
- MCP server generation for wiki access
- Multi-wiki linking (cross-project references)

### v3.0 — Platform
- Web-based questionnaire (generate + download zip)
- Team/shared wiki scaffolding
- Plugin system for custom agents/workflows
- WikiForge Hub — browse and share presets

---

## 10. Open Questions

1. **Naming**: WikiForge, WikiForge, KnowledgeForge, wForge? Need to check npm availability.
2. **Agent file format**: Should agent personas be YAML with markdown content, or pure markdown with YAML frontmatter?
3. **Workflow execution**: Should workflows be purely instructional (the LLM reads and follows them) or should some have executable scripts behind them?
4. **Obsidian-first vs. agent-first**: Should the default output be optimized for Obsidian viewing or for LLM agent consumption? (They're slightly different — wikilinks vs. relative paths, etc.)
5. **Monetization path**: Keep fully open source? Premium presets? Hosted version for non-devs?

---

*This spec was designed for implementation with Claude Code or a similar agentic coding tool. The next step is to scaffold the TypeScript project, build the questionnaire flow, and create the template system.*