import { WebviewOptions } from '@tauri-apps/api/webview';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { WindowOptions } from '@tauri-apps/api/window';
import { FileLocation } from '~/models/types/FileLocation';
import { globalConfig } from '~/stores/GlobalStores';
import { safeInvoke } from './TauriUtils';

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

export type WindowKind = 'start' | 'editor' | 'settings' | 'about';

export function openWindow(kind: WindowKind, options?: { query?: string }) {
  return safeInvoke('open_window', {
    kind,
    query: options?.query,
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

export const getNewProjectSearchParams = (): string => {
  const sp = new URLSearchParams();
  sp.append('new', 'true');
  sp.append('width', globalConfig.default.canvasSize.width.toString());
  sp.append('height', globalConfig.default.canvasSize.height.toString());
  return sp.toString();
};

export const getExistingProjectSearchParams = (fileLocation: FileLocation): string => {
  const sp = new URLSearchParams();
  sp.append('name', fileLocation.name);
  sp.append('path', fileLocation.path);
  return sp.toString();
};
