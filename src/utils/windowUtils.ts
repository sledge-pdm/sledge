import { WebviewOptions } from '@tauri-apps/api/webview';
import { getAllWebviewWindows, WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { WindowOptions } from '@tauri-apps/api/window';
import { StartWindowOptions } from '~/routes';
import { EditorWindowOptions } from '~/routes/editor';
import { globalStore } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

/** 同一ラベルのウィンドウがあれば再利用してフォーカスする */
export async function openSingletonWindow(label: string, options?: WindowOptionsProp) {
  let win = await WebviewWindow.getByLabel(label);
  if (win) {
    win.show();
    win.setFocus();
    return win;
  }
  return new WebviewWindow(label, {
    ...options,
    title: label,
  });
}

export async function closeWindowsByLabel(label: string) {
  (await getAllWebviewWindows())
    .filter((w) => w.label === label)
    .forEach(async (w) => {
      await w.close();
      await w.destroy();
    });
}

const getNewProjectSearchParams = (): string => {
  const sp = new URLSearchParams();
  sp.append('new', 'true');
  sp.append('width', globalStore.newProjectCanvasSize.width.toString());
  sp.append('height', globalStore.newProjectCanvasSize.height.toString());
  return sp.toString();
};

export async function openNewEditorWindow() {
  const editorWin = new WebviewWindow('editor', {
    ...EditorWindowOptions,
    url: `/editor?${getNewProjectSearchParams()}`,
    title: 'sledge',
  });
}

const getExistingProjectSearchParams = (fileLocation: FileLocation): string => {
  const sp = new URLSearchParams();
  sp.append('name', fileLocation.name);
  sp.append('path', fileLocation.path);
  return sp.toString();
};

export async function openEditorWindow(fileLocation: FileLocation) {
  const editorWin = new WebviewWindow('editor', {
    ...EditorWindowOptions,
    url: `/editor?${getExistingProjectSearchParams(fileLocation)}`,
    title: 'sledge',
  });
}

export async function openStartWindow() {
  let startWin = await WebviewWindow.getByLabel('start');
  if (startWin) {
    startWin.show();
    startWin.setFocus();
    return;
  }

  startWin = new WebviewWindow('start', {
    ...StartWindowOptions,
    url: `/`,
  });
}
