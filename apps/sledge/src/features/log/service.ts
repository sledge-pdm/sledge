import { BottomBarKind } from '~/stores/editor/LogStore';
import { setLogStore, toolStore } from '~/stores/EditorStores';

let currentTimerId: ReturnType<typeof setTimeout> | null = null;

export function getNormalBottomBarText() {
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

export function debugLog(label?: string, ...msg: any) {
  if (import.meta.env.DEV) {
    const timestamp = `[${new Date().getSeconds()}.${(Date.now() % 100000).toString().padStart(5, '0')}] `;
    console.log(`${timestamp}[${label}]:`, ...msg);
  }
}

export function debugWarn(label?: string, ...msg: any) {
  if (import.meta.env.DEV) {
    const timestamp = `[${new Date().getSeconds()}.${(Date.now() % 100000).toString().padStart(5, '0')}] `;
    console.warn(`${timestamp}[${label}]:`, ...msg);
  }
}

export function debugError(label?: string, ...msg: any) {
  if (import.meta.env.DEV) {
    const timestamp = `[${new Date().getSeconds()}.${(Date.now() % 100000).toString().padStart(5, '0')}] `;
    console.error(`${timestamp}[${label}]:`, ...msg);
  }
}
