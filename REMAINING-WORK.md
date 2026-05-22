# Remaining Work — Closing the Cohesion Loop

Five implementation gaps remain between the current state of WikiForge (post-PR #3 on `main`) and the goal we set in the audit: a fully cohesive LLM Wiki scaffold where every primitive is either Karpathy-native or a universal lifecycle operation, with no silent drift between layers.

## Context — what's already done

The audit work landed in two passes:

1. **PR #2 (`claude/audit-llm-wiki-system-mYFIB`)** — generalized the framing (no more research-only language), added lifecycle frontmatter fields (`status`, `supersedes`, `superseded_by`, `last_verified`), added seven new skills (`update-overview`, `file-answer`, `resolve-contradiction`, `supersede-claim`, `deduplicate`, `decay-and-verify`, `periodic-digest`), flipped Linus to auto-fix-by-default with `--report-only` opt-out, and added four tools (`download-assets.sh`, `graph.html` + `build-graph.sh`, `watch-raw.sh`, `diff-wiki.sh`).

2. **PR #3 (`claude/cohesion-refactor`, merged into main)** — added the `--mode` per-invocation override, the `wforge-revise-schema` skill (schema co-evolves with use), `MaturityConfig` as tunable knobs, an Obsidian vault scaffold, smoke tests + CI, a raw/ immutability lint check, the agents-as-personas preamble, the outputs-as-views framing, the `Autonomous Wiki` preset, and a Lineage section in the README.

After both passes the system is roughly **90%** of the way to the goal. The remaining gaps are five concrete cohesion bugs that prevent the layered system from holding together end-to-end. None of them require new primitives — each is a wiring or consistency fix.

---

## Gap 1 — Ingest workflow sets source-summary fields that no longer exist

**File**: `templates/skills/workflows/ingest-source.workflow.md.hbs`

**Lines 71 and 120**: still write `status: processed` and `confidence: high` onto source summary frontmatter. Neither matches the current `source-summary.md.hbs` template:

- `status` is now a lifecycle field with values `current | superseded | archived | stub`. `processed` is not in that set.
- `confidence` no longer exists on source summaries (only on entities, concepts, and comparisons).

**Impact**: the new `lint-wiki` will flag every ingested source under "Frontmatter Issues — unknown `status` value" and "Unrecognized field: `confidence`". On a default-mode lint, it will then auto-normalize them, which silently rewrites every source summary the workflow just produced. That churn is real, and it will fire on every cycle.

**Fix**:
- Line 71 (raw frontmatter): drop the `status: processed` field entirely. Status on the raw side is implicit — the file exists in `raw/` so it's processed. If a tracking field is needed, use a distinct name like `ingest_state` so it doesn't collide with the lifecycle `status`.
- Line 120 (source summary frontmatter): drop `confidence: high`. Source summaries don't carry confidence; the claims they support do. Confidence belongs to entity/concept pages that cite the source.
- Verify line 73's `<check if="frontmatter exists with status: raw">` against the renamed/removed field and update accordingly.

**Effort**: 15 minutes. Highest priority because it's a daily, silent correctness drift.

---

## Gap 2 — Analysis and synthesis workflows are not lifecycle-aware

**Files**:
- `templates/skills/workflows/generate-comparison.workflow.md.hbs`
- `templates/skills/workflows/adversarial-review.workflow.md.hbs`
- `templates/skills/workflows/compile-output.workflow.md.hbs`
- `templates/skills/workflows/export-report.workflow.md.hbs`
- `templates/skills/workflows/generate-slides.workflow.md.hbs`

None of these workflows mention `status`, `superseded`, `superseded_by`, or `last_verified`. They pull from any page regardless of lifecycle state.

**Impact**: a deliverable (slide deck, report, comparison table) can silently include a claim from a page with `status: superseded`. The supersession is invisible to whoever reads the output. This undercuts the entire supersession primitive — there's no point in marking pages as superseded if downstream synthesis still treats them as live.

**Fix**: each workflow needs a single step early in the flow:

> **Lifecycle filter**: when reading source material from the wiki, skip pages with `status: superseded` or `status: archived` by default. If a superseded page is included intentionally (e.g., a historical comparison), surface that explicitly in the output — for example, an italic "historical" annotation in tables and a footnote linking to the superseding page.

Place this consistently — same wording, same step number across all five workflows — so the cohesion is visible at a glance.

Optional refinement: `last_verified` could drive a "freshness" annotation. If a page hasn't been verified in N days (using `decay_threshold_days` from runtime config), surface that in the deliverable too.

**Effort**: 1 hour across five files. Real correctness fix.

---

## Gap 3 — Agent persona one-liners drifted from updated principles

**Files**: `templates/agents/personas/*.md` (8 files, one per agent)

These one-to-two-sentence files load verbatim into each agent's generated SKILL.md as the persona block. They were not refreshed when PR #2 updated `src/generator/agents.ts`. Concrete drift:

- **`lint.md`** says "you systematically audit the wiki for structural problems… you make sure every link holds" — no mention of the auto-fix posture that's now the default. The agent's persona contradicts its own principles.
- **`research.md`** says "depth and **credibility** over volume" — but Rex's updated overview and principles now use **provenance** language consistently. Two different words in the same agent's prompt.
- **`ingestion.md`**, **`librarian.md`**, **`query.md`**, **`synthesis.md`** are unchanged but their owning agents picked up new capabilities (UO, FA, etc.) that the personas don't acknowledge.

**Impact**: each agent's prompt context contains internal contradictions. The LLM will resolve them inconsistently. Smaller than gap 1 or 2 but it's literal prompt rot — the contradiction goes straight into the model's context.

**Fix**:
- `lint.md`: add a clause acknowledging the auto-fix posture. "...and quietly fixes the mechanical issues himself rather than leaving every cleanup as homework."
- `research.md`: replace "credibility" with "provenance" to match the updated principles.
- Other six: read each, confirm it still describes its agent accurately; refresh if not.

**Effort**: 30 minutes. Touches eight small files.

---

## Gap 4 — `download-assets.sh` is shipped but never invoked

**File**: `templates/skills/workflows/ingest-source.workflow.md.hbs`, step 2 (the article-to-markdown branch)

The workflow currently says (line 36): *"Download images to `raw/assets/` and rewrite image refs to local paths — URLs break over time, local copies don't."* This is inline behavior; the standalone `download-assets.sh` tool is not referenced.

Meanwhile, `download-assets.sh` is generated when `articles` or `media` source types are enabled. So users see a tool that does the exact thing the workflow says to do, with no documentation about when to use which.

**Impact**: two implementations of the same thing. Either users invoke the tool manually and the inline step duplicates the work, or they don't invoke the tool and wonder what it's for.

**Fix** — pick one:

**Option A (recommended)**: wire the tool into the workflow. Replace the inline action with: *"Run `.forge/tools/download-assets.sh raw/articles/{slug}.md` to download remote images to `raw/assets/` and rewrite refs to local paths."* The tool already handles dedup-by-hash, so re-invocation is safe.

**Option B**: drop the tool entirely. The LLM can do the work inline via a few file edits. Reduces shipped surface area.

I'd take A — the tool is more correct (hash-based dedup across the whole wiki) than ad-hoc LLM-driven downloads.

**Effort**: 15 minutes.

---

## Gap 5 — Autonomous cycle skips the lifecycle skills

**File**: `templates/skills/workflows/web-research.workflow.md.hbs`, step 6, autonomous branch

The current autonomous chain is:

> research → fetch → ingest → cross-reference → reindex → lint → report

For mature wikis this is missing the lifecycle primitives. Specifically:

- **`decay-and-verify`** never runs. Pages age past their `last_verified` threshold silently. The whole decay system is unreachable from the autonomous loop.
- **`deduplicate`** never runs. Duplicate sources accumulate; the `content_hash`-based detection that lives in the skill is never consulted.

**Impact**: the LLM Wiki v2 lifecycle primitives we added are unreachable from autonomous mode. They only fire when a human manually invokes them — which defeats the autonomous loop's purpose of "agents handle the bookkeeping."

**Fix**:

In the autonomous branch of step 6, after `lint-wiki` runs, add a maturity-gated chain:

> If the wiki has more than `decay_threshold_days × 1.5` worth of activity since its last full decay pass (look in `wiki/log.md` for the most recent `decay-and-verify` entry), invoke `wforge-decay-and-verify` next.
>
> If the lint report flagged duplicate sources or pages, invoke `wforge-deduplicate` next.
>
> Then produce the cycle report.

Document the extended chain in the `Autonomy Model` section of `templates/schema/claude-code.md.hbs` (around lines 113–124) so the schema reflects what the agent actually does.

Same gating-by-maturity philosophy as the rest of autonomous mode: these chain in only on wikis that have accumulated enough state to need them.

**Effort**: 45 minutes. Closes the autonomous-loop circle.

---

## Sequencing

Recommended order (each builds on the previous):

1. **Gap 1** (ingest frontmatter) — eliminates a recurring lint false-positive that would otherwise hide real issues.
2. **Gap 3** (persona refresh) — small, independent, removes prompt contradictions.
3. **Gap 4** (download-assets wiring) — small, independent.
4. **Gap 2** (lifecycle filtering in analysis/synthesis) — needs gap 1 in place so source summaries are clean.
5. **Gap 5** (autonomous cycle chain) — needs gaps 1 and 2 because the cycle runs lint and synthesis as part of the chain.

Total effort: roughly half a day of focused work.

## Verification

After all five land, the system has these properties end-to-end:

- A fresh `wforge init --preset autonomous-wiki` followed by ingesting one source and running through the autonomous cycle should produce zero lint false-positives.
- A deliverable compiled from a wiki with at least one `status: superseded` page should either exclude that page or annotate its inclusion explicitly.
- Every agent's generated SKILL.md should be internally consistent — persona, overview, and principles agree.
- `download-assets.sh` should be invoked (or removed); no parallel implementations.
- A long-running autonomous wiki should automatically decay-verify and deduplicate without manual intervention.

The smoke test suite added in PR #3 should be extended with assertions for each: a `status: superseded` test fixture that confirms downstream filtering, a default-mode lint-after-ingest test that confirms zero false-positives on the new source summary shape, and a snapshot test for each agent's generated SKILL.md to catch persona drift early.

## Out of scope

For the same reasons as the original plan — these stay deliberately out of scope:

- No `project.kind` enum or per-use-case forks
- No additional presets beyond the five that exist
- No new agents beyond the eight that exist
- No domain-flavored page types (`decision`, `journal-entry`, `runbook`)
- No formal `EventsConfig` block (the `--mode` override plus `watch-raw.sh` cover this)

The goal remains: one cohesive LLM Wiki scaffold, faithful to Karpathy's spec and v2 discourse, configurable in scope but not forked by use case.
