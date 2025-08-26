import { BottomBarKind, setLogStore, toolStore } from '~/stores/EditorStores';

let currentTimerId: ReturnType<typeof setTimeout> | null = null;

export function getNormalBottomBarText(init?: boolean) {
  if (init) return 'rotate: shift+wheel / drag: ctrl+drag';

  if (toolStore?.activeToolCategory === 'pen') {
    return 'line: shift+drag (ctrl to snap) / rotate: shift+wheel';
  }

  if (toolStore?.activeToolCategory === 'rectSelection') {
    return 'add: shift+drag / substract: alt+drag / move: ctrl+drag';
  }

  if (toolStore?.activeToolCategory === 'autoSelection') {
    return 'add: shift+drag / substract: alt+drag / move: ctrl+drag';
  }

  if (toolStore?.activeToolCategory === 'pipette') {
    return 'continuous pick: shift+click';
  }

  return 'rotate: shift+wheel / drag: ctrl+drag';
}

export function resetBottomBarText() {
  setLogStore('bottomBarText', getNormalBottomBarText());
  setLogStore('bottomBarKind', 'info');
}

interface BottomBarTextOptions {
  duration?: number;
  kind?: BottomBarKind;
}

export function setBottomBarText(text: string, options?: BottomBarTextOptions) {
  const { duration = 3000, kind = 'info' } = options || {};
  // 既存のタイマーがあればクリア
  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }

  // 新しいテキストを設定
  setLogStore('bottomBarText', text);
  setLogStore('bottomBarKind', kind);

  // 通常テキストの場合は自動復帰しない
  if (text === getNormalBottomBarText()) {
    return;
  }

  // 一時的なテキストの場合、指定時間後に通常テキストに戻す
  currentTimerId = setTimeout(() => {
    resetBottomBarText();
    currentTimerId = null;
  }, duration);
}

export function clearBottomBarTextTimer() {
  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }
}

export function setBottomBarTextPermanent(text: string, options?: Omit<BottomBarTextOptions, 'duration'>) {
  clearBottomBarTextTimer();
  setLogStore('bottomBarText', text);
  setLogStore('bottomBarKind', options?.kind || 'info');
}
