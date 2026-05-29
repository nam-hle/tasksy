export const EXIT_SUCCESS = 0;
export const EXIT_ERROR = 1;
export const EXIT_NOT_FOUND = 2;

export class TasksyError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = EXIT_ERROR,
  ) {
    super(message);
    this.name = 'TasksyError';
  }
}

export function taskNotFound(id: number | string): TasksyError {
  return new TasksyError(`Task ${id} not found`, EXIT_NOT_FOUND);
}

export function fileNotFound(path: string): TasksyError {
  return new TasksyError(`No tasks file found at ${path}. Run: tasksy init`, EXIT_NOT_FOUND);
}

export function fileAlreadyExists(path: string): TasksyError {
  return new TasksyError(`Tasks file already exists: ${path}`);
}

export function validationError(message: string): TasksyError {
  return new TasksyError(message);
}
