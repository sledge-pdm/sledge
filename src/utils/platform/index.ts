export type { AppPlatform } from './plugins/app';
export type { ClipboardPlatform } from './plugins/clipboard';
export type { CorePlatform } from './plugins/core';
export type { DialogPlatform } from './plugins/dialog';
export type { Event, EventCallback, EventPlatform, TauriEvent, UnlistenFn } from './plugins/event';
export type { DirEntry, FileInfo, FsBaseDirectory, FsPlatform } from './plugins/fs';
export type { ImagePlatform } from './plugins/image';
export type { LogPlatform } from './plugins/log';
export type { OpenerPlatform } from './plugins/opener';
export type { OSPlatform } from './plugins/os';
export type { PathPlatform } from './plugins/path';
export type { ProcessPlatform } from './plugins/process';
export type { ShellPlatform } from './plugins/shell';
export type { Update, UpdaterPlatform } from './plugins/updater';
export type { WebviewOptions, WebviewPlatform } from './plugins/webview';
export type { WebviewWindowPlatform } from './plugins/webviewWindow';
export type { AppWindow, CloseRequestedEvent, FocusChangedEvent, ScaleChangedEvent, WindowOptions, WindowPlatform } from './plugins/window';
export type { Platform } from './types';
import { createTestMockPlatform } from './TestMockPlatform';
import type { Platform } from './types';

export let platform: Platform = createTestMockPlatform();

export const setPlatform = (next: Platform) => {
  platform = next;
};

export const resetPlatform = () => {
  platform = createTestMockPlatform();
};

const createPluginProxy = <T extends object>(getTarget: () => T): T =>
  new Proxy({} as T, {
    // @ts-ignore
    get: (_target, prop: keyof T) => getTarget()[prop],
  });

export const os = createPluginProxy(() => platform.os);
export const fs = createPluginProxy(() => platform.fs);
export const dialog = createPluginProxy(() => platform.dialog);
export const path = createPluginProxy(() => platform.path);
export const core = createPluginProxy(() => platform.core);
export const event = createPluginProxy(() => platform.event);
export const log = createPluginProxy(() => platform.log);
export const app = createPluginProxy(() => platform.app);
export const opener = createPluginProxy(() => platform.opener);
export const process = createPluginProxy(() => platform.process);
export const window = createPluginProxy(() => platform.window);
export const webview = createPluginProxy(() => platform.webview);
export const webviewWindow = createPluginProxy(() => platform.webviewWindow);
export const updater = createPluginProxy(() => platform.updater);
export const shell = createPluginProxy(() => platform.shell);
export const clipboard = createPluginProxy(() => platform.clipboard);
export const image = createPluginProxy(() => platform.image);
