import { fs } from '~/utils/platform';

type FsOptions = Record<string, unknown> | undefined;

type JsonFileReadResult<T> =
  { kind: 'ok'; value: T } | { kind: 'not_found' } | { kind: 'read_error'; error: unknown } | { kind: 'parse_error'; error: unknown };

export interface JsonFileLoadHandlers<TResult, TParsed> {
  onNotFound: () => Promise<TResult> | TResult;
  onReadError: (error: unknown) => Promise<TResult> | TResult;
  onParseError: (error: unknown) => Promise<TResult> | TResult;
  onSuccess: (value: TParsed) => Promise<TResult> | TResult;
  onUnexpectedError: (error: unknown) => Promise<TResult> | TResult;
}

const toFsOptions = (baseDir: unknown): FsOptions => (baseDir ? { baseDir } : undefined);

async function readJsonFileWithStatus<T>(path: string, options: FsOptions): Promise<JsonFileReadResult<T>> {
  let exists = false;
  try {
    exists = options ? await fs.exists(path, options) : await fs.exists(path);
  } catch (_e) {
    // Let pass through as not existing
  }

  if (!exists) return { kind: 'not_found' };

  let content: string;
  try {
    content = await fs.readTextFile(path, options);
  } catch (error) {
    return { kind: 'read_error', error };
  }

  try {
    return {
      kind: 'ok',
      value: JSON.parse(content) as T,
    };
  } catch (error) {
    return { kind: 'parse_error', error };
  }
}

export async function loadJsonFileWithFallback<TResult, TParsed = unknown>(
  path: string,
  baseDir: unknown,
  handlers: JsonFileLoadHandlers<TResult, TParsed>
): Promise<TResult> {
  const options = toFsOptions(baseDir);
  try {
    const result = await readJsonFileWithStatus<TParsed>(path, options);
    switch (result.kind) {
      case 'not_found':
        return await handlers.onNotFound();
      case 'read_error':
        return await handlers.onReadError(result.error);
      case 'parse_error':
        return await handlers.onParseError(result.error);
      case 'ok':
        return await handlers.onSuccess(result.value);
    }
  } catch (error) {
    return await handlers.onUnexpectedError(error);
  }
}
