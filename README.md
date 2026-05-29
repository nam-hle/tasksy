# tasksy

CLI for managing tasks as markdown files, optimized for AI agent token usage.

Tasks live in a plain `TASKS.md` file that's human-readable and version-control friendly. Every command supports `--format json` and `--quiet` modes so AI agents can parse output without wasting tokens.

## Install

```bash
# Requires Node.js >= 22
pnpm install
pnpm build

# Link globally (optional)
pnpm link --global
```

## Quick Start

```bash
# Initialize
tasksy init

# Add tasks
tasksy add "Fix login timeout" --priority high --type bug --scope backend
tasksy add "Add caching layer" --type feature
tasksy add "Write tests for auth" --depends-on T-1

# Work
tasksy next                              # highest-priority actionable
tasksy update T-1 --status in-progress   # transition (validates if transitions configured)
tasksy update T-1 --status done

# View
tasksy view                              # all tasks
tasksy view T-1                          # detail for one task
tasksy view --status todo,in-progress --sort priority
tasksy view --search "login"
tasksy view --limit 10                   # cap output, reports hidden count

# Update
tasksy update T-2 --priority critical
tasksy update T-2 --note "tried redis, too complex"

# Summary
tasksy stats
```

## Commands

Eight verbs total:

| Command                     | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `tasksy init`              | Create empty `TASKS.md`                              |
| `tasksy add <description>` | Add a new task                                       |
| `tasksy view [id]`         | List tasks (filter/sort/limit) or detail for one ID  |
| `tasksy update <id>`       | Update fields (status changes validate transitions)  |
| `tasksy remove <id>`       | Remove a task                                        |
| `tasksy next`              | Highest-priority actionable task (skips blocked)     |
| `tasksy stats`             | Summary counts by status/priority/blocked            |
| `tasksy batch`             | Bulk operations from JSON stdin                      |

Run `tasksy <cmd> --help` for arguments, options, and examples.

## File Format

`TASKS.md` is just markdown. Optional YAML frontmatter customizes the schema; absent frontmatter uses sane defaults (convention over config).

Minimal default `TASKS.md` (what `init` writes):

```markdown
# Tasks
```

With customization:

```markdown
---
id:
  prefix: BUG
fields:
  priority: [p0, p1, p2, p3]
---

# Tasks

### BUG-1

Fix login timeout
status:todo, type:bug, priority:p0, scope:backend, created:2026-05-24, updated:2026-05-24

> tried redis, too complex
> switching to in-memory LRU
```

Each task block has:

- **Line 1** (after `### {prefix}{sep}{id}`): Description
- **Line 2**: Comma-separated tags (`status`, `type`, `priority`, `scope`, `created`, `updated`, optionally `depends`)
- **Remaining lines**: Notes (conventionally prefixed with `>`)

## Schema Customization

Frontmatter is **opt-in** — only override what you need. Anything omitted falls back to defaults.

### ID format

```yaml
id:
  prefix: BUG       # default: T
  separator: '-'    # default: -
```

Produces headings like `### BUG-1`.

### Field values

```yaml
fields:
  priority: [p0, p1, p2, p3]
  type: [feature, bug, task, chore, spike, epic]
  status: [backlog, todo, in-progress, review, done, cancelled]
  scope: [frontend, backend, infra, docs]
  terminal: [done, cancelled]
```

- **Strict validation**: only listed values accepted (case-insensitive match, schema casing preserved).
- **Array order = rank**: first priority highest, first status most active.
- **`terminal`**: statuses `next` skips.
- **`scope`**: omit to keep freeform.

### Status transitions (optional)

```yaml
transitions:
  todo: [in-progress, cancelled]
  in-progress: [review, todo, cancelled]
  review: [done, in-progress]
  done: []
  cancelled: []
```

- Absent → all transitions allowed (backward compatible).
- Present → `update --status` validates against the map.
- `--force` bypasses validation.

### Defaults

