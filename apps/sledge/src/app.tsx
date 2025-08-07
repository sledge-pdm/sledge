// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { createEffect, createSignal, onCleanup, onMount, Suspense } from 'solid-js';
import TitleBar from './components/global/TitleBar';
import Home from './routes';
import About from './routes/about';
import Editor from './routes/editor';

import { flexCol, h100 } from '@sledge/core';
import { getTheme } from '@sledge/theme';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import DebugViewer from '~/components/debug/DebugViewer';
import { loadGlobalSettings } from '~/io/config/load';
import { globalConfig } from '~/stores/GlobalStores';
import { eventBus } from '~/utils/EventBus';
import { showMainWindow } from '~/utils/WindowUtils';
import Settings from './routes/settings';
import { listenEvent } from './utils/TauriUtils';

export default function App() {
  const [appReady, setAppReady] = createSignal(false);
  const [routeReady, setRouteReady] = createSignal(false);

  onMount(async () => {
    await loadGlobalSettings();

    eventBus.emit('window:appReady', { ready: true });
  });

  eventBus.on('window:appReady', () => {
    setAppReady(true);
  });

  eventBus.on('window:routeReady', () => {
    setRouteReady(true);
  });

  onCleanup(() => {
    if (!import.meta.hot) {
      webGLRenderer?.dispose();
    }
  });

  createEffect(() => {
    if (appReady() && routeReady()) {
      showMainWindow();
    }
  });

  listenEvent('onSettingsSaved', () => {
    loadGlobalSettings();
  });

  if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
      if (newModule) {
        // SyntaxError が発生したときに newModule は undefined です
        console.log('updated: count is now ', newModule.count);
      }
    });
  }

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <title>Sledge</title>
          <Suspense>
            <div class={[flexCol, h100, getTheme(globalConfig.appearance.theme)].join(' ')}>
              <TitleBar />
              <main>{props.children}</main>
              <DebugViewer />
            </div>
          </Suspense>
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
