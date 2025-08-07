// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { onCleanup } from 'solid-js';
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
  onCleanup(() => {
    if (!import.meta.hot) {
      webGLRenderer?.dispose();
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
          <div class={[flexCol, h100, getTheme(globalConfig.appearance.theme)].join(' ')}>
            <TitleBar />
            <main>{props.children}</main>
            <DebugViewer />
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
