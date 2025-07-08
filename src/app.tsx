// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { Suspense } from 'solid-js';
import TitleBar from './components/global/TitleBar';
import Home from './routes';
import About from './routes/about';
import Editor from './routes/editor';

import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import loadGlobalSettings from './io/config/load';
import setGlobalSettings from './io/config/set';
import Settings from './routes/settings';
import { getTheme } from './stores/Theme';
import { flexCol, h100 } from './styles/snippets.css';
import { listenEvent } from './utils/TauriUtils';

export default function App() {
  document.addEventListener('DOMContentLoaded', () => {
    if (window instanceof Window) {
      const globalConfig = (window as any).__CONFIG__;
      if (globalConfig) {
        // Load global config from window object
        setGlobalSettings(globalConfig);
        console.log('global settings loaded from window object:', globalConfig);
      } else {
        // Fallback to loading from Rust?
      }
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
          <div class={[flexCol, h100, getTheme()].join(' ')}>
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
