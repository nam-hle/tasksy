import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { createUpdateCommand } from '../../../src/commands/update.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function buildUpdateProgram() {
  const program = new Command();
  program.exitOverride();
  program.addCommand(createUpdateCommand());
  return program;
}

describe('status transitions in commands', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tasksy-test-'));
    file = join(dir, 'TASKS.md');
    const fixture = readFileSync(join(FIXTURES, 'transitions.md'), 'utf-8');
    await writeFile(file, fixture, 'utf-8');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  describe('update command', () => {
    it('allows valid transition: todo → in-progress', async () => {
      const program = buildUpdateProgram();
      await program.parseAsync([
        'node', 'test', 'update', 'Task 1', '--file', file, '--status', 'in-progress',
      ]);
      const content = await readFile(file, 'utf-8');
      expect(content).toContain('status:in-progress');
    });

    it('rejects invalid transition: todo → done', async () => {
      const program = buildUpdateProgram();
      await expect(
        program.parseAsync([
          'node', 'test', 'update', 'Task 1', '--file', file, '--status', 'done',
        ]),
      ).rejects.toThrow('Cannot transition from "todo" to "done"');
    });

    it('rejects transition from terminal: done → todo', async () => {
      const program = buildUpdateProgram();
      await expect(
        program.parseAsync([
          'node', 'test', 'update', 'Task 3', '--file', file, '--status', 'todo',
        ]),
      ).rejects.toThrow('Cannot transition from "done" to "todo"');
    });

    it('allows invalid transition with --force', async () => {
      const program = buildUpdateProgram();
      await program.parseAsync([
        'node', 'test', 'update', 'Task 1', '--file', file, '--status', 'done', '--force',
      ]);
      const content = await readFile(file, 'utf-8');
      expect(content).toContain('status:done');
    });
  });

});

describe('no transitions defined (backward compat)', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tasksy-test-'));
    file = join(dir, 'TASKS.md');
    const fixture = readFileSync(join(FIXTURES, 'valid.md'), 'utf-8');
    await writeFile(file, fixture, 'utf-8');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it('allows any transition when no transitions configured', async () => {
    const program = buildUpdateProgram();
    await program.parseAsync([
      'node', 'test', 'update', 'Task 1', '--file', file, '--status', 'done',
    ]);
    const content = await readFile(file, 'utf-8');
    expect(content).toContain('status:done');
  });
});
