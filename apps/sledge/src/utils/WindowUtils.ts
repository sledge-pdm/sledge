import { FileLocation } from '@sledge/core';
import { WebviewOptions } from '@tauri-apps/api/webview';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow, WindowOptions } from '@tauri-apps/api/window';
import { message } from '@tauri-apps/plugin-dialog';
import { exit } from '@tauri-apps/plugin-process';
import { globalConfig } from '~/stores/GlobalStores';
import { pathToFileLocation } from '~/utils/FileUtils';
import { safeInvoke } from './TauriUtils';

export function zoomForIntegerize(dpr: number) {
  const n = Math.round(dpr - 0.01);
  return n / dpr;
}

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

export type WindowKind = 'start' | 'editor' | 'settings' | 'about';

export async function openWindow(kind: WindowKind, options?: { query?: string; openPath?: string; initializationScript?: string }): Promise<void> {
  const parent = kind === 'settings' || kind === 'about' ? getCurrentWindow().label : undefined;
  return safeInvoke('open_window', {
    kind,
    options: {
      query: options?.query,
      open_path: options?.openPath,
      initialization_script: options?.initializationScript,
      parent,
    },
  });
}

export function openDevTools(windowLabel: string): Promise<void> {
  return safeInvoke('open_devtools_window', { windowLabel });
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
  return pathToFileLocation(openPath);
}

export function getNewProjectQuery(): {
  new: boolean;
  width?: number;
  height?: number;
} {
  const sp = new URLSearchParams(window.location.search);
  return {
    new: !!sp.get('new'),
    width: sp.get('width') ? Number(sp.get('width')) : undefined,
    height: sp.get('height') ? Number(sp.get('height')) : undefined,
  };
}

const alreadyShownErrors: Set<string> = new Set();

export async function reportAppStartupError(e: any) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  const errorStack = e instanceof Error ? e.stack : undefined;
  if (alreadyShownErrors.has(errorMessage)) {
    console.warn('Critical error already reported:', errorMessage);
    return; // Avoid reporting the same error multiple times
  }

  console.error('Reporting startup error:', {
    message: errorMessage,
    stack: errorStack,
  });

  alreadyShownErrors.add(errorMessage);

  await message(
    `Something went wrong in startup.\n${errorMessage || '<No message available>'}
    \n${errorStack || '<No stack trace available>'}`,
    {
      kind: 'error',
      title: 'Error',
      okLabel: 'Quit app',
    }
  );

  alreadyShownErrors.delete(errorMessage);
  // kill process
  await exit(0);
}

export async function reportWindowStartError(e: any) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  const errorStack = e instanceof Error ? e.stack : undefined;
  if (alreadyShownErrors.has(errorMessage)) {
    console.warn('Critical error already reported:', errorMessage);
    return; // Avoid reporting the same error multiple times
  }

  console.error('Reporting window startup error:', {
    message: errorMessage,
    stack: errorStack,
  });
  alreadyShownErrors.add(errorMessage);

  await message(
    `Something went wrong in window startup.\n${errorMessage || '<No message available>'}
    \n${errorStack || '<No stack trace available>'}`,
    {
      kind: 'error',
      title: 'Error',
      okLabel: 'Close',
    }
  );
  alreadyShownErrors.delete(errorMessage);

  // throwがあった時点でshowMainWindowには届かないのでvisible=falseのウィンドウが残留する
  // 確実に消しておく
  getCurrentWindow().close();
  getCurrentWindow().destroy();
}

export async function reportCriticalError(e: any) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  const errorStack = e instanceof Error ? e.stack : undefined;
  if (alreadyShownErrors.has(errorMessage)) {
    console.warn('Critical error already reported:', errorMessage);
    return; // Avoid reporting the same error multiple times
  }

  console.error('Reporting critical error:', {
    message: errorMessage,
    stack: errorStack,
  });

  alreadyShownErrors.add(errorMessage);

  await message(
    `Something went wrong.\n${errorMessage || '<No message available>'}
    \n${errorStack || '<No stack trace available>'}`,
    {
      kind: 'warning',
      title: 'Error',
      okLabel: 'Continue process',
    }
  );

  alreadyShownErrors.delete(errorMessage);
}

export async function showMainWindow() {
  // ネイティブスプラッシュを閉じてWebViewを表示
  try {
    const windowLabel = getCurrentWindow().label;
    await safeInvoke('show_main_window', { windowLabel });
    console.log('🌐 [PERF] Window transition completed');
  } catch (error) {
    console.error('Failed to transition from native splash:', error);
    // フォールバック
    getCurrentWindow().show();
  }
}
