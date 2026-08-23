import type { Platform } from './types';

const detectPlatformSpec = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
};

export const createBrowserPlatform = (): Platform => ({
  os: {
    platform: () => detectPlatformSpec(),
  },
  fs: {
    BaseDirectory: {},
    exists: async () => false,
    mkdir: async () => {},
    readFile: async () => new Uint8Array(),
    writeFile: async () => {},
    readTextFile: async () => '',
    writeTextFile: async () => {},
    readDir: async () => [],
    remove: async () => {},
    rename: async () => {},
    stat: async () => ({ size: 0, isFile: true, isDirectory: false }),
  },
  dialog: {
    confirm: async (message: string) => window.confirm(message),
    message: async (message: string) => {
      window.alert(message);
    },
    open: async () => null,
    save: async () => null,
  },
  path: {
    BaseDirectory: {},
    homeDir: async () => '/',
    pictureDir: async () => '/Pictures',
    appConfigDir: async () => '/AppConfig',
    appDataDir: async () => '/AppData',
  },
  core: {
    invoke: async <T = unknown>() => undefined as T,
    transformCallback: <T = unknown>(_callback?: ((response: T) => void) | undefined, _once?: boolean | undefined) => 0,
    convertFileSrc: (path: string) => path,
    isTauri: () => false,
  },
  event: {
    listen: async () => () => {},
  },
  log: {
    info: async () => {},
    warn: async () => {},
    error: async () => {},
  },
  app: {
    getTauriVersion: async () => {
      throw new Error('Tauri runtime is not available in browser platform.');
    },
    getVersion: async () => '0.0.0-browser',
  },
  opener: {
    revealItemInDir: async () => {},
  },
  process: {
    exit: async () => {},
    relaunch: async () => {},
  },
  window: {
    getCurrentWindow: () => ({
      label: 'browser-window',
      scaleFactor: async () => window.devicePixelRatio || 1,
      isMaximized: async () => false,
      isDecorated: async () => true,
      isMaximizable: async () => false,
      isMinimizable: async () => false,
      isClosable: async () => false,
      title: async () => document.title,
      setTitle: async (title: string) => {
        document.title = title;
      },
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
  },
  webview: {
    getCurrentWebview: () => ({
      label: 'browser-webview',
      setZoom: async () => {},
      clearAllBrowsingData: async () => {},
    }),
  },
  webviewWindow: {
    getAllWebviewWindows: async () => [],
  },
  updater: {
    check: async () => null,
  },
  shell: {
    open: async (target: string) => {
      window.open(target, '_blank', 'noopener,noreferrer');
    },
  },
  clipboard: {
    readImage: async () => ({
      rgba: async () => new Uint8Array(),
      size: async () => ({ width: 0, height: 0 }),
      close: () => {},
    }),
    readText: async () => '',
    writeImage: async () => {},
    writeText: async () => {},
  },
  image: {
    create: async () => ({
      rgba: async () => new Uint8Array(),
      size: async () => ({ width: 0, height: 0 }),
      close: () => {},
    }),
  },
});
