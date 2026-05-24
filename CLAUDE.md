# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

md-task — CLI for managing tasks as markdown files, optimized for AI agent token usage. Tasks stored in `TASKS.md` (default) as markdown with YAML frontmatter (schema config) + `### {prefix}{sep}{id}` headings and comma-separated tag lines.

## Commands

```bash
pnpm build          # Build with tsup (ESM, node22 target)
pnpm test           # Run all tests (vitest)
pnpm test -- tests/unit/commands/add.test.ts  # Run single test file
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint (strict typescript-eslint + prettier compat)
pnpm format         # Prettier --write
pnpm format:check   # Prettier --check (CI-friendly)
```

## Architecture

```
src/
  index.ts              # CLI entry — commander program, registers all subcommands
  core/
    config.ts           # TaskConfig type, YAML parsing, validation, ID formatting
    task.ts             # Task type, config-aware validation and defaults
    parser.ts           # Frontmatter extraction, markdown ↔ Task[] with config
    id.ts               # Auto-increment ID from existing tasks
  commands/
    init.ts             # Create empty TASKS.md (no frontmatter by default — convention over config)
    add.ts              # Add new task (--depends-on, --quiet)
    view.ts             # View tasks: list (filter/sort/limit/search) or detail by ID
    update.ts           # Update task fields (--note, --depends-on, --status w/ transition validation, --force)
    remove.ts           # Remove by ID
    next.ts             # Highest-priority actionable task (skips blocked + terminal)
    stats.ts            # Summary counts by status/priority/blocked
    batch.ts            # Bulk ops via JSON stdin (done/start retained as aliases)
  shared/
    file.ts             # fs read/write/exists wrappers
    output.ts           # Tab-delimited compact + detail formatters, JSON output
    errors.ts           # MdTaskError with exit codes (0=ok, 1=error, 2=not-found)
```

**Schema config**: Optional YAML frontmatter in `TASKS.md` overrides defaults for ID prefix/separator, field values (priority/type/status/scope), terminal statuses, transitions, and per-field defaults. Parsed by `config.ts`, passed through `TaskFile.config` to all consumers. **Convention over config**: `init` writes no frontmatter; `serializeConfigMinimal` emits only keys diverging from `DEFAULT_CONFIG`, so fully-default configs stay empty on disk.

**Status transitions**: Optional `transitions` map in frontmatter defines allowed status changes (e.g., `todo: [in-progress, cancelled]`). When absent, all transitions allowed. `update --status` validates against the map. `--force` bypasses validation. Case-insensitive matching preserves schema-defined casing.

**Pagination**: `view --limit N` caps output after filter+sort. No default limit. Hidden count surfaced in all output modes (text footer, JSON `hidden` field, stderr line in quiet mode).

**Data flow**: All commands follow the same pattern — read `TASKS.md` → `parseTaskFile()` (extracts frontmatter → config, then parses task blocks) → mutate `TaskFile` → `serializeTaskFile()` (writes minimal frontmatter + tasks) → write back.

**Output modes**: Every command supports `--format text|json` and `-q/--quiet` (minimal machine output — just IDs).

**File path**: Every command accepts `--file <path>` defaulting to `TASKS.md`.

**Task dependencies**: Tasks can declare `--depends-on 3,5`. `next` skips blocked tasks. `stats` reports blocked count.

**Batch operations**: `batch` reads JSON array from stdin, supports add/update/remove/done/start actions, reports per-action success/failure.

## Testing

Tests use vitest with globals enabled. All tests are in `tests/unit/` mirroring src structure. Tests use temp directories via `mkdtemp` for file I/O — no mocking of the filesystem. Batch tests mock `process.stdin` with `Readable` stream. Fixtures include frontmatter.

## CI

GitHub Actions runs typecheck → build → test on Node 22 and 24 against master.
