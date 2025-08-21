// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import TitleBar from './components/global/TitleBar';
import About from './routes/about/index';
import Editor from './routes/editor/index';
import Home from './routes/start/index';

import { flexCol, h100 } from '@sledge/core';
import { getTheme } from '@sledge/theme';
import { createEffect, onCleanup, onMount } from 'solid-js';
import DebugViewer from '~/components/debug/DebugViewer';
import { loadGlobalSettings } from '~/io/config/load';
import { globalConfig } from '~/stores/GlobalStores';
import { reportCriticalError } from '~/utils/WindowUtils';
import Settings from './routes/settings/index';
import { listenEvent } from './utils/TauriUtils';

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
  });

  onCleanup(() => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });

  listenEvent('onSettingsSaved', () => {
    loadGlobalSettings();
  });

  // テーマクラスを html 要素に付与して、Portal や body 直下にもトークンが届くようにする
  let prevThemeClass: string | undefined;
  const applyThemeToHtml = () => {
    const cls = getTheme(globalConfig.appearance.theme);
    const html = document.documentElement;
    if (prevThemeClass && html.classList.contains(prevThemeClass)) {
      html.classList.remove(prevThemeClass);
    }
    html.classList.add(cls);
    prevThemeClass = cls;
  };
  onMount(applyThemeToHtml);
  createEffect(applyThemeToHtml);

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <div class={[flexCol, h100].join(' ')}>
            <TitleBar />
            <main>{props.children}</main>
            <DebugViewer />
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
