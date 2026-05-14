export class CodedError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CodedError';
  }
}

export function toErrorResponse(err: unknown): { code: string; message: string } {
  if (err instanceof CodedError) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    return { code: 'INTERNAL', message: err.message };
  }
  return { code: 'INTERNAL', message: String(err) };
}
