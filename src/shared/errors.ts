export const EXIT_SUCCESS = 0;
export const EXIT_ERROR = 1;
export const EXIT_NOT_FOUND = 2;

export class TaskdownError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = EXIT_ERROR,
  ) {
    super(message);
    this.name = 'TaskdownError';
  }
}

export function taskNotFound(id: number | string): TaskdownError {
  return new TaskdownError(`Task ${id} not found`, EXIT_NOT_FOUND);
}

export function fileNotFound(path: string): TaskdownError {
  return new TaskdownError(`No tasks file found at ${path}. Run: tasksy init`, EXIT_NOT_FOUND);
}

export function fileAlreadyExists(path: string): TaskdownError {
  return new TaskdownError(`Tasks file already exists: ${path}`);
}

export function validationError(message: string): TaskdownError {
  return new TaskdownError(message);
}
