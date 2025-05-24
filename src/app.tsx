// @refresh reload
import { MetaProvider } from '@solidjs/meta';
import { Route, Router } from '@solidjs/router';
import { Suspense } from 'solid-js';
import TitleBar from './components/global/TitleBar';
import Home from './routes';
import About from './routes/about';
import Editor from './routes/editor';

import Settings from './routes/settings';
import { getTheme } from './stores/Theme';
import { flexCol, h100 } from './styles/snippets.css';

export default function App() {
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
