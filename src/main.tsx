import { render } from 'solid-js/web';
import { setPlatform } from './utils/platform';
import { createBrowserPlatform } from './utils/platform/BrowserPlatform';
import { createTauriPlatform } from './utils/platform/TauriPlatform';

// https://github.com/tauri-apps/tauri/blob/88c05689c884fb456431d67d20ed12124d9cb901/packages/api/src/core.ts#L337
const isTauri = !!((globalThis as any) || window).isTauri;

setPlatform(isTauri ? createTauriPlatform() : createBrowserPlatform());

const mount = async () => {
  const { default: App } = await import('./app');
  render(() => <App />, document.getElementById('root')!);
};

void mount();
