import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { createViewCommand } from '../../../src/commands/view.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  program.addCommand(createViewCommand());
  return program;
}

describe('list command', () => {
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

  it('lists all tasks', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file]);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(output).toContain('Fix login timeout');
    expect(output).toContain('Add caching layer');
    expect(output).toContain('Refactor auth module');
  });

  it('filters by priority', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file, '--priority', 'high']);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(output).toContain('Fix login timeout');
    expect(output).not.toContain('Add caching layer');
  });

  it('filters by status', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file, '--status', 'done']);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(output).toContain('Refactor auth module');
    expect(output).not.toContain('Fix login timeout');
  });

  it('outputs JSON when --format json', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file, '--format', 'json']);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.tasks).toHaveLength(3);
    expect(parsed.count).toBe(3);
  });

  it('shows empty message when no tasks match filter', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file, '--priority', 'critical']);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(output).toContain('No tasks found');
  });

  it('sorts by priority', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node',
      'test',
      'view',
      '--file',
      file,
      '--sort',
      'priority',
      '--format',
      'json',
    ]);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    const priorities = parsed.tasks.map((t: { priority: string }) => t.priority);
    expect(priorities[0]).toBe('high');
  });

  it('filters by multiple statuses', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node',
      'test',
      'view',
      '--file',
      file,
      '--status',
      'todo,done',
      '--format',
      'json',
    ]);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(2);
    const statuses = parsed.tasks.map((t: { status: string }) => t.status);
    expect(statuses).toContain('todo');
    expect(statuses).toContain('done');
  });

  it('shows detail when ID positional given', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', 'Task 1', '--file', file, '--format', 'json']);
    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.task).toBeDefined();
    expect(parsed.task.id).toBe('Task 1');
  });

  it('errors for invalid ID', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'view', 'bogus', '--file', file]),
    ).rejects.toThrow('Invalid task ID');
  });

  it('errors for missing ID', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'view', 'Task 999', '--file', file]),
    ).rejects.toThrow();
  });

  it('--limit caps output and reports hidden count (json)', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'view', '--file', file, '--limit', '1', '--format', 'json',
    ]);
    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(1);
    expect(parsed.total).toBe(3);
    expect(parsed.hidden).toBe(2);
  });

  it('--limit text mode shows hidden footer', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'view', '--file', file, '--limit', '1']);
    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const joined = calls.map((c) => c[0]).join('\n');
    expect(joined).toContain('2 more not shown');
  });

  it('--limit 0 hides all and reports total as hidden', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'view', '--file', file, '--limit', '0', '--format', 'json',
    ]);
    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(0);
    expect(parsed.hidden).toBe(3);
  });

  it('rejects negative --limit', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'view', '--file', file, '--limit', '-1']),
    ).rejects.toThrow('Invalid --limit');
  });

  it('filters by --search', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'view', '--file', file, '--search', 'login', '--format', 'json',
    ]);
    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(1);
    expect(parsed.tasks[0].description).toContain('login');
  });

  it('filters by multiple scopes', async () => {
    const program = buildProgram();
    await program.parseAsync([
      'node',
      'test',
      'view',
      '--file',
      file,
      '--scope',
      'backend,general',
      '--format',
      'json',
    ]);

    const output: string = (console.log as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    const parsed = JSON.parse(output);
    expect(parsed.count).toBe(3);
  });
});
