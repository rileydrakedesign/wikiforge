# WikiForge — Multimodal Ingestion Architecture

> How documents of every type enter `raw/`, get converted to markdown, and flow through the wiki compilation pipeline — using the exact tooling ecosystem Karpathy's LLM Wiki prescribes.

---

## 1. The Fundamental Principle

Karpathy's LLM Wiki makes one thing very clear: the wiki is not RAG. Sources are not chunked and retrieved at query time — they are **compiled once** into persistent wiki pages that the LLM maintains. This means ingestion is the most critical operation in the entire system. Every source that enters `raw/` needs to become clean, structured markdown that the LLM can read, extract knowledge from, and weave into the wiki.

The ingestion pipeline's job is to normalize the chaos of real-world source material — PDFs, web articles, YouTube transcripts, podcast audio, images, spreadsheets, code repos — into a single uniform substrate: **markdown files with YAML frontmatter, sitting in `raw/`**.

Everything downstream (the Ingestion Agent reading the source, creating wiki pages, updating cross-references) depends on this conversion being high quality. Garbage markdown in `raw/` means garbage wiki pages in `wiki/`.

---

## 2. The Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER DROPS A SOURCE                         │
│                                                                 │
│   URL ─┐   PDF ─┐   Audio ─┐   Image ─┐   File ─┐   Clip ─┐  │
│        │        │          │          │         │         │     │
│        ▼        ▼          ▼          ▼         ▼         ▼     │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              FORMAT DETECTION & ROUTING                 │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│   ┌──────────────────────▼──────────────────────────────────┐   │
│   │           FORMAT-SPECIFIC CONVERTER                     │   │
│   │                                                         │   │
│   │   Web Article  → Obsidian Web Clipper / readability     │   │
│   │   PDF          → pymupdf4llm                            │   │
│   │   Audio/Video  → Whisper transcription                  │   │
│   │   Image        → Copy to assets, generate description   │   │
│   │   DOCX/PPTX    → pandoc or mammoth                      │   │
│   │   CSV/JSON     → Structured markdown table              │   │
│   │   Code repo    → Tree + key file extraction             │   │
│   │   Clipboard    → Direct markdown paste                  │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│   ┌──────────────────────▼──────────────────────────────────┐   │
│   │           FRONTMATTER GENERATION                        │   │
│   │                                                         │   │
│   │   title, author, date, url, source_type,                │   │
│   │   content_hash (SHA-256), ingested_at                   │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│   ┌──────────────────────▼──────────────────────────────────┐   │
│   │        IMAGE LOCALIZATION (optional)                     │   │
│   │                                                         │   │
│   │   Download remote images → raw/assets/                  │   │
│   │   Rewrite image refs to local paths                     │   │
│   └──────────────────────┬──────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│              raw/{source_type}/{slug}.md                        │
│              raw/assets/{images}                                │
│                                                                 │
│                          │                                      │
│   ┌──────────────────────▼──────────────────────────────────┐   │
│   │         INGESTION AGENT (Iris) TAKES OVER               │   │
│   │                                                         │   │
│   │   Read source → Extract entities/concepts →             │   │
│   │   Create/update wiki pages → Update index → Log         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

The pipeline has two distinct halves. The **top half** (format detection through frontmatter) is mechanical — it can be scripted, automated, or handled by CLI helper tools. The **bottom half** (the Ingestion Agent reading the converted markdown and compiling it into wiki pages) is where the LLM does its work. WikiForge generates both: the conversion scripts AND the agent instructions.

---

## 3. Format-Specific Converters

### 3.1 Web Articles & Blog Posts

**Primary tool: Obsidian Web Clipper**

Karpathy specifically recommends this. It's a browser extension that converts web pages to clean markdown with metadata extraction, and it saves directly into a configured vault folder. For WikiForge, that target folder is `raw/articles/`.

**How it integrates:**

The generated schema file (CLAUDE.md) should instruct the user to configure Obsidian Web Clipper to save clipped articles into the `raw/articles/` directory. The generated `wikiforge.yaml` includes the vault path so the clipper template can be auto-configured. The clipper supports custom templates — WikiForge generates a clipper template that automatically adds the right YAML frontmatter format:

```markdown
---
title: "{{title}}"
author: "{{author}}"
date: "{{date}}"
url: "{{url}}"
source_type: article
content_hash: ""  # filled by ingest script
ingested_at: ""   # filled by ingest script
status: raw
---

{{content}}
```

