// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { onCleanup, onMount } from 'solid-js';
import TitleBar from './components/global/TitleBar';
import About from './routes/about/index';
import Editor from './routes/editor/index';
import Home from './routes/start/index';

import { flexCol, h100 } from '@sledge/core';
import { getTheme } from '@sledge/theme';
import { webGLRenderer } from '~/components/canvas/stacks/WebGLCanvas';
import DebugViewer from '~/components/debug/DebugViewer';
import { loadGlobalSettings } from '~/io/config/load';
import { globalConfig } from '~/stores/GlobalStores';
import Settings from './routes/settings/index';
import { listenEvent } from './utils/TauriUtils';

export default function App() {
  onMount(async () => {
    await loadGlobalSettings();
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
      <Route path='/about' component={About} />;
    </Router>
  );
}
