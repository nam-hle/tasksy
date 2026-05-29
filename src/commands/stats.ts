import { Command } from 'commander';
import { parseTaskFile } from '../core/parser.js';
import { readTasksFile, fileExists } from '../shared/file.js';
import { formatJson } from '../shared/output.js';
import { fileNotFound, validationError } from '../shared/errors.js';
import type { Task } from '../core/task.js';
import type { TaskConfig } from '../core/config.js';

type GroupField = 'status' | 'priority' | 'type' | 'scope';
const GROUPABLE: GroupField[] = ['status', 'priority', 'type', 'scope'];

function countBy(tasks: Task[], field: GroupField, config: TaskConfig): Record<string, number> {
  const allowed = field === 'scope' ? config.fields.scope : config.fields[field];
  const out: Record<string, number> = {};
  if (allowed) {
    for (const v of allowed) out[v] = 0;
  }
  for (const t of tasks) {
    const v = t[field];
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

export function createStatsCommand(): Command {
  const cmd = new Command('stats')
    .description('Show task count summary; --by groups by one field')
    .option('--by <field>', `Group counts by one of: ${GROUPABLE.join('|')}`)
    .option('--file <path>', 'Path to tasks file', 'TASKS.md')
    .option('--format <type>', 'Output format: text/json', 'text')
    .option('-q, --quiet', 'Minimal output (just total count)')
    .action(async (opts) => {
      const filePath: string = opts.file;
      const format: string = opts.format;

      if (!(await fileExists(filePath))) {
        throw fileNotFound(filePath);
      }

      const content = await readTasksFile(filePath);
      const taskFile = parseTaskFile(content);
      const config = taskFile.config;
      const tasks = taskFile.tasks;

      const blocked = tasks.filter(
        (t) =>
          t.depends.length > 0 &&
          t.depends.some((depId) => {
            const dep = tasks.find((d) => d.id === depId);
            return !dep || !config.fields.terminal.includes(dep.status);
          }),
      ).length;

      if (opts.by) {
        const field = opts.by as string;
        if (!GROUPABLE.includes(field as GroupField)) {
          throw validationError(`Invalid --by field: "${field}". Use: ${GROUPABLE.join(', ')}`);
        }
        const counts = countBy(tasks, field as GroupField, config);
        const out = { total: tasks.length, by: field, counts, blocked };

        if (opts.quiet) {
          console.log(String(out.total));
        } else if (format === 'json') {
          console.log(formatJson(out));
        } else {
          const parts: string[] = [`Total: ${out.total} (by ${field})`];
          for (const [value, count] of Object.entries(counts)) {
            if (count > 0) parts.push(`  ${value}: ${count}`);
          }
          if (blocked > 0) parts.push(`Blocked: ${blocked}`);
          console.log(parts.join('\n'));
        }
        return;
      }

      const byStatus = countBy(tasks, 'status', config);
      const byPriority = countBy(tasks, 'priority', config);
      const stats = { total: tasks.length, byStatus, byPriority, blocked };

      if (opts.quiet) {
        console.log(String(stats.total));
      } else if (format === 'json') {
        console.log(formatJson(stats));
      } else {
        const parts: string[] = [`Total: ${stats.total}`];
        for (const [status, count] of Object.entries(byStatus)) {
          if (count > 0) parts.push(`  ${status}: ${count}`);
        }
        if (blocked > 0) parts.push(`Blocked: ${blocked}`);
        console.log(parts.join('\n'));
      }
    });
  cmd.addHelpText(
    'after',
    `
Examples:
  $ tasksy stats                 # default: by status + priority
  $ tasksy stats --by type       # group by type
  $ tasksy stats --by scope --format json`,
  );
  return cmd;
}
