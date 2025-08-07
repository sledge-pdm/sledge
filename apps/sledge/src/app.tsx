// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import TitleBar from './components/global/TitleBar';
import About from './routes/about/index';
import Editor from './routes/editor/index';
import Home from './routes/start/index';

import { flexCol, h100 } from '@sledge/core';
import { getTheme } from '@sledge/theme';
import DebugViewer from '~/components/debug/DebugViewer';
import { loadGlobalSettings } from '~/io/config/load';
import Splash from '~/routes/splash';
import { globalConfig } from '~/stores/GlobalStores';
import Settings from './routes/settings/index';
import { listenEvent } from './utils/TauriUtils';

export default function App() {
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
      <Route path='/about' component={About} />
      <Route path='/splash' component={Splash} />
    </Router>
  );
}
