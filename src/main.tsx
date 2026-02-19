import { render } from 'solid-js/web';
import { setPlatform } from './utils/platform';
import { createBrowserPlatform } from './utils/platform/BrowserPlatform';
import { createTauriPlatform } from './utils/platform/TauriPlatform';

const isTauriRuntime = () => {
  const tauriWindow = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };
  return Boolean(tauriWindow.__TAURI_INTERNALS__ || tauriWindow.__TAURI__);
};

setPlatform(isTauriRuntime() ? createTauriPlatform() : createBrowserPlatform());

const mount = async () => {
  const { default: App } = await import('./app');
  render(() => <App />, document.getElementById('root')!);
};

void mount();
