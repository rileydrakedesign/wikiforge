---
name: wiki-stats
description: Produce a statistics and health dashboard for a markdown wiki folder: page counts by type, link density, hub and orphan pages, recent activity from log.md, and source coverage. Read-only. Use when asked how big or how healthy a wiki is, or what to work on next.
---
# Wiki Stats

## When to use

Use this skill when the user asks how large the wiki is, how connected it is, what changed
recently, or what to work on next. It only reads files and never edits the wiki. It needs a
folder of markdown pages; `log.md`, `raw/`, and frontmatter are used when present and
skipped when absent.

## Steps

1. **Locate the wiki root.** Use `wiki/` if it exists, otherwise the folder the user named.
   Set `WIKI` to that path. If a sibling `raw/` folder exists, set `RAW` to it.

2. **Count pages by type.** Prefer the frontmatter `type` and fall back to the parent folder:
   ```bash
   for f in $(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md' -not -name 'overview.md'); do
     t=$(sed -n '/^---$/,/^---$/p' "$f" | awk -F': *' '$1=="type"{print $2; exit}')
     echo "${t:-$(basename "$(dirname "$f")")}"
   done | sort | uniq -c | sort -rn
   ```

3. **Measure link density.** Count wikilinks per page and overall:
   ```bash
   total=$(grep -rhoE '\[\[[^]]+\]\]' "$WIKI" --include='*.md' | wc -l | tr -d ' ')
   pages=$(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md' | wc -l | tr -d ' ')
   echo "links=$total pages=$pages avg=$(awk "BEGIN{printf \"%.1f\", $total/($pages?$pages:1)}")"
   ```
   If the wiki uses standard markdown links, count `](...*.md)` instead.

4. **Find hubs and orphans.** Rank pages by inbound links:
   ```bash
   for f in $(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md'); do
     stem=$(basename "$f" .md)
     n=$(grep -rlF "[[$stem" "$WIKI" --include='*.md' | grep -v "index.md" | grep -vc "/$(basename "$f")$")
     printf '%s\t%s\n' "$n" "$stem"
   done | sort -rn > /tmp/wiki-inbound.tsv
   head -5 /tmp/wiki-inbound.tsv          # hubs
   awk -F'\t' '$1==0' /tmp/wiki-inbound.tsv  # orphans
   ```

5. **Summarize recent activity** from `log.md` if it exists. Entries follow
   `## [ISO-timestamp] operation | title`:
   ```bash
   grep -E '^## \[' "$WIKI/log.md" | sed -E 's/^## \[[^]]+\] ([a-z-]+).*/\1/' | sort | uniq -c | sort -rn
   grep -E '^## \[' "$WIKI/log.md" | tail -5
   ```
   Report operations by type, the five most recent entries, and days since the last
   `ingest` entry.

6. **Check source coverage** when `RAW` is set. Every raw file should have a summary page:
   ```bash
   find "$RAW" -type f -not -path '*/assets/*' | wc -l
   find "$WIKI/sources" -name '*.md' 2>/dev/null | wc -l
   ```
   Compute coverage as summaries divided by raw files. List raw files whose stem does not
   appear anywhere under `$WIKI/sources/`.

7. **Present the dashboard** with these sections in order: Page Counts, Link Health, Top
   Hubs, Orphans, Recent Activity, Source Coverage, Suggested Next Steps. Keep each section
   short. Base the suggestions on the numbers: un-ingested sources suggest ingesting them,
   orphans suggest cross-referencing or pruning, a long gap since the last ingest suggests
   finding new sources, and low link density suggests running `lint-wiki`.

## What good output looks like

```
Wiki stats for wiki/

Page Counts     42 pages — 18 entities, 15 concepts, 7 sources, 2 comparisons
Link Health     203 wikilinks, 4.8 per page, 0 broken
Top Hubs        acme-corp (14), retrieval-latency (9), vector-databases (8)
Orphans         2 — old-pricing-model, meeting-2025-03-notes
Recent Activity 31 ingest, 12 query, 4 lint; last ingest 3 days ago
Source Coverage 7 of 9 raw files summarized (78%) — missing: q3-report.pdf, podcast-ep-12.md

Next: ingest the 2 uncovered sources, then run lint-wiki to link the 2 orphans.
```

## When a command fails

- `grep: log.md: No such file`: there is no log. Skip the Recent Activity section and say so.
- `find: raw: No such file`: no raw folder. Skip Source Coverage and say so.
- Division shows `avg=0.0` with a nonzero page count: the wiki uses markdown links, not
  wikilinks. Recount with `grep -rhoE '\]\([^)]+\.md\)'`.
- Filenames with spaces break the `for f in $(find ...)` loops. Rerun with
  `find "$WIKI" ... -print0 | while IFS= read -r -d '' f; do ...; done`.
