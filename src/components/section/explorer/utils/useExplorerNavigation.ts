import { Accessor, createSignal, Setter } from 'solid-js';

interface ExplorerNavigationHandles {
  currentPath: Accessor<string>;
  setCurrentPath: Setter<string>;
  push: (path: string) => void;
  back: () => void;
  forward: () => void;
}

export function useExplorerNavigation(defaultPath: string): ExplorerNavigationHandles {
  const maxHistoryCount = 10;
  let backHistories: string[] = []; // old -> new
  let forwardHistories: string[] = []; // old -> new
  const [currentPath, setCurrentPath] = createSignal<string>(defaultPath);

  const push = (path: string) => {
    const current = currentPath();
    setCurrentPath(path);
    addBackHistory(current);
    forwardHistories = [];
  };
  const back = () => {
    const current = currentPath();
    if (backHistories.length === 0) return;
    const target = backHistories.pop();
    if (!target) return;
    setCurrentPath(target);
    addForwardHistory(current);
  };
  const forward = () => {
    const current = currentPath();
    if (forwardHistories.length === 0) return;
    const target = forwardHistories.pop();
    if (!target) return;
    setCurrentPath(target);
    addBackHistory(current);
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
    setCurrentPath,
    push,
    back,
    forward,
  };
}
