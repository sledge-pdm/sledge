// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import TitleBar from './components/global/title_bar/TitleBar';
import About from './routes/about/index';
import Editor from './routes/editor/index';
import Home from './routes/start/index';

import { applyTheme } from '@sledge/theme';
import { showContextMenu } from '@sledge/ui';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, onMount } from 'solid-js';
import { loadGlobalSettings } from '~/features/io/config/load';
import { globalConfig } from '~/stores/GlobalStores';
import { ContextMenuItems } from '~/utils/ContextMenuItems';
import { reportCriticalError, zoomForIntegerize } from '~/utils/WindowUtils';
import Settings from './routes/settings/index';
import { listenEvent } from './utils/TauriUtils';

import { css } from '@acab/ecsstatic';
import '@sledge/theme/src/global.css';
import Restore from '~/routes/restore';

const appRoot = css`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export default function App() {
  // グローバルエラーハンドラーを設定
  const handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error caught:', event.error);
    reportCriticalError(event.error || new Error(event.message));
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection caught:', event.reason);
    reportCriticalError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  };

  onMount(() => {
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });

  listenEvent('onSettingsSaved', () => {
    loadGlobalSettings();
  });

  const applyThemeToHtml = (osTheme?: 'dark' | 'light') => {
    if (osTheme && globalConfig.general.theme === 'os') {
      applyTheme(osTheme);
    } else {
      applyTheme(globalConfig.general.theme);
    }
  };

  listen('tauri://theme-changed', (e) => {
    applyThemeToHtml(e.payload === 'dark' ? 'dark' : 'light');
  });

  onMount(async () => {
    applyThemeToHtml();

    const webview = getCurrentWebview();
    const window = getCurrentWindow();

    await webview.setZoom(zoomForIntegerize(await window.scaleFactor()));

    window.onScaleChanged(async ({ payload }) => {
      const { scaleFactor, size } = payload;
      console.log('scale changed to:', scaleFactor, 'dprzoom: ', zoomForIntegerize(scaleFactor));
      await webview.setZoom(zoomForIntegerize(scaleFactor));
    });

    // await checkForUpdates();
  });

  createEffect(() => {
    const theme = globalConfig.general.theme;
    applyThemeToHtml();
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <div
            class={appRoot}
            onContextMenu={(e) => {
              e.preventDefault();
              showContextMenu(undefined, import.meta.env.DEV ? [ContextMenuItems.DevRefresh, ContextMenuItems.DevOpenDevTools] : [], e);
            }}
          >
            <TitleBar />
            <main>{props.children}</main>
          </div>
        </MetaProvider>
      )}
    >
      <Route path='/start' component={Home} />
      <Route path='/editor' component={Editor} />
      <Route path='/restore' component={Restore} />
      <Route path='/settings' component={Settings} />
      <Route path='/about' component={About} />
    </Router>
  );
}
