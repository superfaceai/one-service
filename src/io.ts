import { access } from 'fs/promises';
import { inspect } from 'util';

export function assertIsIOError(
  error: unknown,
): asserts error is { code: string } {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: Record<string, any> = error;
    if (typeof err.code === 'string') {
      return;
    }
  }

  throw new Error(`unexpected error: ${inspect(error)}`);
}

export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
  } catch (err: unknown) {
    assertIsIOError(err);

    // Allow `ENOENT` because it answers the question.
    if (err.code === 'ENOENT') {
      return false;
    }

    // Rethrow other errors.
    throw err;
  }

  // No error, no problem.
  return true;
}
