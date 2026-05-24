import { Command } from 'commander';
import { parseTaskFile } from '../core/parser.js';
import type { Task } from '../core/task.js';
import { readTasksFile, fileExists } from '../shared/file.js';
import { formatJson, formatTaskList, formatTaskDetail, taskWithFormattedId } from '../shared/output.js';
import { fileNotFound, taskNotFound, validationError } from '../shared/errors.js';
import { formatId, parseId, type TaskConfig, DEFAULT_CONFIG } from '../core/config.js';
import { valuesHelp } from '../shared/cli-config.js';

export function createViewCommand(config: TaskConfig = DEFAULT_CONFIG): Command {
  const cmd = new Command('view')
    .description('View tasks: list with filters/sort, or detail for one ID')
    .argument('[id]', 'Optional task ID for detail view')
    .option('--search <query>', 'Filter by keyword in description/notes (case-insensitive)')
    .option('--priority <value>', `Filter by priority (${valuesHelp(config.fields.priority)})`)
    .option('--type <value>', `Filter by type (${valuesHelp(config.fields.type)})`)
    .option('--status <value>', `Filter by status (${valuesHelp(config.fields.status)})`)
    .option(
      '--scope <value>',
      config.fields.scope
        ? `Filter by scope (${valuesHelp(config.fields.scope)})`
        : 'Filter by scope',
    )
    .option('--sort <field>', 'Sort by: priority/created/updated/status/id')
    .option('--limit <n>', 'Cap output to first N tasks (after filter+sort); hidden count reported')
    .option('--file <path>', 'Path to tasks file', 'TASKS.md')
    .option('--format <type>', 'Output format: text/json', 'text')
    .option('-q, --quiet', 'Minimal output (one ID per line)')
    .action(async (idStr: string | undefined, opts) => {
      const filePath: string = opts.file;
      const format: string = opts.format;

      if (!(await fileExists(filePath))) {
        throw fileNotFound(filePath);
      }

      const content = await readTasksFile(filePath);
      const taskFile = parseTaskFile(content);
      const config = taskFile.config;

      for (const warning of taskFile.warnings) {
        console.error(`warning: ${warning}`);
      }

      if (idStr) {
        const id = parseId(idStr, config);
        if (id === null) {
          throw validationError(
            `Invalid task ID: "${idStr}". Expected format: ${formatId(0, config).replace(/0$/, '<n>')}`,
          );
        }
        const task = taskFile.tasks.find((t) => t.id === id);
        if (!task) throw taskNotFound(formatId(id, config));

        if (opts.quiet) {
          console.log(formatId(task.id, config));
        } else if (format === 'json') {
          console.log(formatJson({ task: taskWithFormattedId(task, config) }));
        } else {
          console.log(formatTaskDetail(task, config));
        }
        return;
      }

      let tasks: Task[] = taskFile.tasks;

      const matchAny = (taskVal: string, csv: string): boolean =>
        csv.split(',').some((v) => v.trim().toLowerCase() === taskVal.toLowerCase());

      if (opts.priority) tasks = tasks.filter((t) => matchAny(t.priority, opts.priority as string));
      if (opts.scope) tasks = tasks.filter((t) => matchAny(t.scope, opts.scope as string));
      if (opts.type) tasks = tasks.filter((t) => matchAny(t.type, opts.type as string));
      if (opts.status) tasks = tasks.filter((t) => matchAny(t.status, opts.status as string));

      if (opts.search) {
        const q = (opts.search as string).toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            t.extraLines.some((line) => line.toLowerCase().includes(q)),
        );
      }

      if (opts.sort) {
        const field = opts.sort as string;
        const priorityOrder = Object.fromEntries(config.fields.priority.map((v, i) => [v, i]));
        const statusOrder = Object.fromEntries(config.fields.status.map((v, i) => [v, i]));
        tasks.sort((a, b) => {
          switch (field) {
            case 'priority':
              return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
            case 'status':
              return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
            case 'created':
              return a.created.localeCompare(b.created);
            case 'updated':
              return a.updated.localeCompare(b.updated);
            case 'id':
              return a.id - b.id;
            default:
              return 0;
          }
        });
      }

      const total = tasks.length;
      let limit: number | null = null;
      if (opts.limit !== undefined) {
        const parsed = parseInt(opts.limit as string, 10);
        if (isNaN(parsed) || parsed < 0) {
          throw validationError(`Invalid --limit: "${opts.limit as string}". Must be a non-negative integer.`);
        }
        limit = parsed;
        tasks = tasks.slice(0, parsed);
      }
      const shown = tasks.length;
      const hidden = total - shown;

      if (opts.quiet) {
        console.log(tasks.map((t) => formatId(t.id, config)).join('\n'));
        if (hidden > 0) {
          console.error(`${hidden} more not shown (--limit ${limit ?? 0}); raise --limit or refine filters.`);
        }
      } else if (format === 'json') {
        const out = tasks.map((t) => taskWithFormattedId(t, config));
        console.log(formatJson({ tasks: out, count: shown, total, hidden }));
      } else {
        console.log(formatTaskList(tasks, config));
        if (hidden > 0) {
          console.log(`\n... ${hidden} more not shown (--limit ${limit ?? 0}); raise --limit or refine filters.`);
        }
      }
    });
  cmd.addHelpText(
    'after',
    `
Examples:
  $ md-task view                            # all tasks
  $ md-task view T-3                        # detail for one task
  $ md-task view --status todo,in-progress  # multi-value filter (CSV)
  $ md-task view --search "auth"            # keyword match in description + notes
  $ md-task view --sort priority --format json`,
  );
  return cmd;
}
