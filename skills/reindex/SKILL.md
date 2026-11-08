---
name: reindex
description: Rebuild the index.md of a markdown wiki folder from the pages on disk, grouped by page type and sorted by title, and verify that every wikilink resolves. Use when the index is stale, missing, or out of order, or after pages were renamed or moved.
---
# Reindex

## When to use

Use this skill when `index.md` is missing, lists pages that no longer exist, or omits pages
that do. It needs only a folder of markdown pages, with or without YAML frontmatter. Run
`lint-wiki` instead when the user wants a full health check; run this when they want the
index rebuilt.

## Steps

1. **Locate the wiki root.** Use `wiki/` if it exists, otherwise the folder the user named.
   Set `WIKI` to that path.

2. **Back up the current index** so nothing is lost if the rebuild is wrong:
   ```bash
   [ -f "$WIKI/index.md" ] && cp "$WIKI/index.md" "$WIKI/index.md.bak"
   ```

3. **Catalog every page with its type and title.** Read frontmatter when present and fall
   back to the parent folder name and the first `# ` heading:
   ```bash
   for f in $(find "$WIKI" -name '*.md' -not -name 'index.md' -not -name 'log.md' -not -name 'overview.md'); do
     type=$(sed -n '/^---$/,/^---$/p' "$f" | awk -F': *' '$1=="type"{print $2; exit}')
     title=$(sed -n '/^---$/,/^---$/p' "$f" | awk -F': *' '$1=="title"{print $2; exit}')
     [ -z "$type" ] && type=$(basename "$(dirname "$f")")
     [ -z "$title" ] && title=$(grep -m1 '^# ' "$f" | sed 's/^# //')
     printf '%s\t%s\t%s\n' "$type" "${title:-$(basename "$f" .md)}" "$f"
   done | sort
   ```

4. **Detect naming problems before writing.** Two pages with the same title, or filenames
   that differ only in case or slug style, are duplicates or inconsistencies. Report them;
   do not rename files. Renaming changes link targets across the wiki and needs the user's
   decision.

5. **Verify wikilinks resolve.**
   ```bash
   grep -rhoE '\[\[[^]|#]+' "$WIKI" | sed 's/\[\[//' | sort -u | while read -r t; do
     find "$WIKI" -iname "$(echo "$t" | tr ' ' '-').md" -o -iname "$t.md" | grep -q . || echo "BROKEN LINK: [[$t]]"
   done
   ```
   List broken links in the report. Do not create stubs here; that is `lint-wiki`'s job.

6. **Write the new index.** Group by type in this order: Entities, Concepts, Sources,
   Comparisons, then any other type alphabetically. Within a group, sort by title. Each
   entry is `- [[filename-stem]] — one-line description` taken from the page's first body
   paragraph, trimmed to one sentence. Put a header at the top:
   ```markdown
   # Wiki Index

   Last updated: <today ISO date>
   Pages: <total> (<n> entities, <n> concepts, <n> sources, <n> comparisons)
   ```
   If the wiki uses standard markdown links instead of wikilinks (check an existing page),
   write `[Title](relative/path.md)` entries instead.

7. **Diff against the backup** and confirm nothing was dropped unintentionally:
   ```bash
   [ -f "$WIKI/index.md.bak" ] && diff "$WIKI/index.md.bak" "$WIKI/index.md"
   ```
   Entries that disappeared should correspond to files that no longer exist. If an entry
   vanished for any other reason, fix the index before continuing. Remove the backup when
   the diff looks right.

8. **Log the run.** Append to `$WIKI/log.md`, creating the file if needed:
   ```
   ## [<ISO-8601 timestamp>] reindex | <total> pages indexed, <n> broken links, <n> naming issues
   ```

## What good output looks like

```
Reindexed wiki/ — 42 pages (18 entities, 15 concepts, 7 sources, 2 comparisons)
Added 3 entries, removed 1 (file deleted: sources/draft-notes.md)
Broken links: 1 — [[Vector DB Benchmarks]] referenced from concepts/retrieval-latency.md
Naming issues: 1 — entities/AcmeCorp.md and entities/acme-corp.md look like duplicates
```

## When a command fails

- `awk` prints nothing for `type` or `title`: the page has no frontmatter. The fallback to
  folder name and first heading handles this. If a page has neither, use the filename stem.
- Filenames with spaces break the `for f in $(find ...)` loop. Rerun with
  `find "$WIKI" ... -print0 | while IFS= read -r -d '' f; do ...; done`.
- `diff` shows many unexpected removals: restore with `mv "$WIKI/index.md.bak" "$WIKI/index.md"`
  and check whether `WIKI` pointed at a subfolder instead of the wiki root.
- If `index.md` has hand-written sections that are not page lists (a reading guide, for
  example), keep those sections verbatim above the generated groups and say so in the report.
