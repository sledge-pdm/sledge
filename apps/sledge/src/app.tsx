// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { onCleanup, onMount, Suspense } from 'solid-js';
import TitleBar from './components/global/TitleBar';
import Home from './routes';
import About from './routes/about';
import Editor from './routes/editor';

import { flexCol, h100 } from '@sledge/core';
import { getTheme } from '@sledge/theme';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import { globalConfig } from '~/stores/GlobalStores';
import loadGlobalSettings from './io/config/load';
import setGlobalSettings from './io/config/set';
import Settings from './routes/settings';
import { listenEvent, safeInvoke } from './utils/TauriUtils';

export default function App() {
  onMount(async () => {
    if (window instanceof Window) {
      const globalConfig = (window as any).__CONFIG__;
      if (globalConfig) {
        // Load global config from window object
        await setGlobalSettings(globalConfig);
        console.log('global settings loaded from window object:', globalConfig);
      } else {
        // Fallback to loading from Rust?
      }
    }

    // ネイティブスプラッシュを閉じてWebViewを表示
    try {
      const windowLabel = getCurrentWindow().label;
      await safeInvoke('show_main_window', { windowLabel });
      console.log('🌐 [PERF] Window transition completed');
    } catch (error) {
      console.error('Failed to transition from native splash:', error);
      // フォールバック
      getCurrentWindow().show();
    }
  });

  onCleanup(() => {
    if (!import.meta.hot) {
      webGLRenderer?.dispose();
    }
  });

  listenEvent('onSettingsSaved', () => {
    loadGlobalSettings();
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <div class={[flexCol, h100, getTheme(globalConfig.appearance.theme)].join(' ')}>
            <Suspense>
              <TitleBar />
              <main>{props.children}</main>
            </Suspense>

            {/* <p class={sledgeLogo}>sledge.</p> */}
          </div>
        </MetaProvider>
      )}
    >
      <Route path='/' component={Home} />
      <Route path='/editor' component={Editor} />
      <Route path='/settings' component={Settings} />
      <Route path='/about' component={About} />;
    </Router>
  );
}
