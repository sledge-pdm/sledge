import { getTauriVersion, getVersion } from '@tauri-apps/api/app';
import { convertFileSrc, invoke, isTauri, transformCallback } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Image } from '@tauri-apps/api/image';
import { BaseDirectory as PathBaseDirectory, appConfigDir, appDataDir, homeDir, pictureDir } from '@tauri-apps/api/path';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { readImage, readText, writeImage, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { confirm, message, open, save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, exists, mkdir, readDir, readFile, readTextFile, remove, stat, writeFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { error, info, warn } from '@tauri-apps/plugin-log';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { platform as osPlatform } from '@tauri-apps/plugin-os';
import { exit, relaunch } from '@tauri-apps/plugin-process';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { Update as PluginUpdate } from '@tauri-apps/plugin-updater';
import { DirEntry, FileInfo } from './plugins/fs';
import { Update } from './plugins/updater';
import type { Platform } from './types';

type UpdaterMetadata = {
  rid: number;
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
  rawJson: Record<string, unknown>;
};

export const createTauriPlatform = (): Platform => ({
  os: {
    platform: () => osPlatform(),
  },
  fs: {
    BaseDirectory,
    exists,
    mkdir,
    readFile,
    writeFile,
    readTextFile,
    writeTextFile,
    readDir: (p) => readDir(p) as unknown as Promise<DirEntry[]>,
    remove,
    stat: (p) => stat(p) as unknown as Promise<FileInfo>,
  },
  dialog: {
    confirm,
    message,
    open,
    save,
  },
  path: {
    BaseDirectory: PathBaseDirectory,
    homeDir,
    pictureDir,
    appConfigDir,
    appDataDir,
  },
  core: {
    invoke,
    transformCallback,
    convertFileSrc,
    isTauri,
  },
  event: {
    listen: (event, handler) => listen(event as any, handler as any),
  },
  log: {
    info,
    warn,
    error,
  },
  app: {
    getTauriVersion,
    getVersion,
  },
  opener: {
    revealItemInDir,
  },
  process: {
    exit,
    relaunch,
  },
  window: {
    getCurrentWindow,
  },
  webview: {
    getCurrentWebview,
  },
  webviewWindow: {
    getAllWebviewWindows,
  },
  updater: {
    check: async (options) => {
      const metadata = await invoke<UpdaterMetadata | null>('check_update_with_channel', options ?? {});
      if (!metadata) return null;
      return new PluginUpdate(metadata) as unknown as Update;
    },
  },
  shell: {
    open: openShell,
  },
  clipboard: {
    readImage,
    readText,
    writeImage: (image) => writeImage(image as unknown as Image),
    writeText,
  },
  image: {
    create: (data, width, height) => Image.new(data, width, height),
  },
});
