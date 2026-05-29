---
name: tasksy
description: "Manage tasks as markdown files using the tasksy CLI. Use when the user wants to track tasks, create task lists, manage project work items, check task status, or plan work in a TASKS.md file. Covers adding, viewing, updating, removing, next-task selection, stats, and batch operations on markdown-based tasks with optional YAML frontmatter schema."
argument-hint: "[init|add|view|update|remove|next|stats|batch]"
allowed-tools: Bash(tasksy *), Read, Grep, Glob
---

# tasksy — Markdown Task Management

CLI for managing tasks as markdown files, optimized for AI agent token usage.

Tasks stored in `TASKS.md` (default) as markdown with optional YAML frontmatter (schema config) + `### {prefix}{sep}{id}` headings and comma-separated tag lines.

**Convention over config**: `tasksy init` writes minimal `# Tasks\n` only. Schema defaults apply silently. Add frontmatter only to override (id prefix, custom field values, transitions, etc.).

**ID format**: Commands taking an ID require prefixed form (e.g. `T-130`, not `130`). Default prefix `T`, separator `-`. Configurable via frontmatter. `--depends-on` lists also require prefixed IDs (`T-3,T-5`).

**Output**: Single-task output (text, JSON, quiet) renders task IDs in prefixed form. JSON `id` is the formatted string (e.g. `"T-94"`), not a number. Batch JSON input/output uses numeric `id` (machine contract).

**Tag-line order**: `priority/type/status/scope` order in each task block follows YAML `fields:` key order. Default: `status, type, priority, scope`. `created/updated/depends` always trail.

## Commands (8 total)

```bash
tasksy init                           # Create empty TASKS.md (no frontmatter by default)
tasksy add "description"              # Add task (auto-increments ID)
tasksy add "desc" --priority high     # With priority
tasksy add "desc" --depends-on T-3,T-5  # With dependencies (prefixed IDs required)

tasksy view                           # List all tasks
tasksy view T-1                       # Detail for one task (positional ID)
tasksy view --status todo,in-progress # Multi-value CSV filter
tasksy view --search "login"          # Keyword in description + notes
tasksy view --sort priority           # Sort: priority/created/updated/status/id
tasksy view --limit 10                # Cap output; reports hidden count

tasksy update T-1 --priority high     # Update fields
tasksy update T-1 --status done       # Transition status (validates if configured)
tasksy update T-1 --status done --force  # Bypass transition validation
tasksy update T-1 --note "blocked"    # Append a note
tasksy update T-1 --depends-on T-2,T-3  # Set dependencies
tasksy update T-1 --depends-on ""     # Clear dependencies
tasksy update T-1 --description "new"

tasksy remove T-1                     # Delete task
tasksy next                           # Highest-priority actionable (skips blocked + terminal)
tasksy next --type bug                # Filter
tasksy stats                          # Counts by status/priority/blocked
tasksy batch                          # Bulk ops via JSON stdin (see below)
```

## Common Options

All commands accept:
- `--file <path>` — task file path (default: `TASKS.md`)
- `--format text|json` — output format
- `-q, --quiet` — minimal output (just IDs)

`update --status` accepts `--force` to bypass transition validation.

## Pagination (`view --limit`)

No default limit. Pass `--limit N` to cap output. Hidden count always surfaced:
- Text: footer `... 23 more not shown (--limit 10); raise --limit or refine filters.`
- JSON: `{ count, total, hidden }` fields.
- Quiet: hidden count goes to **stderr** so piped IDs stay clean.

`--limit 0` returns nothing but reports `hidden = total` — useful for counting matches.

## Batch Operations

JSON array via stdin. Actions: `add`, `update`, `remove`, `done`, `start` (`done`/`start` are convenience aliases for status transitions).

```bash
echo '[
  {"action":"add","description":"task 1"},
  {"action":"update","id":3,"status":"done"},
  {"action":"update","id":2,"note":"started"},
  {"action":"remove","id":5}
]' | tasksy batch
```

## Task Fields

- **description** — task text
- **priority** — configurable (default: critical/high/medium/low)
- **status** — configurable (default: todo/in-progress/done/cancelled)
- **type** — configurable (default: feature/bug/task/chore)
- **scope** — freeform by default; can be constrained via frontmatter
- **depends-on** — comma-separated prefixed task IDs (blocks task from `next`)

## Status Transitions (Optional)

Define in YAML frontmatter:

```yaml
transitions:
  todo: [in-progress, cancelled]
  in-progress: [review, todo, cancelled]
  review: [done, in-progress]
  done: []
  cancelled: []
```

- Absent → all transitions allowed (backward compat).
- Present → `update --status` validates.
- `--force` overrides.
- Case-insensitive; schema casing preserved.

## Schema Configuration

Frontmatter is **opt-in**. Only override what diverges from defaults:

```yaml
---
id:
  prefix: BUG          # default: T
fields:
  priority: [p0, p1, p2, p3]
  status: [backlog, todo, in-progress, review, done, cancelled]
  terminal: [done, cancelled]
transitions:
  todo: [in-progress, cancelled]
defaults:
  priority: p1
---
```

Empty/absent frontmatter = full defaults.

## Workflow Tips for Agents

- `tasksy next -q` → just the next task ID, ready to pipe.
- `tasksy view --limit N` → bounded output for large backlogs; always check `hidden` count.
- `tasksy view --search "kw" --format json` → structured keyword search.
- `tasksy stats --format json` → project state at a glance.
- `tasksy batch` → bulk mutations in one invocation (token-efficient).
- Use `--quiet` for scripting; `--format json` for structured consumption.
- Exit codes: `0` ok, `1` error, `2` not-found.
