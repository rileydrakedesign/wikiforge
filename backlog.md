# WikiForge Backlog

Items identified from auditing the codebase against Karpathy's LLM Wiki gist.

---

## 1. Autonomous Ingestion Style

`IngestionStyle` in `src/config/schema.ts` defines `"autonomous"` as a valid option, but the ingest-source workflow (`templates/skills/workflows/ingest-source.workflow.md.hbs`) only has conditional blocks for `"deliberate"` and `"batch"`. A user selecting "autonomous" gets no step 4b at all — the extraction happens silently with zero summary, which is accidental omission rather than intentional behavior.

**What needs to happen:**
- Add an `{{#if (eq config.workflows.ingestion_style "autonomous")}}` block in the ingest-source workflow
- Autonomous mode should: process without stopping for user confirmation (like batch), but also make judgment calls the user would normally make — deciding emphasis, whether to create new pages vs. update existing ones, resolving ambiguities by picking the most conservative interpretation
- Add autonomous handling in batch-ingest workflow as well
- Consider: should autonomous mode auto-trigger cross-reference and reindex after each ingestion?
- Document the three modes clearly in the generated CLAUDE.md schema

---

## 2. Organization-Driven Scaffolding

The `WikiOrganization` type offers 5 styles (`entity-first`, `topic-first`, `chronological`, `thesis-driven`, `custom`) but the generated directory structure is always identical: `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/comparisons/`. The organization config is only used as string interpolation in workflows ("Organize entries according to {{config.knowledge.organization}} structure"), leaving the LLM to interpret what that means with no structural support.

**What needs to happen:**
- **entity-first** (current default): `wiki/entities/`, `wiki/concepts/`, `wiki/sources/` — no changes needed
- **topic-first**: `wiki/topics/`, `wiki/sources/` — primary pages are broad topic areas with sub-sections, entities live within topic pages rather than standalone
- **chronological**: `wiki/timeline/`, `wiki/sources/`, `wiki/entities/` — primary organization is temporal, index sorted by date
- **thesis-driven**: `wiki/claims/`, `wiki/evidence/`, `wiki/counter-evidence/`, `wiki/sources/` — pages organized around assertions and their support/refutation
- **custom**: `wiki/pages/`, `wiki/sources/` — flat structure, user defines categories post-generation
- Update `scaffold.ts` to create organization-appropriate directories
- Update `index.md.hbs` to use organization-appropriate category headings
- Update page templates to match (e.g., thesis-driven needs a `claim-page.md` template)
- Update the ingest workflow to route extracted knowledge to the right directories per organization style

---

## 3. Growth Management

As wikis grow, entity and concept pages accumulate information from dozens of sources and become unwieldy. There is currently no guidance about page size, splitting, or archival. The lint agent checks structural health but not page bloat.

**What needs to happen:**
- Add page length guidelines to the generated CLAUDE.md (e.g., entity pages should stay under ~300 lines; if larger, split into sub-pages)
- Add a "page size check" step to the lint-wiki workflow that flags pages exceeding a threshold
- Add guidance in the ingest workflow for when an entity page is getting too large: split into `wiki/entities/{entity}/index.md` + `wiki/entities/{entity}/{subtopic}.md`
- Add a "review queue" concept — newly generated pages could be tagged `status: draft` in frontmatter so the human knows what hasn't been validated yet
- Add a "mentioned-but-uncreated" tracker — the lint workflow already does this (step 5), but the results should persist somewhere (e.g., `wiki/backlog.md` or a section in `overview.md`) so they're visible between lint runs
- Consider a summary-of-summaries pattern for large wikis: periodic "digest" pages that synthesize across many entity/concept pages

---

## 4. Compaction Strategies

Related to growth management but specifically about keeping the wiki navigable and the LLM's context window efficient as source count scales past ~100. Karpathy's commenters specifically flagged this: "without deliberate compaction strategies, wikis become unwieldy."

**What needs to happen:**
- Define compaction triggers (e.g., when entity page exceeds N sources, when wiki exceeds N total pages)
- **Source summary compaction**: After many sources cover the same entity, the per-source details become less important than the synthesized view. Old source summaries could be archived or condensed
- **Entity/concept page compaction**: Split verbose history into a "detailed history" sub-page, keep the main page as a current-state summary
- **Index compaction**: For large wikis, the flat index becomes unusable. Switch to hierarchical index with category pages that link to sub-indexes
- **Overview compaction**: The evolving synthesis section could grow indefinitely. Add guidance for periodically distilling it down to current understanding only
- Add a `wforge-compact` skill to the maintenance phase that the Librarian agent can invoke
- Make these strategies scale-aware — small wikis don't need compaction, medium wikis get gentle nudges, large wikis get active enforcement

---

## 5. Cosmetic Scale Config

The `ProjectScale` setting (`"small"` | `"medium"` | `"large"`) is collected during the CLI questionnaire and stored in the config, but it currently has **zero behavioral impact**. It appears only in display/metadata contexts: the generated CLAUDE.md header, README table, log metadata, and config.yaml. A "large" project generates the exact same workflows, thresholds, and guidance as a "small" project — the setting is purely cosmetic.

**What needs to happen:**
- **Small** (< ~50 sources expected): Current behavior is fine. Simple flat index, no compaction, relaxed page limits
- **Medium** (~50-200 sources): Add page length warnings to lint, suggest periodic compaction, enable hierarchical index sub-categories, add the compaction skill
- **Large** (200+ sources): Enforce page splitting thresholds, require periodic compaction runs, generate hierarchical index by default, add digest/summary-of-summaries templates, consider splitting overview.md into per-theme overviews
- Thread `scale` through workflow templates as conditionals (e.g., `{{#if (eq config.knowledge.scale "large")}}`)
- Add scale-appropriate guidance to the generated CLAUDE.md so the LLM operating the wiki knows what maintenance cadence to follow
- Consider: should scale affect which agents are recommended during questionnaire? (Large projects benefit more from Librarian + Lint)
