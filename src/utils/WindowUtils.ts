import { WebviewOptions } from '@tauri-apps/api/webview';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { WindowOptions } from '@tauri-apps/api/window';
import { globalStore } from '~/stores/GlobalStores';
import { FileLocation } from '~/types/FileLocation';

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

export async function closeWindowsByLabel(label: string) {
  (await getAllWebviewWindows())
    .filter((w) => w.label === label)
    .forEach(async (w) => {
      await w.close();
      await w.destroy();
    });
}

export const getNewProjectSearchParams = (): string => {
  const sp = new URLSearchParams();
  sp.append('new', 'true');
  sp.append('width', globalStore.newProjectCanvasSize.width.toString());
  sp.append('height', globalStore.newProjectCanvasSize.height.toString());
  return sp.toString();
};

export const getExistingProjectSearchParams = (fileLocation: FileLocation): string => {
  const sp = new URLSearchParams();
  sp.append('name', fileLocation.name);
  sp.append('path', fileLocation.path);
  return sp.toString();
};
