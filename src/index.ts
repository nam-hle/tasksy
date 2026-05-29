import { Command } from 'commander';
import { createAddCommand } from './commands/add.js';
import { createViewCommand } from './commands/view.js';
import { createUpdateCommand } from './commands/update.js';
import { createRemoveCommand } from './commands/remove.js';
import { createInitCommand } from './commands/init.js';
import { createNextCommand } from './commands/next.js';
import { createStatsCommand } from './commands/stats.js';
import { createBatchCommand } from './commands/batch.js';
import { TasksyError } from './shared/errors.js';
import { loadCliConfig } from './shared/cli-config.js';

async function main(): Promise<void> {
  const config = await loadCliConfig();

  const program = new Command();
  program
    .name('tasksy')
    .description(
      'Manage tasks as markdown (TASKS.md). Token-efficient CLI for AI agents.\n' +
        'Workflow: init → add → view/next → update (status, notes) → remove.\n' +
        'IDs are prefixed (default "T-1"). All commands support --file, --format text|json, -q/--quiet.',
    )
    .version('0.1.0');

  program.addHelpText(
    'after',
    `
Examples:
  $ tasksy init
  $ tasksy add "Fix login bug" --priority high --type bug
  $ tasksy view --status todo --sort priority
  $ tasksy view T-3                       # detail view
  $ tasksy view --search "login"          # keyword filter
  $ tasksy update T-3 --status in-progress
  $ tasksy update T-3 --note "blocked on auth review"
  $ tasksy next                            # pick highest-priority unblocked
  $ tasksy stats
  $ echo '[{"action":"add","description":"x"}]' | tasksy batch

Tips:
  Use --format json for structured output, -q for ID-only piping.
  update --status validates transitions when configured; pass --force to override.`,
  );

  program.addCommand(createInitCommand());
  program.addCommand(createAddCommand(config));
  program.addCommand(createViewCommand(config));
  program.addCommand(createUpdateCommand(config));
  program.addCommand(createRemoveCommand());
  program.addCommand(createNextCommand(config));
  program.addCommand(createStatsCommand());
  program.addCommand(createBatchCommand());

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  if (err instanceof TasksyError) {
    console.error(err.message);
    process.exitCode = err.exitCode;
  } else {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
});
