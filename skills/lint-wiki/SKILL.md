---
name: lint-wiki
description: Health-check a markdown wiki folder (an LLM Wiki or any folder of interlinked .md pages). Finds broken wikilinks, orphan pages, pages missing from the index, and malformed frontmatter, fixes the mechanical issues, and reports the rest. Use when asked to lint, audit, or health-check a wiki, or after a batch of ingestions.
---
# Lint Wiki

## When to use

Use this skill when the user asks to lint, audit, or health-check a wiki, or after several
pages were added or renamed. It needs only a folder of markdown pages. A `wiki/index.md` and
`wiki/log.md` are used if present and created if missing. It does not need a scaffolded
WikiForge repo or `.forge/config.yaml`.

If the user passes `--report-only`, skip every fix and report everything.

## Posture

Fix what is pure bookkeeping. Report what changes meaning, confidence, or topology.

| Finding | Action |
|---|---|
| Page on disk not listed in `index.md` | Fix: add an entry with a one-line description |
| Wikilink to a page that does not exist | Fix: create a stub page with `status: stub`, then flag it |
| Frontmatter missing `type`, `title`, `last_updated`, or `status` | Fix: insert defaults (`status: current`, `last_updated` from file mtime) |
| Non-ISO dates in frontmatter | Fix: normalize when unambiguous |
| Page with no inbound links | Report as orphan |
| Two pages that contradict each other | Report only |
| Duplicate pages for the same subject | Report only |
| Stub pages still empty | Report only |

## Steps

1. **Locate the wiki root.** Use the `wiki/` folder if it exists, otherwise the folder the
   user named. Set `WIKI` to that path for the commands below.

2. **Catalog the pages.**
   ```bash
   find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md' | sort
   ```

3. **Find pages missing from the index.** For every page in the catalog, check whether its
   title or filename stem appears in `index.md`:
   ```bash
   for f in $(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md'); do
     stem=$(basename "$f" .md)
     grep -qiF "$stem" "$WIKI/index.md" || echo "MISSING FROM INDEX: $f"
   done
   ```
   Unless `--report-only`, add each missing page under the matching heading in `index.md`
   (Entities, Concepts, Sources, Comparisons, or Other) as `- [[stem]] — one-line summary`,
   taking the summary from the page's first paragraph.

4. **Find broken wikilinks.** Collect every `[[target]]` and check a file exists for it:
   ```bash
   grep -rhoE '\[\[[^]|#]+' "$WIKI" | sed 's/\[\[//' | sort -u | while read -r t; do
     find "$WIKI" -iname "$(echo "$t" | tr ' ' '-').md" -o -iname "$t.md" | grep -q . || echo "BROKEN LINK: [[$t]]"
   done
   ```
   Also check standard markdown links of the form `](relative/path.md)`. Unless
   `--report-only`, create a stub for each broken wikilink with this frontmatter and a single
   line saying the page was created to satisfy a link:
   ```markdown
   ---
   type: concept
   title: <Target>
   status: stub
   last_updated: <today ISO date>
   ---
   ```
   Keep stubs in the report so the user knows they need content.

5. **Find orphans.** A page is an orphan when no other page links to it:
   ```bash
   for f in $(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md'); do
     stem=$(basename "$f" .md)
     grep -rlF "[[$stem" "$WIKI" --include='*.md' | grep -v "/$(basename "$f")$" | grep -qv 'index.md' || echo "ORPHAN: $f"
   done
   ```
   Report orphans. Do not delete them.

6. **Check frontmatter.** For each page, read the block between the first two `---` lines.
   Required keys: `type`, `title`, `last_updated`, `status`. Unless `--report-only`, insert
   missing keys with defaults and normalize dates to `YYYY-MM-DD`. Report any `type` or
   `status` value you do not recognize instead of guessing.

7. **Read for contradictions and duplicates.** Open pages that share a subject (same entity
   named in two titles, or overlapping tags) and note claims that disagree. Report these; do
   not edit them.

8. **Write the report.** Two sections, Fixed and Unresolved, with counts, then a health
   score: the percentage of pages with no unresolved finding. Sort Unresolved by severity:
   contradictions and broken links, then orphans and stubs, then suggestions.

9. **Log the run.** Append to `$WIKI/log.md`, creating the file if needed:
   ```
   ## [<ISO-8601 timestamp>] lint-wiki | fixed: <N>, unresolved: <M>
   - <category>: <page>   (one bullet per fix applied)
   ```
   Add ` | report-only` to the heading when fixes were skipped.

## What good output looks like

```
Lint report for wiki/ — 42 pages, health 88%

Fixed (5)
- index: added wiki/entities/acme-corp.md
- stub: created wiki/concepts/retrieval-latency.md (linked from 3 pages)
- frontmatter: added status: current to 3 pages

Unresolved (5)
- CONTRADICTION: entities/acme-corp.md says founded 2014; sources/acme-s1.md says 2015
- ORPHAN: concepts/old-pricing-model.md (no inbound links)
- STUB: concepts/retrieval-latency.md needs content
```

## When a command fails

- `grep: wiki/index.md: No such file` means there is no index. Create one with headings
  for Entities, Concepts, Sources, and Comparisons, then rerun step 3.
- `find` returns nothing: the wiki path is wrong or the pages are not `.md`. Confirm the
  path with the user before changing anything.
- Filenames with spaces break the `for f in $(find ...)` loops. Rerun with
  `find "$WIKI" -name '*.md' -print0 | while IFS= read -r -d '' f; do ...; done`.
- If a fix would touch more than a quarter of the pages, stop, show the list, and ask
  before applying.
