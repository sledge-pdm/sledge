import type { AppPlatform } from './plugins/app';
import type { ClipboardPlatform } from './plugins/clipboard';
import type { CorePlatform } from './plugins/core';
import type { DialogPlatform } from './plugins/dialog';
import type { EventPlatform } from './plugins/event';
import type { FsPlatform } from './plugins/fs';
import type { ImagePlatform } from './plugins/image';
import type { LogPlatform } from './plugins/log';
import { OpenerPlatform } from './plugins/opener';
import type { OSPlatform } from './plugins/os';
import type { PathPlatform } from './plugins/path';
import { ProcessPlatform } from './plugins/process';
import type { ShellPlatform } from './plugins/shell';
import type { UpdaterPlatform } from './plugins/updater';
import type { WebviewPlatform } from './plugins/webview';
import type { WebviewWindowPlatform } from './plugins/webviewWindow';
import type { WindowPlatform } from './plugins/window';

export interface Platform {
  os: OSPlatform;
  fs: FsPlatform;
  dialog: DialogPlatform;
  path: PathPlatform;
  core: CorePlatform;
  event: EventPlatform;
  log: LogPlatform;
  app: AppPlatform;
  opener: OpenerPlatform;
  process: ProcessPlatform;
  window: WindowPlatform;
  webview: WebviewPlatform;
  webviewWindow: WebviewWindowPlatform;
  updater: UpdaterPlatform;
  shell: ShellPlatform;
  clipboard: ClipboardPlatform;
  image: ImagePlatform;
}