The clipper also supports rule-based template selection — you can set it to automatically use a specific template based on the domain (e.g., arXiv papers get an academic template, YouTube gets a video template).

**Fallback for CLI-only users:** The LLM agent itself can fetch URLs using web fetch tools (curl, `web_fetch` in Claude Code, etc.) and convert to markdown. The ingest workflow includes instructions for this:

```
If the user provides a URL:
1. Fetch the page content
2. Extract the article body (ignore nav, ads, footer)
3. Convert to markdown preserving headings, links, images, code blocks
4. Extract metadata: title, author, publication date
5. Save to raw/articles/{slug}.md with frontmatter
6. Download images to raw/assets/ and rewrite refs to local paths
```

**Key Karpathy insight on images:** He recommends downloading images locally rather than relying on URLs that may break. In Obsidian, this is done via Settings → Files and Links → Attachment folder path set to `raw/assets/`, then using the "Download attachments" hotkey (Ctrl+Shift+D) after clipping. The schema file should document this workflow explicitly.

---

### 3.2 Academic Papers (PDF)

**Primary tool: pymupdf4llm**

This is the best PDF-to-markdown converter for LLM consumption. It handles multi-column layouts, tables, headers, code blocks, and can extract images. It also has built-in OCR for scanned documents via Tesseract.

**WikiForge generates a Python helper script** at `.forge/tools/pdf-to-md.py`:

```python
#!/usr/bin/env python3
"""Convert PDF to markdown for ingestion into the research wiki."""

import sys
import pathlib
import hashlib
import datetime
import pymupdf4llm

def convert(pdf_path: str, output_dir: str = "raw/papers"):
    pdf = pathlib.Path(pdf_path)
    md_text = pymupdf4llm.to_markdown(
        str(pdf),
        write_images=True,
        image_path="raw/assets",
        image_format="png",
        dpi=200,
        header=False,  # strip repetitive page headers
        footer=False,  # strip page footers/numbers
    )

    # Generate content hash for provenance tracking
    content_hash = hashlib.sha256(md_text.encode()).hexdigest()[:16]

    # Build frontmatter
    now = datetime.datetime.now().isoformat()
    frontmatter = f"""---
title: "{pdf.stem}"
source_type: paper
source_file: "{pdf.name}"
content_hash: "{content_hash}"
ingested_at: "{now}"
status: raw
---

"""

    slug = pdf.stem.lower().replace(" ", "-")
    output = pathlib.Path(output_dir) / f"{slug}.md"
    output.write_text(frontmatter + md_text, encoding="utf-8")
    print(f"✓ Converted {pdf.name} → {output}")

if __name__ == "__main__":
    convert(sys.argv[1])
```

**For the LLM agent directly:** When a user says "ingest this paper" and provides a PDF path, the Ingestion Agent should instruct the user to run the conversion script first, OR (in agents like Claude Code that can execute shell commands) run it directly. The workflow handles both paths.

**Important nuance from Karpathy:** LLMs can't natively read markdown with inline images in one pass. The workaround documented in the LLM Wiki is to have the LLM read the text first, then view referenced images separately for additional context. The Ingestion Agent's workflow should include this two-pass approach:

```
Step 2a: Read the converted markdown text (ignore image references)
Step 2b: For each referenced image, view it separately and note
         what it shows (diagrams, charts, figures, equations)
Step 2c: Integrate visual information into the source summary
```

---

### 3.3 Audio & Video (Podcasts, Lectures, YouTube, Meeting Notes)

**Primary tool: Whisper (local) or agent-native transcription**

Audio/video sources need transcription before they can enter the wiki. The pipeline is: media file → transcript markdown → `raw/transcripts/`.

**WikiForge generates a transcription helper** at `.forge/tools/transcribe.sh`:

```bash
#!/bin/bash
# Transcribe audio/video to markdown using Whisper
# Requires: whisper (pip install openai-whisper) or insanely-fast-whisper

INPUT="$1"
BASENAME=$(basename "$INPUT" | sed 's/\.[^.]*$//')
OUTPUT="raw/transcripts/${BASENAME}.md"

# Use whisper for transcription
whisper "$INPUT" --model medium --output_format txt --output_dir /tmp

# Convert to markdown with frontmatter
cat > "$OUTPUT" <<EOF
---
title: "${BASENAME}"
source_type: transcript
source_file: "$(basename "$INPUT")"
ingested_at: "$(date -Iseconds)"
status: raw
---

$(cat "/tmp/${BASENAME}.txt")
EOF

echo "✓ Transcribed → $OUTPUT"
```

