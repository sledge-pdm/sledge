// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import TitleBar from './components/global/title_bar/TitleBar';
import About from './routes/about/index';
import Editor from './routes/editor/index';
import Home from './routes/start/index';

import { flexCol, h100 } from '@sledge/core';
import { applyTheme, getTheme } from '@sledge/theme';
import { showContextMenu } from '@sledge/ui';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createEffect, onMount } from 'solid-js';
import { ContextMenuItems } from '~/components/menu/ContextMenuItems';
import { loadGlobalSettings } from '~/io/config/load';
import { globalConfig } from '~/stores/GlobalStores';
import { reportCriticalError, zoomForIntegerize } from '~/utils/WindowUtils';
import Settings from './routes/settings/index';
import { listenEvent } from './utils/TauriUtils';

import '@sledge/theme/src/global.css';

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

  // テーマクラスを html 要素に付与して、Portal や body 直下にもトークンが届くようにする
  let prevThemeClass: string | undefined;

  const applyThemeToHtml = (osTheme?: 'dark' | 'light') => {
    let cls;
    if (osTheme && globalConfig.appearance.theme === 'os') {
      cls = getTheme(osTheme);
      applyTheme(osTheme);
    } else {
      cls = getTheme(globalConfig.appearance.theme);
      applyTheme(globalConfig.appearance.theme);
    }
    const html = document.documentElement;
    if (prevThemeClass && html.classList.contains(prevThemeClass)) {
      html.classList.remove(prevThemeClass);
    }
    html.classList.add(cls);
    prevThemeClass = cls;
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
    const theme = globalConfig.appearance.theme;
    applyThemeToHtml();
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <div
            class={[flexCol, h100].join(' ')}
            onContextMenu={(e) => {
              e.preventDefault();
              showContextMenu(
                undefined,
                import.meta.env.DEV
                  ? [ContextMenuItems.Save, ContextMenuItems.DevRefresh, ContextMenuItems.DevOpenDevTools]
                  : [ContextMenuItems.Save],
                e
              );
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
      <Route path='/settings' component={Settings} />
      <Route path='/about' component={About} />
    </Router>
  );
}