```yaml
defaults:
  priority: p1
  type: task
  status: backlog
  scope: backend
```

Applied when a field is omitted in `tasksy add`.

## AI Agent Integration

### Output modes

```bash
tasksy view                         # human-readable text (default)
tasksy view --format json           # structured JSON
tasksy view --quiet                 # minimal: IDs only, one per line
```

### Quiet mode (`-q`)

```bash
tasksy add "Fix bug" -q             # → "T-1"
tasksy next -q                      # → "T-3"
tasksy view --status todo -q        # → "T-1\nT-3\nT-5"
```

### JSON mode

```bash
tasksy view --format json
# → {"tasks":[...],"count":5,"total":5,"hidden":0}

tasksy view --limit 2 --format json
# → {"tasks":[...],"count":2,"total":5,"hidden":3}

tasksy next --format json
# → {"task":{"id":"T-1","description":"...","priority":"high",...}}

tasksy stats --format json
# → {"total":5,"byStatus":{...},"byPriority":{...},"blocked":1}
```

### Pagination

`view` has **no default limit** — all matching tasks return. Pass `--limit N` to cap output. Hidden count is always surfaced:

- Text: footer line `... 23 more not shown (--limit 10); raise --limit or refine filters.`
- JSON: `{ count, total, hidden }` fields.
- Quiet: IDs on stdout stay clean; notice goes to **stderr** so pipes don't break.

### Batch operations

```bash
echo '[
  {"action":"add","description":"Task A","priority":"high"},
  {"action":"update","id":3,"status":"done"},
  {"action":"update","id":2,"status":"in-progress","note":"started work"},
  {"action":"remove","id":5}
]' | tasksy batch
```

Reports per-action success/failure. Supported actions: `add`, `update`, `remove`, `done`, `start` (`done`/`start` retained as aliases for status transitions).

### Smart task selection

`tasksy next` returns highest-priority actionable task:

- Prefers `in-progress` over `todo`.
- Sorts by priority (first value in `fields.priority` = highest).
- Skips tasks blocked by unfinished dependencies.
- Skips terminal statuses.
- Supports `--scope` and `--type` filters.

### Dependencies

```bash
tasksy add "Deploy to prod" --depends-on T-1,T-2
tasksy next                          # skips this task until T-1 and T-2 are terminal
tasksy stats                         # reports blocked count
```

### Exit codes

| Code | Meaning                                                  |
| ---- | -------------------------------------------------------- |
| `0`  | Success                                                  |
| `1`  | Error (validation, parse error)                          |
| `2`  | Not found (task/file not found, no results from `next`)  |

### Filters

Multi-value CSV filters:

```bash
tasksy view --status todo,in-progress
tasksy view --priority critical,high --scope backend
tasksy view --type bug,feature --sort priority
```

### Notes

```bash
tasksy update T-3 --note "tried approach X, failed due to Y"
tasksy update T-3 --note "switching to approach Z"
```

Persist as `> ` prefixed lines in the markdown.

## Global Options

All commands accept:

| Option            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `--file <path>`   | Path to tasks file (default: `TASKS.md`)          |
| `--format <type>` | Output format: `text` or `json` (default: `text`) |
| `-q, --quiet`     | Minimal machine-parseable output                  |

## Default Schema

Used when frontmatter is absent or partial:

| Attribute  | Default Values                             | Default   |
| ---------- | ------------------------------------------ | --------- |
| `priority` | `critical`, `high`, `medium`, `low`        | `medium`  |
| `type`     | `feature`, `bug`, `task`, `chore`          | `task`    |
| `status`   | `todo`, `in-progress`, `done`, `cancelled` | `todo`    |
| `scope`    | Freeform (any string)                      | `general` |
| `id`       | prefix `T`, separator `-` (→ `T-1`)        | —         |
| `terminal` | `done`, `cancelled`                        | —         |

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
pnpm lint
pnpm format
```

## License

MIT