**For YouTube specifically:** The agent can use `yt-dlp` to download transcripts (many YouTube videos have auto-generated or manually created captions) without needing to run Whisper at all:

```bash
# Download YouTube transcript directly (no audio processing needed)
yt-dlp --write-auto-sub --sub-lang en --skip-download --convert-subs srt "$URL"
```

The Ingestion Agent workflow for video/audio sources should offer both paths and let the user choose based on what's available.

---

### 3.4 Images & Diagrams

Images are the one source type that doesn't convert *to* markdown — they stay as images. But they still need to be cataloged and made accessible to the LLM.

**Pipeline:**

1. Copy image to `raw/assets/{descriptive-name}.{ext}`
2. Create a companion markdown file in `raw/images/` that references it:

```markdown
---
title: "Architecture Diagram - Transformer Attention"
source_type: image
source_file: "assets/transformer-attention.png"
ingested_at: "2026-04-06T12:00:00"
status: raw
---

![Transformer Attention Diagram](../assets/transformer-attention.png)

<!-- The Ingestion Agent will view this image separately and add
     a textual description below during compilation -->
```

3. The Ingestion Agent views the image, generates a detailed textual description, and uses that description to create or update relevant wiki pages. The image itself is referenced but the *knowledge* extracted from it lives in the wiki as text.

This follows Karpathy's approach: images are supplementary context, not primary text. The LLM reads text first, then examines images for additional understanding.

---

### 3.5 Documents (DOCX, PPTX, XLSX)

**Primary tool: pandoc (DOCX/PPTX) or built-in LLM agent tools**

```bash
# DOCX to markdown
pandoc input.docx -t markdown -o raw/documents/output.md

# PPTX to markdown (extracts slide text, not great for visuals)
pandoc input.pptx -t markdown -o raw/documents/output.md
```

For XLSX/CSV data files, the converter should generate a markdown file with the data rendered as a table, plus metadata about the structure:

```markdown
---
title: "Q3 Revenue Data"
source_type: data
source_file: "q3-revenue.xlsx"
sheets: ["Summary", "By Region", "By Product"]
rows: 245
ingested_at: "2026-04-06T12:00:00"
status: raw
---

## Sheet: Summary

| Quarter | Revenue | Growth |
|---------|---------|--------|
| Q1      | $12.3M  | 15%    |
| Q2      | $14.1M  | 14.6%  |
| Q3      | $16.8M  | 19.1%  |

## Sheet: By Region
...
```

---

### 3.6 Code Repositories

