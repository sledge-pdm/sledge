import { encode as encodeBase64 } from 'base64-arraybuffer';
import { InitialLoadRequest } from '~/features/io/project/ProjectLoader';
import { logSystemError, logSystemInfo, logSystemWarn } from '~/features/log/service';
import { globalConfig } from '~/stores/GlobalStores';
import { safeInvoke } from './TauriUtils';
import { packr } from './msgpackr';
import { dialog, window as platformWindow, WebviewOptions, webviewWindow, WindowOptions } from './platform';

export function zoomForIntegerize(dpr: number) {
  const n = Math.round(dpr - 0.01);
  return n / dpr;
}

export type WindowOptionsProp = Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions;

export type WindowKind = 'start' | 'editor' | 'settings' | 'about';

export async function openWindow(kind: Exclude<WindowKind, 'editor'>): Promise<void> {
  const parent = kind === 'settings' || kind === 'about' ? platformWindow.getCurrentWindow().label : undefined;
  return safeInvoke('open_window', {
    kind,
    options: {
      // all options undefined except parent
      parent,
    },
  });
}

export function getBase64MsgpackrRequest(request: InitialLoadRequest): string | undefined {
  const packed = packr.pack(request);
  if (packed) {
    return encodeBase64(new Uint8Array(packed).buffer);
  }
  return undefined;
}

export async function openEditorWindow(options: {
  loadRequest?: InitialLoadRequest;
  query?: string;
  openPath?: string;
  initializationScript?: string;
}): Promise<void> {
  let base64MsgpackrReq: string | undefined;
  if (options.loadRequest) {
    base64MsgpackrReq = getBase64MsgpackrRequest(options.loadRequest);
  }

  return safeInvoke('open_window', {
    kind: 'editor',
    options: {
      ...options,
      base64_msgpackr_load_request: base64MsgpackrReq,
      parent: undefined,
    },
  });
}

export function openDevTools(windowLabel: string): Promise<void> {
  return safeInvoke('open_devtools_window', { windowLabel });
}

export async function closeWindowsByLabel(label: string) {
  (await webviewWindow.getAllWebviewWindows())
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

export const getProjectFromClipboardSearchParams = (): string => {
  const sp = new URLSearchParams();
  sp.append('clipboard', 'true');
  return sp.toString();
};

export function getOpenPath(): string | undefined {
  // @ts-ignore
  return window.__PATH__;
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

export function getFromClipboardQuery(): boolean {
  const sp = new URLSearchParams(window.location.search);
  return !!sp.get('clipboard');
}

export function isFirstStartup(): boolean {
  const sp = new URLSearchParams(window.location.search);
  const isFirstStartup = sp.get('startup') === 'true';
  return isFirstStartup;
}

const alreadyShownErrors: Set<string> = new Set();

export async function reportCriticalError(e: any) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  const errorStack = e instanceof Error ? e.stack : undefined;
  if (alreadyShownErrors.has(errorMessage)) {
    logSystemWarn('Critical error already reported.', { label: 'WindowUtils', details: [errorMessage] });
    return; // Avoid reporting the same error multiple times
  }

  logSystemError('Reporting critical error.', {
    label: 'WindowUtils',
    details: [{ message: errorMessage, stack: errorStack }],
  });

  alreadyShownErrors.add(errorMessage);

  await dialog.message(
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
  const windowLabel = platformWindow.getCurrentWindow().label;
  await safeInvoke('show_main_window', { windowLabel });
  logSystemInfo('🌐 [PERF] Window transition completed', { label: 'WindowUtils', debugOnly: true });
}
