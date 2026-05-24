# md-task

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
md-task init

# Add tasks
md-task add "Fix login timeout" --priority high --type bug --scope backend
md-task add "Add caching layer" --type feature
md-task add "Write tests for auth" --depends-on T-1

# Work
md-task next                              # highest-priority actionable
md-task update T-1 --status in-progress   # transition (validates if transitions configured)
md-task update T-1 --status done

# View
md-task view                              # all tasks
md-task view T-1                          # detail for one task
md-task view --status todo,in-progress --sort priority
md-task view --search "login"
md-task view --limit 10                   # cap output, reports hidden count

# Update
md-task update T-2 --priority critical
md-task update T-2 --note "tried redis, too complex"

# Summary
md-task stats
```

## Commands

Eight verbs total:

| Command                     | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `md-task init`              | Create empty `TASKS.md`                              |
| `md-task add <description>` | Add a new task                                       |
| `md-task view [id]`         | List tasks (filter/sort/limit) or detail for one ID  |
| `md-task update <id>`       | Update fields (status changes validate transitions)  |
| `md-task remove <id>`       | Remove a task                                        |
| `md-task next`              | Highest-priority actionable task (skips blocked)     |
| `md-task stats`             | Summary counts by status/priority/blocked            |
| `md-task batch`             | Bulk operations from JSON stdin                      |

Run `md-task <cmd> --help` for arguments, options, and examples.

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

Applied when a field is omitted in `md-task add`.

## AI Agent Integration

### Output modes

```bash
md-task view                         # human-readable text (default)
md-task view --format json           # structured JSON
md-task view --quiet                 # minimal: IDs only, one per line
```

### Quiet mode (`-q`)

```bash
md-task add "Fix bug" -q             # → "T-1"
md-task next -q                      # → "T-3"
md-task view --status todo -q        # → "T-1\nT-3\nT-5"
```

### JSON mode

```bash
md-task view --format json
# → {"tasks":[...],"count":5,"total":5,"hidden":0}

md-task view --limit 2 --format json
# → {"tasks":[...],"count":2,"total":5,"hidden":3}

md-task next --format json
# → {"task":{"id":"T-1","description":"...","priority":"high",...}}

md-task stats --format json
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
]' | md-task batch
```

Reports per-action success/failure. Supported actions: `add`, `update`, `remove`, `done`, `start` (`done`/`start` retained as aliases for status transitions).

### Smart task selection

`md-task next` returns highest-priority actionable task:

- Prefers `in-progress` over `todo`.
- Sorts by priority (first value in `fields.priority` = highest).
- Skips tasks blocked by unfinished dependencies.
- Skips terminal statuses.
- Supports `--scope` and `--type` filters.

### Dependencies

```bash
md-task add "Deploy to prod" --depends-on T-1,T-2
md-task next                          # skips this task until T-1 and T-2 are terminal
md-task stats                         # reports blocked count
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
md-task view --status todo,in-progress
md-task view --priority critical,high --scope backend
md-task view --type bug,feature --sort priority
```

### Notes

```bash
md-task update T-3 --note "tried approach X, failed due to Y"
md-task update T-3 --note "switching to approach Z"
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
