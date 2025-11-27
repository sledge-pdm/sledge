import { LogKind } from '~/stores/editor/LogStore';
import { setLogStore, toolStore } from '~/stores/EditorStores';

let currentTimerId: ReturnType<typeof setTimeout> | null = null;

export function getPersistentBottomBarText() {
  if (toolStore?.activeToolCategory === 'pen') {
    return 'line: shift+drag (ctrl to snap) / rotate: shift+wheel';
  }

  if (
    toolStore?.activeToolCategory === 'rectSelection' ||
    toolStore?.activeToolCategory === 'autoSelection' ||
    toolStore?.activeToolCategory === 'lassoSelection'
  ) {
    return 'add: shift+drag / subtract: alt+drag / move: ctrl+drag';
  }

  if (toolStore?.activeToolCategory === 'pipette') {
    return 'continuous pick: shift+click';
  }

  return 'rotate: shift+wheel / drag: ctrl+drag';
}

export function resetBottomBarText() {
  setLogStore('bottomBarText', getPersistentBottomBarText());
  setLogStore('bottomBarKind', 'persistent');
}

interface BottomBarTextOptions {
  duration?: number;
  kind?: LogKind;
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
  if (text === getPersistentBottomBarText()) {
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
