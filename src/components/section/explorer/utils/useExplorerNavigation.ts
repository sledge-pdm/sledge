import { Accessor, createSignal } from 'solid-js';

interface ExplorerNavigationOptions<T> {
  /** reads what the explorer shows for a path. a throw means the path cannot be opened. */
  read: (path: string) => Promise<T>;
  /** called when a read fails. the current path and the histories are left as they were. */
  onReadError?: (path: string, error: unknown) => void | Promise<void>;
}

interface ExplorerNavigationHandles<T> {
  currentPath: Accessor<string>;
  /** what `read` returned for `currentPath`; undefined until a path has been opened. */
  content: Accessor<T | undefined>;
  /** opens a path without touching the histories. used for the initial path. */
  replace: (path: string) => Promise<boolean>;
  push: (path: string) => Promise<boolean>;
  back: () => Promise<boolean>;
  forward: () => Promise<boolean>;
}

/**
 * @description path history of the explorer. a path becomes current only after it has been read, so a path
 *   that cannot be opened never shows up in the breadcrumbs or in the back/forward histories.
 */
export function useExplorerNavigation<T>(options: ExplorerNavigationOptions<T>): ExplorerNavigationHandles<T> {
  const maxHistoryCount = 10;
  let backHistories: string[] = []; // old -> new
  let forwardHistories: string[] = []; // old -> new
  const [currentPath, setCurrentPath] = createSignal<string>('');
  const [content, setContent] = createSignal<T | undefined>(undefined);

  // a read that finishes after a newer navigation has started is dropped.
  let requestToken = 0;

  const open = async (path: string, commit: () => void): Promise<'opened' | 'failed' | 'superseded'> => {
    const token = ++requestToken;
    let result: T;
    try {
      result = await options.read(path);
    } catch (e) {
      if (token !== requestToken) return 'superseded';
      await options.onReadError?.(path, e);
      return 'failed';
    }
    if (token !== requestToken) return 'superseded';
    commit();
    setContent(() => result);
    setCurrentPath(path);
    return 'opened';
  };

  const replace = async (path: string) => (await open(path, () => {})) === 'opened';

  const push = async (path: string) => {
    const status = await open(path, () => {
      const current = currentPath();
      if (current) addBackHistory(current);
      forwardHistories = [];
    });
    return status === 'opened';
  };

  const back = async () => {
    const target = backHistories.at(-1);
    if (!target) return false;
    const current = currentPath();
    const status = await open(target, () => {
      backHistories.pop();
      addForwardHistory(current);
    });
    // a path that can no longer be opened is not worth going back to again.
    if (status === 'failed' && backHistories.at(-1) === target) backHistories.pop();
    return status === 'opened';
  };

  const forward = async () => {
    const target = forwardHistories.at(-1);
    if (!target) return false;
    const current = currentPath();
    const status = await open(target, () => {
      forwardHistories.pop();
      addBackHistory(current);
    });
    if (status === 'failed' && forwardHistories.at(-1) === target) forwardHistories.pop();
    return status === 'opened';
  };

  const addBackHistory = (path: string) => {
    backHistories.push(path);
    while (backHistories.length > maxHistoryCount) {
      backHistories.shift();
    }
  };
  const addForwardHistory = (path: string) => {
    forwardHistories.push(path);
    while (forwardHistories.length > maxHistoryCount) {
      forwardHistories.shift();
    }
  };

  return {
    currentPath,
    content,
    replace,
    push,
    back,
    forward,
  };
}
