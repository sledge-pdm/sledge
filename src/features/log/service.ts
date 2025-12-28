import { error as tauriError, info as tauriInfo, warn as tauriWarn } from '@tauri-apps/plugin-log';
import { setBottomBarText, setBottomBarTextPermanent } from '~/features/log/bottomBar';
import { LogKind } from '~/stores/editor/LogStore';

type LogChannel = 'tauri' | 'bottomBar';

type CommonLogOptions = {
  label?: string;
  details?: unknown[];
  debugOnly?: boolean;
  channels?: LogChannel[];
};

export type UserLogOptions = CommonLogOptions & {
  kind?: LogKind;
  duration?: number;
  persistent?: boolean;
};

export type SystemLogOptions = CommonLogOptions & {
  kind?: LogKind;
};

type InternalLogOptions = Required<Pick<UserLogOptions, 'kind'>> &
  CommonLogOptions & {
    channels: LogChannel[];
    duration?: number;
    persistent?: boolean;
  };

const DEFAULT_USER_CHANNELS: LogChannel[] = ['tauri', 'bottomBar'];
const DEFAULT_SYSTEM_CHANNELS: LogChannel[] = ['tauri'];

const tauriLoggers = {
  info: tauriInfo,
  warn: tauriWarn,
  error: tauriError,
};

function mapKindToTauriLevel(kind: LogKind): keyof typeof tauriLoggers {
  if (kind === 'error') return 'error';
  if (kind === 'warn') return 'warn';
  return 'info';
}

export function formatDetail(detail: unknown) {
  if (detail instanceof Error) {
    return detail.stack || detail.message;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function formatLogLine(message: string, options: { label?: string; details?: unknown[] }) {
  const timestamp = new Date().toISOString();
  const labelPart = options.label ? `[${options.label}] ` : '';
  const detailsPart = options.details?.length ? ` | ${options.details.map(formatDetail).join(' | ')}` : '';
  return `[${timestamp}] ${labelPart}${message}${detailsPart}`;
}

function logToConsole(kind: LogKind, line: string) {
  if (import.meta.env.DEV) {
    if (kind === 'error') {
      console.error(line);
      return;
    }
    if (kind === 'warn') {
      console.warn(line);
      return;
    }
    console.log(line);
  }
}

function logToTauri(kind: LogKind, line: string) {
  const level = mapKindToTauriLevel(kind);
  try {
    const maybePromise = tauriLoggers[level](line);
    Promise.resolve(maybePromise).catch(() => {
      /* no-op */
    });
  } catch {
    // ignored - fall back to console logging which already occurred in dev builds
  }
}

function showBottomBarMessage(text: string, kind: LogKind, options?: { duration?: number; persistent?: boolean }) {
  if (options?.persistent) {
    setBottomBarTextPermanent(text, { kind });
    return;
  }
  setBottomBarText(text, { kind, duration: options?.duration });
}

function logEvent(message: string, options: InternalLogOptions) {
  const { channels, duration, persistent, kind, label, details, debugOnly } = options;
  if (debugOnly && !import.meta.env.DEV) {
    return;
  }

  const normalizedMessage = typeof message === 'string' ? message : String(message);
  const line = formatLogLine(normalizedMessage, { label, details });

  logToConsole(kind, line);
  if (channels.includes('tauri')) {
    logToTauri(kind, line);
  }
  if (channels.includes('bottomBar')) {
    showBottomBarMessage(normalizedMessage, kind, { duration, persistent });
  }
}

export function logSystemMessage(message: string, options?: SystemLogOptions) {
  logEvent(message, {
    kind: options?.kind ?? 'info',
    label: options?.label,
    details: options?.details ?? [],
    debugOnly: options?.debugOnly,
    channels: options?.channels ?? DEFAULT_SYSTEM_CHANNELS,
  });
}

export function logUserMessage(message: string, options?: UserLogOptions) {
  logEvent(message, {
    kind: options?.kind ?? 'info',
    label: options?.label,
    details: options?.details ?? [],
    debugOnly: options?.debugOnly,
    channels: options?.channels ?? DEFAULT_USER_CHANNELS,
    duration: options?.duration,
    persistent: options?.persistent,
  });
}

export const logSystemInfo = (message: string, options?: SystemLogOptions) => logSystemMessage(message, { ...options, kind: 'info' });
export const logSystemWarn = (message: string, options?: SystemLogOptions) => logSystemMessage(message, { ...options, kind: 'warn' });
export const logSystemError = (message: string, options?: SystemLogOptions) => logSystemMessage(message, { ...options, kind: 'error' });

export const logUserInfo = (message: string, options?: UserLogOptions) => logUserMessage(message, { ...options, kind: 'info' });
export const logUserSuccess = (message: string, options?: UserLogOptions) => logUserMessage(message, { ...options, kind: 'success' });
export const logUserWarn = (message: string, options?: UserLogOptions) => logUserMessage(message, { ...options, kind: 'warn' });
export const logUserError = (message: string, options?: UserLogOptions) => logUserMessage(message, { ...options, kind: 'error' });

function prepareDebugPayload(msg: unknown[]): { message: string; details: unknown[] } {
  if (!msg.length) {
    return { message: '', details: [] };
  }
  const [first, ...rest] = msg;
  return {
    message: typeof first === 'string' ? first : formatDetail(first),
    details: rest,
  };
}

export function debugLog(label?: string, ...msg: unknown[]) {
  const payload = prepareDebugPayload(msg);
  logSystemMessage(payload.message, {
    label,
    details: payload.details,
    debugOnly: true,
  });
}

export function debugWarn(label?: string, ...msg: unknown[]) {
  const payload = prepareDebugPayload(msg);
  logSystemMessage(payload.message, {
    label,
    details: payload.details,
    kind: 'warn',
    debugOnly: true,
  });
}

export function debugError(label?: string, ...msg: unknown[]) {
  const payload = prepareDebugPayload(msg);
  logSystemMessage(payload.message, {
    label,
    details: payload.details,
    kind: 'error',
    debugOnly: true,
  });
}
