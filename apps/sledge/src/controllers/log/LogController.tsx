import { setLogStore, toolStore } from '~/stores/EditorStores';

let currentTimerId: ReturnType<typeof setTimeout> | null = null;

export function getNormalBottomBarText(init?: boolean) {
  if (init) return 'rotate: shift+wheel / drag: ctrl+drag';

  if (toolStore?.activeToolCategory === 'pen') {
    return 'line: shift+drag (ctrl to snap) / rotate: shift+wheel';
  }

  if (toolStore?.activeToolCategory === 'rectSelection') {
    return 'add: shift+drag / substract: alt+drag / move: ctrl+drag';
  }

  if (toolStore?.activeToolCategory === 'pipette') {
    return 'continuous pick: shift+click';
  }

  return 'rotate: shift+wheel / drag: ctrl+drag';
}

export function setBottomBarText(text: string, duration: number = 3000) {
  // 既存のタイマーがあればクリア
  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }

  // 新しいテキストを設定
  setLogStore('bottomBarText', text);

  // 通常テキストの場合は自動復帰しない
  if (text === getNormalBottomBarText()) {
    return;
  }

  // 一時的なテキストの場合、指定時間後に通常テキストに戻す
  currentTimerId = setTimeout(() => {
    setLogStore('bottomBarText', getNormalBottomBarText());
    currentTimerId = null;
  }, duration);
}

export function clearBottomBarTextTimer() {
  if (currentTimerId !== null) {
    clearTimeout(currentTimerId);
    currentTimerId = null;
  }
}

export function setBottomBarTextPermanent(text: string) {
  clearBottomBarTextTimer();
  setLogStore('bottomBarText', text);
}