For ingesting a code repo as a research source (e.g., studying an open-source project's architecture), the converter should generate a structured overview rather than dumping all code:

```markdown
---
title: "qmd - Local Markdown Search Engine"
source_type: code_repo
url: "https://github.com/tobi/qmd"
language: TypeScript
ingested_at: "2026-04-06T12:00:00"
status: raw
---

## Repository Structure
{tree output, 2 levels deep}

## README Summary
{extracted README content}

## Key Files
### src/search.ts
{relevant code excerpts}

### CLAUDE.md
{agent configuration, if present}
```

---

## 4. The Obsidian Integration Layer

Karpathy's workflow positions Obsidian as the **IDE** for the knowledge base — the human reads and browses the wiki through Obsidian while the LLM writes and maintains it. WikiForge should generate configurations that make this seamless.

### 4.1 Obsidian as the Viewer

The wiki is a folder of markdown files. Point Obsidian at the project root as a vault, and you immediately get:

- **Graph View** — visualize connections between wiki pages. Entities, concepts, sources all appear as nodes. Cross-references become edges. This is the best way to see the shape of your knowledge base — which concepts are hubs, which are orphans, where the gaps are.

- **Backlinks** — every wiki page automatically shows what links to it. When the Ingestion Agent adds a cross-reference from a new source summary to an existing entity page, the entity page's backlinks panel updates to show the new connection without any manual work.

- **Search** — Obsidian's built-in search is good for smaller wikis. For larger ones, qmd takes over (see section 5).

### 4.2 Wiki Link Format

The generated schema should configure the LLM to use Obsidian-style wikilinks for cross-references:

```markdown
<!-- Use this format for internal wiki links -->
See [[entities/transformer-architecture]] for details.
This contradicts claims in [[concepts/scaling-laws]].
Source: [[sources/kaplan-2020-scaling-laws]]
```

When the user selects "Obsidian-optimized" during the CLI questionnaire, the generator switches from standard markdown links (`[text](path.md)`) to wikilinks (`[[path]]`). The schema file documents whichever convention was chosen.

### 4.3 YAML Frontmatter for Dataview

Karpathy mentions the Dataview plugin — it runs queries over page frontmatter to generate dynamic tables. WikiForge generates page templates with Dataview-compatible frontmatter:

```markdown
---
type: entity           # entity | concept | source | comparison
aliases: [GPT-4, GPT4]
tags: [llm, openai, foundation-model]
first_mentioned: "2026-04-01"
source_count: 7
last_updated: "2026-04-06"
confidence: high       # high | medium | low | disputed
---
```

This enables queries in Obsidian like:

````markdown
```dataview
TABLE source_count, confidence, last_updated
FROM "wiki/entities"
SORT source_count DESC
```
````

The WikiForge CLI questionnaire's "Obsidian-optimized" option includes these Dataview-ready templates by default.

### 4.4 Obsidian Settings the Schema Should Document

The generated CLAUDE.md / schema file should include an **Obsidian Setup** section that tells the user:

1. **Open the project root as a vault** in Obsidian
2. **Settings → Files and Links → Attachment folder path**: set to `raw/assets/`
3. **Settings → Hotkeys**: bind "Download attachments" to `Ctrl+Shift+D`
4. **Install recommended plugins**: Dataview, Marp Slides (if slides output enabled), Git (for version history)
5. **Web Clipper configuration**: set default vault to this project, set clipping folder to `raw/articles/`, import the WikiForge clipper template

### 4.5 Marp for Slide Generation

Karpathy mentions Marp as a markdown-based slide format, and Obsidian has a plugin for it. When the user enables slide output during setup, WikiForge generates:

- A Marp template in `.forge/templates/slide-deck.md`
- A workflow `compile-slides.md` that instructs the Synthesis Agent to create Marp-formatted slides from wiki content
- Instructions in the schema for installing the Obsidian Marp plugin for previewing slides inline

---

## 5. Search & Navigation at Scale

### 5.1 The Index File (Small/Medium Scale)

For wikis with fewer than ~200 pages, Karpathy's approach works perfectly: `wiki/index.md` is a structured catalog of every page, organized by category. The LLM reads the index first to find relevant pages, then drills into them. No embeddings, no vector database, no infrastructure.

The generated `index.md` template:

```markdown
# Wiki Index

Last updated: 2026-04-06 | Total pages: 47 | Sources: 23

## Entities (19 pages)
- [[entities/openai]] — OpenAI, the AI research lab (7 sources)
- [[entities/transformer-architecture]] — The transformer architecture (12 sources)
...

## Concepts (15 pages)
- [[concepts/scaling-laws]] — Neural network scaling laws and predictions (5 sources)
- [[concepts/attention-mechanism]] — Self-attention and variants (8 sources)
...

## Sources (23 pages)
- [[sources/vaswani-2017-attention]] — "Attention Is All You Need" (2017)
- [[sources/kaplan-2020-scaling-laws]] — "Scaling Laws for Neural LMs" (2020)
...

## Comparisons (3 pages)
- [[comparisons/gpt4-vs-claude]] — Capability comparison (4 sources)
...
```

### 5.2 qmd (Medium/Large Scale)

For larger wikis, Karpathy specifically recommends **qmd** — Tobi Lütke's local search engine for markdown files. It combines BM25 keyword search, vector semantic search, and LLM re-ranking, all running on-device with no external dependencies.

**How WikiForge integrates qmd:**

When the user selects "qmd integration" during setup, the generator creates:

**`.forge/tools/setup-qmd.sh`** — a one-time setup script:

```bash
#!/bin/bash
# Initialize qmd for this research wiki

# Install qmd if needed
command -v qmd >/dev/null || npm install -g @tobilu/qmd

# Register the wiki as a qmd collection
qmd collection add wiki/ --name wiki --mask "**/*.md"

# Register raw sources as a separate collection
qmd collection add raw/ --name sources --mask "**/*.md"

# Add context so qmd understands what it's searching
qmd context add qmd://wiki "Research wiki pages - entities, concepts, source summaries"
qmd context add qmd://sources "Raw source documents - articles, papers, transcripts"

# Initial index
qmd update

# Generate embeddings for semantic search
qmd embed

echo "✓ qmd initialized. Use 'qmd query <question>' to search."
```

**Schema file additions** — the CLAUDE.md gets qmd-aware query instructions:

```markdown
## Searching the Wiki

For wikis under ~100 pages, read wiki/index.md to find relevant pages.

For larger wikis, use qmd:

### Quick keyword search (instant, no LLM)
qmd search "scaling laws transformer"

### Semantic search (finds conceptually related content)
qmd vsearch "how does model size affect performance"

### Full hybrid search with re-ranking (highest quality)
qmd query "what evidence exists for or against scaling laws"

After finding relevant pages, read them directly for full context.

### Keeping the index fresh
After any wiki update, run: qmd update
After major changes, rebuild embeddings: qmd embed
```

**qmd also has an MCP server** — for agents that support MCP (Claude Code, Cursor), the search becomes a native tool call rather than a shell command. The setup script can optionally start the MCP server:

```bash
# Start qmd MCP server (for Claude Code, Cursor, etc.)
qmd mcp --port 8181 --daemon
```

### 5.3 Simple grep-based Search (Minimal Setup)

For users who don't want qmd, WikiForge generates a basic search script:

```bash
#!/bin/bash
# Simple wiki search using ripgrep (rg) or grep
QUERY="$*"

if command -v rg &>/dev/null; then
    rg --type md -l -i "$QUERY" wiki/
else
    grep -rl -i "$QUERY" wiki/ --include="*.md"
fi
```

---

## 6. The Log File & Provenance

### 6.1 log.md Format

Karpathy emphasizes that `log.md` is an append-only chronological record. He specifically notes that if entries use a consistent prefix format, the log becomes parseable with Unix tools.

The generated log template and format:

```markdown
# Operation Log

## [2026-04-06T14:30:00] ingest | "Attention Is All You Need"
- Source: raw/papers/vaswani-2017-attention.md
- Pages created: entities/transformer-architecture, entities/vaswani
- Pages updated: concepts/attention-mechanism, index.md
- Content hash: a3f8c2...

## [2026-04-06T15:00:00] query | "How do scaling laws relate to emergent abilities?"
- Pages consulted: concepts/scaling-laws, concepts/emergent-abilities
- Answer saved to: comparisons/scaling-vs-emergence.md

## [2026-04-06T16:00:00] lint | Full wiki health check
- Contradictions found: 1 (scaling-laws vs kaplan-2020)
- Orphan pages: 2 (entities/chinchilla, concepts/mixture-of-experts)
- Missing pages suggested: entities/deepseek, concepts/distillation
```

This format lets you run:

```bash
# Last 5 operations
grep "^## \[" wiki/log.md | tail -5

# All ingestions
grep "ingest" wiki/log.md

# All lint passes
grep "lint" wiki/log.md
```

### 6.2 Content Hashing for Provenance

Every source gets a SHA-256 content hash recorded in its frontmatter and in the log. This serves two purposes:

1. **Staleness detection** — if a source file changes (e.g., a web article is updated and re-clipped), the hash mismatch signals that wiki pages derived from it may need re-compilation.

2. **Provenance tracking** — wiki pages can cite which source hashes they were compiled from. During a lint pass, the Lint Agent can verify that cited sources haven't changed since the wiki page was last updated.

---

## 7. Generated Workflow: Complete Ingest Flow

The Ingestion Agent's workflow (`.forge/workflows/ingest-source.md`) ties everything together. Here's the complete generated workflow:

```markdown
# Workflow: Ingest Source

## Trigger
User says "ingest", "process", "add", or provides a new source file/URL.

## Pre-flight
1. Determine source type from file extension, URL pattern, or user description
2. Check if a conversion step is needed:
   - PDF → run .forge/tools/pdf-to-md.py first
   - URL → fetch and convert to markdown (or confirm Web Clipper was used)
   - Audio/Video → run .forge/tools/transcribe.sh first
   - DOCX/PPTX → run pandoc conversion first
   - Markdown/text → ready to process directly
3. Verify the source file exists in raw/ with proper frontmatter
4. If frontmatter is missing, generate it (title, source_type, content_hash, ingested_at)

## Step 1: Read & Understand
- Read the full source markdown
- If the source references images, view key images separately for context
- Identify: key entities (people, orgs, tools, models, datasets)
- Identify: key concepts (theories, methods, frameworks, findings)
- Identify: claims that are novel, surprising, or potentially contradictory
- Discuss key takeaways with the user (unless in autonomous mode)

## Step 2: Create Source Summary
- Create wiki/sources/{slug}.md using the source-summary template
- Include: full metadata, 2-3 paragraph summary, key takeaways list,
  entities mentioned (with wiki links), concepts introduced (with wiki links),
  notable findings or claims (with confidence levels)

## Step 3: Update Entity Pages
For each significant entity mentioned in the source:
- If wiki/entities/{entity}.md exists:
  - Add new information from this source
  - Add citation: "According to [[sources/{slug}]], ..."
  - Update the source_count in frontmatter
  - Update last_updated timestamp
- If it doesn't exist:
  - Create it using the entity-page template
  - Include initial information from this source
  - Add cross-references to related entities

## Step 4: Update Concept Pages
Same pattern as entities, but for wiki/concepts/.

## Step 5: Flag Contradictions
- Compare new claims against existing wiki content
- If a contradiction is found:
  - Add a "⚠️ Disputed" section to the relevant wiki page
  - Document both positions with their sources
  - Set confidence: disputed in frontmatter
  - Note the contradiction in the log entry

## Step 6: Cross-Reference
- Add wiki links between new source summary and all touched pages
- Add wiki links between entity pages that co-occur in this source
- Verify no dead links were created

## Step 7: Update Index & Log
- Add new entries to wiki/index.md under appropriate categories
- Update existing index entries if source_count changed
- Append operation to wiki/log.md with full details
- If qmd is configured: run `qmd update` to refresh the search index

## Step 8: Report to User
- "✓ Ingested: {title}"
- "Pages created: {list}"
- "Pages updated: {list}"
- "Contradictions found: {count, if any}"
- "Suggested follow-ups: {questions or sources to investigate}"
```

---

## 8. What WikiForge Generates (Summary)

Based on the user's questionnaire answers, here's everything the CLI produces for ingestion:

| Generated Artifact | Purpose | Condition |
|----|----|----|
| `.forge/tools/pdf-to-md.py` | PDF → markdown via pymupdf4llm | If "Academic papers" selected |
| `.forge/tools/transcribe.sh` | Audio/video → markdown via Whisper | If "Podcasts" or "Video" selected |
| `.forge/tools/clip-template.json` | Obsidian Web Clipper template | If "Articles" selected |
| `.forge/tools/search.sh` | grep/ripgrep wiki search | Always |
| `.forge/tools/setup-qmd.sh` | Initialize qmd collections + embeddings | If "qmd integration" selected |
| `.forge/tools/stats.sh` | Wiki health stats (page count, orphans, etc.) | If "Stats script" selected |
| `.forge/agents/ingestion-agent.md` | Iris persona + responsibilities | Always |
| `.forge/workflows/ingest-source.md` | Complete ingest workflow | Always |
| `.forge/workflows/batch-ingest.md` | Process multiple sources at once | If "Batch" ingestion style selected |
| `.forge/templates/source-summary.md` | Template for wiki/sources/ pages | Always |
| `.forge/templates/entity-page.md` | Template for wiki/entities/ pages | Always |
| `.forge/templates/concept-page.md` | Template for wiki/concepts/ pages | Always |
| `wiki/index.md` | Initial empty index with category structure | Always |
| `wiki/log.md` | Initial empty log | Always |
| CLAUDE.md § Obsidian Setup | Obsidian configuration instructions | If Obsidian-optimized |
| CLAUDE.md § Search | qmd or grep search instructions | Always |
| CLAUDE.md § Ingestion | How to add new sources | Always |

Every piece is conditional on what the user selected in the questionnaire. A minimal setup (markdown-only sources, no Obsidian, no qmd) generates just the agent, workflow, templates, and a search script. A maximal setup generates the full toolkit.