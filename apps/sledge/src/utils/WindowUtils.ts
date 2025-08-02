import { FileLocation } from '@sledge/core';
import { WebviewOptions } from '@tauri-apps/api/webview';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { WindowOptions } from '@tauri-apps/api/window';
import { globalConfig } from '~/stores/GlobalStores';
import { PathToFileLocation } from '~/utils/PathUtils';
import { safeInvoke } from './TauriUtils';

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

export type WindowKind = 'start' | 'editor' | 'settings' | 'about';

export function openWindow(kind: WindowKind, options?: { query?: string; openPath?: string; initializationScript?: string }): Promise<void> {
  return safeInvoke('open_window', {
    kind,
    options: {
      query: options?.query,
      open_path: options?.openPath,
      initialization_script: options?.initializationScript,
    },
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

export function getOpenLocation(): FileLocation | undefined {
  // @ts-ignore
  const openPath = window.__PATH__;
  return PathToFileLocation(openPath);
}
