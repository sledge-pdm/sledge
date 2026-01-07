import type { Platform } from './types';

export class TestMockPlatform implements Platform {
  os = {
    platform: () => this.platformSpec,
  };

  fs = {
    BaseDirectory: {},
    exists: async () => false,
    mkdir: async () => {},
    readFile: async () => new Uint8Array(),
    writeFile: async () => {},
    readTextFile: async () => '',
    writeTextFile: async () => {},
    readDir: async () => [],
    remove: async () => {},
    stat: async () => ({ size: 0, isFile: true, isDirectory: false }),
  };

  dialog = {
    confirm: async () => true,
    message: async () => {},
    open: async () => null,
    save: async () => null,
  };

  path = {
    BaseDirectory: {},
    homeDir: async () => 'C:/',
    pictureDir: async () => 'C:/Pictures',
    appConfigDir: async () => 'C:/AppConfig',
    appDataDir: async () => 'C:/AppData',
  };

  core = {
    invoke: async <T = unknown>() => undefined as T,
    transformCallback: <T = unknown>(_callback?: ((response: T) => void) | undefined, _once?: boolean | undefined) => 0,
    convertFileSrc: (path: string) => path,
  };

  event = {
    listen: async () => () => {},
  };

  log = {
    info: async () => {},
    warn: async () => {},
    error: async () => {},
  };

  app = {
    getTauriVersion: async () => '0.0.0-test',
    getVersion: async () => '0.0.0-test',
  };

  opener = {
    revealItemInDir: async () => {},
  };

  process = {
    exit: async (code?: number) => {},
    relaunch: async () => {},
  };

  window = {
    getCurrentWindow: () => ({
      label: 'test-window',
      scaleFactor: async () => 1,
      isMaximized: async () => false,
      isDecorated: async () => true,
      isMaximizable: async () => true,
      isMinimizable: async () => true,
      isClosable: async () => true,
      title: async () => 'test',
      setTitle: async () => {},
      show: async () => {},
      close: async () => {},
      destroy: async () => {},
      minimize: async () => {},
      toggleMaximize: async () => {},
      onResized: async () => () => {},
      onScaleChanged: async () => () => {},
      onCloseRequested: async () => () => {},
      onFocusChanged: async () => () => {},
    }),
  };

  webview = {
    getCurrentWebview: () => ({
      label: 'test-webview',
      setZoom: async () => {},
      clearAllBrowsingData: async () => {},
    }),
  };

  webviewWindow = {
    getAllWebviewWindows: async () => [],
  };

  updater = {
    check: async () => null,
  };

  shell = {
    open: async () => {},
  };

  clipboard = {
    readImage: async () => ({
      rgba: async () => new Uint8Array(),
      size: async () => ({ width: 0, height: 0 }),
      close: () => {},
    }),
    readText: async () => '',
    writeImage: async () => {},
    writeText: async () => {},
  };

  image = {
    create: async () => ({
      rgba: async () => new Uint8Array(),
      size: async () => ({ width: 0, height: 0 }),
      close: () => {},
    }),
  };

  platformSpec = 'windows';
}

export const createTestMockPlatform = (): Platform => new TestMockPlatform();
